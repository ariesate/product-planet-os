import { createElement, useViewEffect, render, useRef, reactive, createComponent, atom, propTypes, watch, computed } from 'axii'
import { useVersion } from '@/layouts/VersionLayout'
import ButtonNew from '@/components/Button.new'
// const { K6, Register, Graph, NodeForm, MiniMap } = k6
import { Shape, Addon } from '@antv/x6'
import { Graph, imageShapes, SCOPE } from './Graph'
import { Stencil } from './Stencil'
import { ProtoDraft, PageStatus } from '@/models'
import HelpIcon from 'axii-icons/Help'
import AddPicIcon from 'axii-icons/AddPic'
import CloseIcon from 'axii-icons/Close'
import Modal from '@/components/Modal'

import { Dialog } from '@/components/Dialog/Dialog'
import { getImageFromSrc } from './util'
import shortcut from '@/tools/shortcut'
import api from '@/services/api'

// const registerHTMLComponent = (key, Component) => {
//   Graph.registerHTMLComponent(key, (node) => {
//     const data = node.getData()
//     const wrap = document.createElement('div')
//     const renderController = render(
//         <Component
//           data={data}
//         />, wrap)
//     return wrap
//   })
// }

// registerHTMLComponent('test', ComponentNode)

ProtoDraftEditor.propTypes = {
  config: propTypes.object.default(() => reactive({}))
}

function ProtoDraftEditor ({ config }) {
  const version = useVersion()

  const helpVisible = atom(false)
  const configVisible = atom(false)

  const loading = {
    save: atom(false),
    uploadDesign: atom(false),
    uploadProto: atom(false)
  }
  const currGraph = atom({})

  const initRender = (graph) => {
    graph.clearCells()
    const nodes = JSON.parse(config.data?.protoDraft?.protoNodes || '[]')
    nodes.forEach(node => {
      graph.addNode({ ...node, data: node })
    })
  }

  const handleDbClick = ({ cell, e }) => {
    configVisible.value = true
    const name = 'node-editor'
    cell.removeTool('node-editor')
    cell.addTools({
      name,
      args: {
        event: e,
        attrs: {
          backgroundColor: '#EFF4FF'
        }
      }
    })
  }

  const handleBackspace = (graph) => {
    if (configVisible.value) return null
    const cells = graph.getSelectedCells()
    if (cells.length) {
      graph.removeCells(cells)
    }
  }

  useViewEffect(() => {
    const graph = new Graph({ container: document.getElementById('draftContainer') })
    graph.on('cell:dblclick', handleDbClick)
    graph.on('blank:click', () => { configVisible.value = false })
    graph.bindKey('backspace', handleBackspace.bind(this, graph))
    // #region 初始化 stencil
    const stencil = new Stencil({ target: graph, container: document.getElementById('stencil') })
    currGraph.value = graph
    initRender(graph)

    watch(() => config.data, () => {
      initRender(graph)
    })
    return () => {
      graph.dispose()
    }
  })

  const handlePaste = async (e) => {
    if (e.target?.files?.length) {
      const file = e.target.files[0]
      const name = `proto/image/${version.value?.id}-${Date.now()}`
      const url = await api.$upload(file, name)
      addImage(url)
    }
  }

  const addImage = async (url, type) => {
    if (!url) {
      Modal.confirm({
        title: `当前状态没有${type === 'uploadProto' ? '原型图' : '设计图'}`
      })
      return
    }
    loading[type].value = true
    const img = await getImageFromSrc(url)
    const response = await fetch(url)
    const blob = await response.blob()
    const file = new File([blob], 'prototype.png', { type: blob.type })
    const name = `proto/image/${version.value?.id}-${Date.now()}.png`
    const newUrl = await api.$upload(file, name)
    currGraph.value?.addNode({
      shape: 'image',
      width: img.width,
      height: img.height,
      imageUrl: newUrl
    })
    loading[type].value = false
  }

  useViewEffect(() => {
    // 快捷键限定 scope
    shortcut.enter(SCOPE)
    return () => shortcut.leave(SCOPE)
  })

  const handleSave = async () => {
    loading.save.value = true
    const graph = currGraph.value
    const nodes = graph.getNodes()
    if (nodes?.length > 0) {
      const saveList = nodes.map(node => {
        const store = node.store?.data || {}
        const { id, shape, angle, position = {}, attrs = {}, size = {}, zIndex } = store

        const saveNode = {
          id,
          shape,
          angle,
          zIndex,
          x: position.x,
          y: position.y,
          width: size.width,
          height: size.height,
          label: attrs.text?.text
        }
        if (attrs.image?.['xlink:href']) {
          saveNode.imageUrl = attrs.image?.['xlink:href']
        }
        return saveNode
      })
      graph.toPNG(async (dataUri) => {
        await config.onSave(saveList, dataUri)
        loading.save.value = false
      })
    }
  }

  const handleCancel = () => {
    config.onCancel()
    // 重置修改
    initRender(currGraph.value)
  }

  return (
    <container block block-position-relative block-width="100%" block-height="100%">
      <title block block-padding-14px flex-display flex-justify-content-space-between flex-align-items-center>
        <div block>绘制原型图<span inline block-margin-left-10px style={{ verticalAlign: 'middle', cursor: 'pointer' }}><HelpIcon onClick={() => { helpVisible.value = true }} /></span></div>
        <div block block-margin-right-35px flex-display flex-direction-row flex-align-items-center style={{ cursor: 'pointer' }}>
          <div>
            <input onInput={handlePaste} type="file" block block-position-absolute block-width-30px block-height-30px style={{ opacity: 0, fontSize: 0, cursor: 'pointer' }}></input>
            <AddPicIcon size={2} layout:block layout:block-margin-right-10px onClick={() => {}} />
          </div>
          <ButtonNew loading={loading.uploadProto} layout:block layout:block-margin-right-10px onClick={addImage.bind(this, config.data.proto, 'uploadProto')} >导入原型图</ButtonNew>
          <ButtonNew loading={loading.uploadDesign} layout:block layout:block-margin-right-10px onClick={addImage.bind(this, config.data.designPreviewUrl, 'uploadDesign')} >导入设计图</ButtonNew>
          <ButtonNew primary onClick={handleSave} loading={loading.save}>保存</ButtonNew>
        </div>
        <CloseIcon size={1.2} block block-position-absolute style={{ top: '10px', right: '10px' }} onClick={handleCancel} />
      </title>
      <draftContent block flex-display flex-direction-row block-position-relative block-width="100%" block-height="100%">
        <div id="stencil" block block-position-relative block-width="20%" block-height="100%"></div>
        <div id="draftContainer" block block-position-relative block-width="100%" block-height="100%"></div>
      </draftContent>
      <Dialog
        visible={helpVisible}
        title="使用帮助"
        onCancel={() => {
          helpVisible.value = false
        }}
        onSure={() => {
          helpVisible.value = false
        }}>
        <div>
          快捷键说明
          <ul>
            <li><b>meta+c,ctrl+c：</b>复制节点</li>
            <li><b>meta+x,ctrl+x：</b>剪切节点</li>
            <li><b>meta+v,ctrl+v：</b>粘贴节点</li>
            <li><b>meta+z,ctrl+z：</b>回撤</li>
            <li><b>meta+shift+z,ctrl+shift+z：</b>重做</li>
            <li><b>meta+a,ctrl+a：</b>全选</li>
            <li><b>esc：</b>取消选中</li>
            <li><b>o：</b>添加圆形</li>
            <li><b>r：</b>添加矩形</li>
            <li><b>t：</b>添加文本</li>
          </ul>
        </div>
      </Dialog>
    </container>
  )
}

ProtoDraftEditor.Style = (frag) => {
  const el = frag.root.elements
  el.container.style({
    background: '#fff',
    border: '0 solid #dcdfe6',
    borderRadius: '8px',
    boxShadow: '0 20px 30px 0 rgb(0 0 0 / 15%)',
    overflow: 'hidden'
  })
  el.title.style({
    fontSize: '16px',
    fontWeight: 400,
    background: 'transparent',
    color: '#1f2633',
    boxShadow: '0 1px 4px 0 rgb(0 21 41 / 12%)',
    cursor: 'pointer'
  })
  el.draftContainer.style({
    background: '#fff'
  })
  el.protoMask.style({
    left: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,.2)',
    zIndex: 100,
    color: 'white',
    fontSize: 48
  })
}

export default createComponent(ProtoDraftEditor)

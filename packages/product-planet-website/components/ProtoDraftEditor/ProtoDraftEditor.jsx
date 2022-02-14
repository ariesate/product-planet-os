import { createElement, useViewEffect, render, useRef, reactive, createComponent, atom, propTypes, watch } from 'axii'
import { EREditor2, k6 } from 'axii-x6'
import { useVersion } from '@/layouts/VersionLayout'
import { getProductERModel } from '@/services/product'
import ButtonNew from '@/components/Button.new'
// const { K6, Register, Graph, NodeForm, MiniMap } = k6
import { Shape, Addon } from '@antv/x6'
import { Graph, imageShapes } from './Graph'
import { Stencil } from './Stencil'
import Dialog from '../Dialog'
import { right } from '@antv/x6/lib/registry/port-layout/line'
import { ProtoDraft, PageStatus } from '@/models'

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
  const configVisible = atom(false)
  const loading = atom(false)

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

    watch(() => config.data?.protoDraft, () => {
      initRender(graph)
    })
    return () => {
      graph.dispose()
    }
  })

  const handleSave = async () => {
    loading.value = true
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
        return saveNode
      })
      graph.toPNG(async (dataUri) => {
        await config.onSave(saveList, dataUri)
        loading.value = false
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
        <div block>绘制原型图</div>
        <div block>
          <ButtonNew layout:inline layout:block-margin-right-10px onClick={handleCancel}>取消</ButtonNew>
          <ButtonNew primary onClick={handleSave} loading={loading}>保存</ButtonNew>
        </div>
      </title>
      <draftContent block flex-display flex-direction-row block-position-relative block-width="100%" block-height="100%">
        <div id="stencil" block block-position-relative block-width="20%" block-height="100%"></div>
        <div id="draftContainer" block block-position-relative block-width="100%" block-height="100%"></div>
      </draftContent>
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
    boxShadow: '0 1px 4px 0 rgb(0 21 41 / 12%)'
  })
  el.draftContainer.style({
    background: '#fff'
  })
}

export default createComponent(ProtoDraftEditor)

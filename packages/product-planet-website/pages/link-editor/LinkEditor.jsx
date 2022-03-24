/** @jsx createElement */
import {
  createComponent,
  createElement,
  useViewEffect,
  useRef,
  reactive,
  atom,
  debounceComputed,
  atomComputed
} from 'axii'
import { useVersion } from '@/layouts/VersionLayout'
import { k6 } from 'axii-x6'
import { PageNode, convertToGraphData, PagePort, PageLink, linkShareData } from './Link2'
import { getProductStruct, getObjectPreviewUrl } from '@/services/product'
import ButtonNew from '@/components/Button.new'
import { TipPopover } from './TipPopover'
import CaseList from '@/pages/case-editor/CaseList'
import useHideLayout from '@/hooks/useHideLayout'
import { UseCase } from '@/models'
import { DagreLayout } from '@antv/layout'
import Modal from '@/components/Modal'
const { confirm } = Modal
const { K6, Register, Graph, NodeForm, ShareContext, Toolbar } = k6

const Toolbar2 = Toolbar.extend(frag => {
  const ele = frag.root.elements
  ele.quickKeys.style({
    minWidth: 650
  })
})

const EDITOR_ID = 'pp-link'

// @TODO：鉴于Radio样式问题，此处先实现个简单的
function Mode (props) {
  const { options = [], value } = props

  return (
    <mode inline flex-display flex-align-items-center >
      {() => options.map(op => {
        const style = {
          backgroundColor: null,
          boxSizing: 'border-box',
          margin: '0 8px 0 0',
          fontSize: '14px',
          color: '#666',
          padding: 0,
          cursor: 'pointer'
        }
        if (op.key === value.value) {
          Object.assign(style, {
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            fontSize: '12px',
            padding: '4px 8px',
            color: '#fff',
            cursor: 'default'
          })
        }
        return (
          <option
            inline
            key={op.key}
            value={op.value}
            style={style}
            onClick={() => (value.value = op.key)} >
            {op.name}
          </option>
        )
      })}
    </mode>
  )
}

export function LinkEditor (props) {
  const { data, readOnly = atom(false), graphConfig = {}, isLinkEditor } = props
  const version = useVersion()
  const versionId = version.value.id
  const productName = version.value.product.name
  const productId = version.value.product.id
  const productLogo = atomComputed(() => version.value.product.logo)
  const { isHideLayout } = useHideLayout()
  // TODO：先手工计算下画布高度, 减掉的数字是页面导航+留白的占据的高度
  const graphHeight = document.body.offsetHeight - (isHideLayout.value ? 0 : 64 + 40)
  const graphData = convertToGraphData(data)

  const showPageId = atom(null)
  // const pageDetailVisible = atom(false)

  const tipContent = [
    '1.双击页面：编辑原型',
    '2.双击画布空白处：新增页面',
    '3.双指缩放或按住shift键并滚动滚轮：缩放画布',
    '4.右键点击页面：新增子页面',
    '5.选中页面并按下tab键：新增子页面',
    '6.选中页面并按下Enter键：新增兄弟页面'
  ]

  const dmRef = useRef()
  window.dmRef = dmRef

  window.addEventListener('resize', () => {
    console.log('body', document.body)
    const newWidth = document.body.offsetWidth - 408
    const newHeight = document.body.offsetHeight - (isHideLayout.value ? 0 : 64 + 40)
    dmRef.current.resize(newWidth, newHeight)
  })

  // 自动布局间隔
  const LAYOUT_SEP = { rank: 40, node: 30 }

  linkShareData.VERSION_ID = versionId
  linkShareData.PRODUCT_ID = productId

  useViewEffect(() => {
    console.log('[LinkEditor] mounted')
    return () => {
      console.log('[LinkEditor] unmount')
    }
  })

  const nodeMode = atom('struct')

  // 自动布局
  const handleLayoutAuto = () => {
    debounceComputed(() => {
      const nodes = dmRef.current.nm.nodes
      const edges = []
      const nodesArray = []
      // dargreLayout只支持string类型id，暂时这样处理，后续axii封装
      nodes.forEach(node => {
      // 隐藏节点不进行自动布局
        if (!node.data.isHide) {
          node.id = String(node.id)
          // 重置节点宽高
          node.size = { height: 218, width: 240 }
          if (node.edges && node.edges.length > 0) {
            edges.push(...node.edges)
          }
          nodesArray.push(node)
        }
      })
      const edgesArray = edges.filter(edge => {
        const sourceId = String(edge.source.cell)
        const targetId = String(edge.target.cell)
        return nodesArray.find(node => node.id === sourceId) && nodesArray.find(node => node.id === targetId)
      })
      edgesArray.forEach(edge => {
        edge.source.port = edge.source.cell + '-5'
        edge.target.port = edge.target.cell + '-6'
        dmRef.current.syncEdge(edge.id, { source: edge.source, target: edge.target })
      })
      // 分层布局
      const dagreLayout = new DagreLayout({
        type: 'dagre',
        rankdir: 'TB',
        align: 'UL',
        ranksep: LAYOUT_SEP.rank,
        nodesep: LAYOUT_SEP.node
      })
      dagreLayout.layout({ nodes: nodesArray, edges: edgesArray })
      nodesArray.forEach(node => {
        node.id = Number(node.id)
        dmRef.current.syncNode(node.id, { x: node.x, y: node.y }, true)
      })
    })
  }

  function onClickPage (p) {
    props.onClickPage && props.onClickPage(p)
  }

  function onChangeNode (id, obj) {
    return dmRef.current.syncNode(id, obj, true)
  }

  function onChangeEdge (id, obj) {
    return dmRef.current.syncEdge(id, obj, true)
  }

  function onBeforeRemove () {
    return new Promise(resolve => {
      confirm({
        title: '是否确认删除',
        onOk () {
          resolve(true)
        },
        onCancel () {
          resolve(false)
        }
      })
    })
  }

  return (
    <linkEditor block block-height="100%">
      <ShareContext.Provider value={{
        productId,
        versionId,
        productName,
        productLogo,
        nodeMode,
        readOnly,
        onClickPage,
        onChangeNode,
        onChangeEdge,
        handleLayoutAuto
      }}>
        {() => isLinkEditor
          ? <TipPopover tipTittle={'快捷操作'} tipContent={tipContent} offsetY={'40px'} offsetX={'20px'} tipName={'LinkEditorTip'} hasIcon={true} height={'300px'}></TipPopover>
          : null}
        <K6 height={graphHeight} ref={dmRef} readOnly={readOnly} graphConfig={graphConfig}>
          <Register node={PageNode} port={PagePort} edge={PageLink} />
            <Toolbar2
              onBeforeRemove={onBeforeRemove}
              extra={[
                <ButtonNew key="add" size="small" primary k6-add-node >
                  新增页面
                </ButtonNew>,
                <ButtonNew key="autoLayout" size="small" primary onClick={handleLayoutAuto}>自动布局</ButtonNew>,
                <pageModes key="modes" inline flex-display flex-align-items-center>
                  <span>
                    视图模式：
                  </span>
                  <Mode value={nodeMode} options={[
                    { key: 'struct', name: '结构图' },
                    { key: 'ui', name: '缩略图' },
                    { key: 'monitor', name: '监控信息' }
                  ]} />
                </pageModes>
              ]}
              tip=""
            />
            <Graph data={graphData} />
          {{
            nodeForm: <NodeForm />
          }}
        </K6>
      </ShareContext.Provider>
    </linkEditor>
  )
}

export default createComponent(() => {
  const version = useVersion()
  if (!version.value) {
    return
  }
  const linkData = reactive({
    pages: null,
    links: []
  })
  // const showPageDetail = atom(0)
  const productId = version.value.product.id
  const versionId = version.value.id

  const graphConfig = {
    panning: {
      enabled: false
    },
    snapline: {
      enabled: true
    },
    grid: {
      size: 15,
      visible: true
    },
    selecting: {
      enabled: true,
      multiple: true,
      rubberband: true,
      movable: true,
      showNodeSelectionBox: true
    },
    scroller: true,
    mousewheel: {
      enabled: true,
      modifiers: ['ctrl', 'meta', 'shift'],
      minScale: 0.2,
      factor: 1.1,
      maxScale: 1
    },
    keyboard: true
  }

  console.log('[LinkContainer] mounted')

  useViewEffect(() => {
    getProductStruct(versionId).then(r => {
      if (r.pageMessage) {
        r.page.forEach(p => {
          if (r.pageMessage[p.id]) {
            const { pv, error, warning } = r.pageMessage[p.id]
            p.pv = pv
            p.error = error
            p.warning = warning
          }
        })
      }

      Object.assign(linkData, {
        links: r.links,
        pages: r.page
      })
    })
    // TODO: for dev
    UseCase.find({ where: { version: versionId } }).then(r => {
      if (r && r.length > 0) {
        setTimeout(() => {
          // historyLocation.goto(`case/${r[0].id}`)
        }, 500)
      }
    })
  })
  return (
    <linkContainer id={EDITOR_ID} block block-width="100%" block-height="100%" flex-display >
      <CaseList layout:block-width="200px" productId={productId} versionId={versionId} />
      <editor block flex-grow="1" >
        {() => linkData.pages ? <LinkEditor key="le" data={linkData} isLinkEditor={true} graphConfig={graphConfig}/> : ''}
      </editor>
    </linkContainer>
  )
})

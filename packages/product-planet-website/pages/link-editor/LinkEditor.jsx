/** @jsx createElement */
import {
  createComponent,
  createElement,
  useViewEffect,
  useRef,
  reactive,
  atom
} from 'axii'
import { usePopover } from 'axii-components'
import { useVersion } from '@/layouts/VersionLayout'
import { k6 } from 'axii-x6'
import { PageNode, convertToGraphData, PagePort, PageLink, linkShareData } from './Link2'
import { getProductStruct, getObjectPreviewUrl } from '@/services/product'
import ButtonNew from '@/components/Button.new'
// import PageDetail from './PageDetail'
import CaseList from '@/pages/case-editor/CaseList'
import useHideLayout from '@/hooks/useHideLayout'
import AttentionIcon from 'axii-icons/Attention'
import { UseCase } from '@/models'
import { DagreLayout } from '@antv/layout'
import { debounce } from 'lodash'
import Modal from '@/components/Modal'
const { confirm } = Modal
const { K6, Register, Graph, NodeForm, ShareContext, Toolbar } = k6

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
  const { data, readOnly = atom(false), graphConfig = {} } = props
  const version = useVersion()
  const versionId = version.value.id
  const productName = version.value.product.name
  const productId = version.value.product.id
  const productLogo = atom('')
  const { isHideLayout } = useHideLayout()
  // TODO：先手工计算下画布高度, 减掉的数字是页面导航+留白的占据的高度
  const graphHeight = document.body.offsetHeight - (isHideLayout.value ? 0 : 64 + 40)
  const graphData = convertToGraphData(data)

  const showPageId = atom(null)
  // const pageDetailVisible = atom(false)

  const dmRef = useRef()
  window.dmRef = dmRef

  // 自动布局间隔
  const LAYOUT_SEP = { rank: 100, node: 120 }

  const attentionBox = <box style={{ margin: '10px', 'font-size': '14px' }}>按住shift键可框选移动多个页面</box>
  const { visible: attentionVisible, node: attentionNode, source: attentionSource } = usePopover(attentionBox)

  linkShareData.VERSION_ID = versionId
  linkShareData.PRODUCT_ID = productId

  useViewEffect(() => {
    const { logoBucket, logoPath } = version.value.product
    if (logoBucket && logoPath) {
      getObjectPreviewUrl(logoBucket, logoPath).then(url => {
        productLogo.value = url
      })
    }
    console.log('[LinkEditor] mounted')
    return () => {
      console.log('[LinkEditor] unmount')
    }
  })

  const nodeMode = atom('struct')

  // 自动布局
  const handleLayoutAuto = debounce(() => {
    const nodesArray = dmRef.current.nm.nodes
    const edges = []
    // dargreLayout只支持string类型id，暂时这样处理，后续axii封装
    nodesArray.forEach(node => {
      node.id = String(node.id)
      if (node.edges && node.edges.length > 0) {
        edges.push(...node.edges)
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
      dmRef.current.syncEdge(edge.id, { source: edge.source, target: edge.target }, true)
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
  }, 300)

  function onClickAttention () {
    attentionVisible.value = !attentionVisible.value
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
        onChangeEdge
      }}>
        <K6 height={graphHeight} ref={dmRef} readOnly={readOnly} graphConfig={graphConfig}>
          <Register node={PageNode} port={PagePort} edge={PageLink} />
            <Toolbar
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
                    { key: 'ui', name: '缩略图' }
                  ]} />
                </pageModes>,
                <attention key="attention">
                  <attentionItem inline inline-height='24px' flex-display flex-align-items-center ref={attentionSource} onClick={onClickAttention}>
                    <AttentionIcon size="20" unit="px" />
                  </attentionItem>
                  {attentionNode}
                </attention>
              ]}
              tip="快捷操作：双击下方中的页面编辑原型，双击空白处新增页面，按住shift键滚动缩放画布"
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
      minScale: 0.1
    }
  }

  console.log('[LinkContainer] mounted')

  useViewEffect(() => {
    getProductStruct(productId).then(r => {
      if (r.pageMessage) {
        r.page.forEach(p => {
          if (r.pageMessage[p.id]) {
            const { pv, error } = r.pageMessage[p.id]
            p.pv = pv
            p.error = error
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
        {() => linkData.pages ? <LinkEditor key="le" data={linkData} graphConfig={graphConfig}/> : ''}
      </editor>
    </linkContainer>
  )
})

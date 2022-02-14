/** @jsx createElement */
import {
  atomComputed,
  Fragment,
  createElement,
  createComponent,
  useViewEffect,
  reactive,
  watch,
  computed,
  useContext,
  useRef
} from 'axii'
import ConfigPanel from './ConfigPanel'
import { Navigation, Page, Link, LinkPort } from '@/models'
import debounce from 'lodash/debounce'
import LinkConfigJSON from './Link.k6'
import CloseOne from 'axii-icons/CloseOne'
import HandPaintedPlate from 'axii-icons/HandPaintedPlate'
import { k6 } from 'axii-x6'
import ImageViewer from '@/components/ImageViewer'
import { historyLocation } from '@/router'
import { useVersion } from '@/layouts/VersionLayout'
import { useLcpConfig } from './config'
import { openFullscreenAnimation } from '@/components/FullscreenAnimation'
import Modal from '@/components/Modal'
const { confirm } = Modal

const { ShareContext } = k6

export const linkShareData = {
  VERSION_ID: null,
  PRODUCT_ID: null
}

const UNIT_X = 30

const PERCENT = 100

export function convertToGraphData (data) {
  let i = 1
  const pages = data.pages.map(p => {
    const result = {
      id: p.id,
      name: p.name,
      shape: PageNode.shape,
      size: PageNode.size,
      isHide: p.isHide || false,
      hideChildren: p.hideChildren || false,
      childrenNum: p.childrenNum || 0,
      data: {
        ...p
      },
      x: p.posX ? p.posX : UNIT_X * i,
      y: p.posY ? p.posY : UNIT_X * (i++)
    }
    return result
  })
  const links = data.links.map(l => {
    const result = {
      id: l.id,
      name: l.name,
      data: {
        name: l.name,
        type: l.type
      },
      source: {
        cell: l.source_page,
        port: `${l.source_page}-5`
      },
      target: {
        cell: l.target_page,
        port: `${l.target_page}-6`
      },
      visible: l.visible === null ? true : !!l.visible
    }
    return result
  }).filter(link => {
    // TIP：过滤脏数据，确保每个link都是有效的连接
    const sourceId = link.source.cell
    const targetId = link.target.cell
    return pages.find(p => p.id === sourceId) && pages.find(p => p.id === targetId)
  })
  return {
    nodes: pages,
    edges: links
  }
}

export const PageLink = ((() => {
  function PageLink ({ node, edge }) {
    const target = edge.target.cell

    watch(() => [edge.source.port, edge.target.port], () => {
      setTimeout(async () => {
        const oldEdge = await Link.find({
          fields: ['id', 'source', 'target'],
          where: {
            id: edge.id
          }
        })
        if (oldEdge[0].source.name !== edge.source.name) {
          LinkPort.update(oldEdge[0].source.id, { name: edge.source.port, page: edge.source.cell })
        }
        if (oldEdge[0].target.name !== edge.target.name) {
          LinkPort.update(oldEdge[0].target.id, { name: edge.target.port, page: edge.target.cell })
        }
      })
    })

    const resultConfig = computed(() => {
      let trans = ''
      const from = node.data.pv
      const to = node.next.find(p => p.id === target)?.data?.pv
      if (from !== undefined && to !== undefined) {
        let p = to === 0 ? 0 : to / from
        if (!isNaN(p)) {
          p = p * PERCENT
          if (p > PERCENT) {
            p = PERCENT
          }
          trans = `（${p.toFixed(0)}%）`
        }
      }
      return {
        labels: [
          {
            attrs: {
              label: {
                text: `${edge.data.name || ''} ${edge.data.type || ''}${trans}`
              }
            },
            position: {
              distance: -20
            }
          }
        ],
        zIndex: -1,
        // router: {
        //   name: 'manhattan'
        // },
        lineColor: getNodeStyleColor(node, true)
      }
    })
    return resultConfig
  }
  PageLink.configJSON = LinkConfigJSON

  PageLink.onChange = debounce(async (nodeConfig, edgeConfig) => {
    await Link.update(edgeConfig.id, {
      name: edgeConfig.data.name,
      type: edgeConfig.data.type
    })
  }, 1500)

  PageLink.onAdd = async (nodeConfig, edge) => {
    const r = Link.createLink(
      {
        name: `${edge.source.cell}-5`,
        page: edge.source.cell
      },
      {
        name: `${edge.target.cell}-6`,
        page: edge.target.cell
      }
    )
    return r
  }
  PageLink.onSave = async (nodeConfig, edge) => {
    await Link.update(edge.id, {
      name: edge.data.name,
      type: edge.data.type
    })
  }
  PageLink.onRemove = (nodeConfig, edge) => {
    Link.remove(edge.id)
  }

  return PageLink
})())

/**
 * 检索节点的父链（单条或一条）是否全部有异常，如果是，则当前也异常
 */
function traverseParentError (node, traversedMap = new Map()) {
  // 防止圈
  if (traversedMap.get(node.id) !== undefined) {
    return traversedMap.get(node.id)
  }
  if (node.data.error > 0) {
    return true
  }
  const r = node.prev.length && node.prev.every(n => n.data.error > 0)
  traversedMap.set(node.id, !!r)
  if (!r && node.prev.length > 0) {
    return r || node.prev.every(pn => traverseParentError(pn, traversedMap))
  }
  return r
}

function getNodeStyleColor (node, isLine = false) {
  const styleLayers = {
    normal: '#333333',
    warn: '#ffc53d',
    error: '#ff4530'
  }
  if (isLine) {
    styleLayers.normal = '#1d59f2'
  }
  let y = 'normal'
  // 当前有异常
  if (node.data.error > 0) {
    y = 'error'
  } else if (traverseParentError(node)) {
    // 或者是唯一的父级链路有异常
    y = 'warn'
  }
  return styleLayers[y]
}

export const PagePort = createComponent((() => {
  function PagePort (props) {
    return (
      <pagePort data-node-id={props.node.id} data-port-id={props.port.id} >
      </pagePort>
    )
  }
  PagePort.Style = (frag) => {
    const el = frag.root.elements
    el.pagePort.style((p) => {
      return {
        width: '16px',
        height: '16px',
        backgroundColor: '#fff',
        borderRadius: '100%',
        border: '1px solid #aaa',
        display: 'block'
      }
    })
  }
  const configArr = []
  PagePort.getConfig = (nodeId) => configArr.filter(c => c.nodeId === nodeId || !nodeId)
  PagePort.RegisterPort = (props = {}) => {
    const reg = useRef()
    const config = reactive({
      nodeId: props.nodeId,
      portId: props.portId,
      position: {
        x: props.x,
        y: props.y
      },
      size: {
        width: 16,
        height: 16
      }
    })
    configArr.push(config)

    useViewEffect(() => {
      const portDOM = reg.current.childNodes[0]
      config.position.x = portDOM.offsetLeft
      config.position.y = portDOM.offsetTop

      return () => {
        const i = configArr.indexOf(config)
        configArr.splice(i, 1)
      }
    })

    return <regPort ref={reg}>{props.children}</regPort>
  }
  return PagePort
})())

export const PageNode = createComponent((() => {
  function DisplaySimpleDetail (props) {
    const { error, pv } = props

    const errorStyle = atomComputed(() => {
      if (error) {
        return { color: 'red' }
      }
    })

    return (
      <displaySimpleDetail block block-margin="0 0 4px 0"
        style={{ fontSize: '14px' }}>
          <contentPV block>
            <contentTitle block >PV</contentTitle>
            <contentValue block >{pv}</contentValue>
          </contentPV>
          <contentError block >
            <contentTitle block >error</contentTitle>
            <contentValue block style={errorStyle}>{error}</contentValue>
          </contentError>
      </displaySimpleDetail>
    )
  }
  DisplaySimpleDetail.Style = (frag) => {
    const el = frag.root.elements
    el.contentTitle.style({
      color: '#8C8C8C',
      lineHeight: '20px'
    })
    el.contentValue.style({
      color: '#434343',
      fontSize: '28px',
      lineHeight: '36px',
      textAlign: 'left'
    })
  }
  const DisplaySimpleDetailCpt = createComponent(DisplaySimpleDetail)

  function DisplayAllNavigators (props) {
    const { navbars } = props
    const childrenMap = reactive({})
    const navInsArr = computed(() => {
      return navbars.map(navItem => {
        if (navItem) {
          const navIns = new Navigation(navItem)
          navIns.loadChildren().then(r => {
            childrenMap[navItem.id] = navIns.children
          })
          return navIns
        }
        return null
      })
    })

    useViewEffect(() => {
    })

    return (<>
      {() => {
        if (navInsArr.filter(o => o && o.name).length <= 0) {
          return <span style={{ color: '#999' }}>未定义导航</span>
        } else {
          const list = []
          const childrenMapList = Object.values(childrenMap).flat()
          if (childrenMapList.length > 0) {
            childrenMapList.forEach(navItem => {
              list.push(
              <navItem key={navItem.id} block block-margin="0 0 3px 0" style={{
                width: '100%',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                color: '#666',
                lineHeight: '28px'
              }}>
              {navItem.name}
              </navItem>)
            })
          }
          return <navItemList>{list}</navItemList>
        }
      }}
    </>)
  }

  function DisplayProcessOfTasks (props) {
    const { taskInfos } = props

    return (<>
      {() => {
        if (!taskInfos) {
          return <span style={{ color: '#999' }}>未关联任务</span>
        } else {
          let endCount = 0
          const data = Object.keys(taskInfos)
          Object.keys(taskInfos).forEach(key => {
            const info = taskInfos[key]
            if (info.statusPhase === 'END') endCount++
          })
          return <span style={{ color: '#999' }}>{() => `${endCount} / ${data.length}`}</span>
        }
      }}
    </>)
  }

  function DisplayBlocks (props) {
    const { chunks = [] } = props

    return (
      <blocks block block-width="100%" >
        {() => chunks.length > 0
          ? (
          <blockTitle block style={{ fontSize: '12px' }}>页面区块</blockTitle>
            )
          : ''}
        {() => {
          if (chunks.length <= 0) {
            return (
              <span block style={{ color: '#999' }}></span>
            )
          }
          return chunks.map(c => {
            return (
              <blockRow key={c.id} block block-margin="6px 0" block-padding="2px 4px" style={{
                color: '#666',
                fontSize: '13px',
                border: '1px solid #999'
              }} >
                {c.name}
              </blockRow>
            )
          })
        }}
      </blocks>
    )
  }
  function buildSiteUrl (nodeId, nodeName, nodePath, params) {
    const simplifyTypes = {
      string: 'str',
      boolean: 'bool',
      array: 'arr',
      number: 'num',
      object: 'obj'
    }

    let search = ''
    if (params.length > 0) {
      search = '?' + params.map(p => `${p.name}=${simplifyTypes[p.type] || p.type}`).join('&')
    }
    let path = nodePath || `/page-${nodeId}`
    if (!/^\//.test(path)) {
      path = `/${path}`
    }
    return `${path}${search}`
  }

  /**
   * 视图1：产品抽象结构
   */
  const ProductStruct = function (props) {
    const { node } = props
    const { data } = node
    const shareContext = useContext(ShareContext)

    return (
      <structBody block flex-display flex-direction-column block-height="100%">
        <bodyContent block flex-display flex-grow="1" >
          <bodyMenus block block-width="96px" >
            <bodyMenusTitle block>导航栏：</bodyMenusTitle>
            {() => {
              return <DisplayAllNavigators navbars={data.navbars} />
            }}
            <bodyMenusTitle block>任务进度：</bodyMenusTitle>
            {() => {
              return <DisplayProcessOfTasks taskInfos={data.taskInfos} />
            }}
          </bodyMenus>
          <bodyRight block block-padding="6px" flex-grow="1">
            <DisplaySimpleDetailCpt error={data.error} pv={data.pv} pageId={node.id} />
            <DisplayBlocks chunks={data.chunks}/>
          </bodyRight>
        </bodyContent>
      </structBody>
    )
  }
  ProductStruct.Style = (frag) => {
    const el = frag.root.elements
    el.bodyContent.style({
      border: '1px solid #999',
      borderRadius: '0 0 10px 10px'
    })
    el.bodyMenus.style({
      borderRight: '1px solid #999',
      fontSize: '12px',
      textAlign: 'left',
      padding: '6px',
      // height: '151px',
      overflow: 'scroll'
    })
    el.bodyMenusTitle.style({
      lineHeight: '28px',
      color: '#222'
    })
  }
  const ProductStructCpt = createComponent(ProductStruct)

  // test/page.blank.snail.001.png
  /**
   * 视图2：缩略图
   */
  function Snail (props) {
    const data = props.node.data
    const { lcdpAppId } = props
    const { lcdpUrl } = useLcpConfig()
    const src = data.designPreviewUrl
    return (
      <snail block block-height="100%" flex-display style={{ overflow: 'hidden', backgroundColor: '#F3F4F8', border: '1px solid #999', borderRadius: '0 0 10px 10px' }}>
        {() => {
          if (src) {
            return (<img block block-width="100%" style={{ cursor: 'zoom-in', objectFit: 'contain' }} src={src} onClick={() => ImageViewer.show(src)}/>)
          }
          if (data.lcdpId) {
            return <img block block-height="100%" block-width="100%" src="https://static.yximgs.com/udata/pkg/ks-ad-fe/lcdp/banner.png" style={{ cursor: 'pointer', objectFit: 'contain' }} onClick={(e) => {
              e.stopPropagation()
              window.open(`${lcdpUrl}/ide?appId=${lcdpAppId}&pageId=${data.lcdpId}`, '_blank')
            }} />
          }
          return (
            <blankPreview
              block block-height="100%"
              flex-grow-1
              flex-display flex-align-items-center flex-justify-content-center
              style={{ color: '#999' }}>
              暂无缩略图
            </blankPreview>
          )
        }}
      </snail>
    )
  }

  function PageNode (props) {
    const { node, RegisterPort, onRemove } = props
    const { data } = node
    const pageNodeRef = useRef()
    const shareContext = useContext(ShareContext)
    const version = useVersion()
    const productId = version.value.product.id
    const versionId = version.value.id
    const { lcdpUrl } = useLcpConfig()

    const gotoPageEditor = () => {
      if (shareContext.readOnly.value) {
        return
      }
      openFullscreenAnimation({
        onEnd () {
          historyLocation.goto(`/product/${productId}/version/${versionId}/page/${node.id}?layout=hidden`)
        }
      })
    }

    useViewEffect(() => {
      watch(() => [node.data.x], () => {
        setTimeout(() => {
          Page.update(node.id, {
            posX: node.data.x,
            posY: node.data.y
          })
        })
      })
    })

    function onClickPage (e) {
      if (shareContext.readOnly.value) {
        e.stopPropagation()
      }
      shareContext.onClickPage && shareContext.onClickPage({
        id: node.id,
        name: node.data.name
      })
    }

    function handleHideButton (e, node) {
      e.stopPropagation()
      const isHideChildren = !node.data.hideChildren
      let childrenNum = 0
      // 收缩展开遍历全部子节点
      if (node.next && node.next.length > 0) {
        const hasChanged = {}
        hasChanged[node.id] = 'id'
        let tmpNode = node
        const otherNodes = []
        tmpNode.next.forEach(n => {
          if (!hasChanged[n.id]) {
            otherNodes.push(n)
            hasChanged[n.id] = 'id'
          }
        })
        while (otherNodes.length > 0) {
          tmpNode = otherNodes.pop()
          childrenNum++
          shareContext.onChangeNode(tmpNode.id, { data: { isHide: isHideChildren, hideChildren: isHideChildren } })
          Page.update(tmpNode.id, { isHide: isHideChildren, hideChildren: isHideChildren })
          changeEdgeVisible(tmpNode, !isHideChildren)
          if (tmpNode.next && tmpNode.next.length > 0) {
            tmpNode.next.forEach(n => {
              if (!hasChanged[n.id]) {
                otherNodes.push(n)
                hasChanged[n.id] = 'id'
              }
            })
          }
        }
        shareContext.onChangeNode(node.id, { data: { hideChildren: isHideChildren, childrenNum: childrenNum } })
        Page.update(node.id, { hideChildren: isHideChildren, childrenNum: childrenNum })
      }
    }

    function changeEdgeVisible (node, visible) {
      if (!node.prev) return null
      const edges = []
      node.prev.forEach(n => {
        if (n.edges && n.edges.length > 0) {
          shareContext.onChangeNode(n.id, { data: { forceRefresh: !n.data.forceRefresh } }, true) // 更新prev节点，重渲染边
          const eArray = n.edges.filter(e => e.target.cell === node.id)
          edges.push(...eArray)
        }
      })
      edges.push(...node.edges)
      edges.forEach(e => {
        if (e.visible !== visible) {
          shareContext.onChangeEdge(e.id, { visible: visible })
          Link.update(e.id, { visible: visible })
        }
      })
    }

    function hasHideIcon (node) {
      let noChild = true
      if (node.next && node.next.length > 0) {
        noChild = node.next.every(n => n.id === node.id)
      }
      return !noChild
    }

    function onBeforeRemove () {
      confirm({
        title: '是否确认删除',
        onOk () {
          onRemove()
        },
        onCancel () {
        }
      })
    }

    return (
      <page>
        {() => data.isHide
          ? null
          : <pageNode block ref={pageNodeRef} onMouseUp={onClickPage} onDblclick={debounce(gotoPageEditor)} >
        <browserHeader block >
          <browserActions>
            <CloseOne onMouseDown={onBeforeRemove} style={{ cursor: 'pointer' }} theme="filled" fill="#ff4d4f" size="14" unit="px" />
          </browserActions>
          <browserTab block >
            {() => data.name}
          </browserTab>
          <protoEntry onMouseDown={debounce(gotoPageEditor)} block style={{ position: 'absolute', right: '5px', top: '2px', cursor: 'pointer' }}>
            <HandPaintedPlate fill="#fff" size="20" unit="px"/>
          </protoEntry>
        </browserHeader>
        <browserSite block >
          <siteBox block flex-display flex-align-items-center>
            <site inline block-width="100%" >
              {() => buildSiteUrl(node.id, data.name, data.path, data.params)}
            </site>
            {() => data.lcdpId
              ? <siteImg>
                  <img block src="https://static.yximgs.com/udata/pkg/ks-ad-fe/lcdp/logo.svg" style={{ float: 'right', cursor: 'pointer', height: '14px' }} onClick={(e) => {
                    e.stopPropagation()
                    window.open(`${lcdpUrl}/ide?appId=${version.value.product.lcdpAppId}&pageId=${data.lcdpId}`, '_blank')
                  }}/>
                </siteImg>
              : null}
          </siteBox>
        </browserSite>
        <browserBody block >
          {() => {
            if (shareContext.nodeMode.value === 'struct') {
              return <ProductStructCpt node={node} />
            }
            if (shareContext.nodeMode.value === 'ui') {
              return <Snail node={node} lcdpAppId={version.value.product.lcdpAppId} />
            }
          }}
        </browserBody>
        <RegisterPort nodeId={node.id} portId={`${node.id}-5`}>
          <port1 style={{
            width: '16px',
            height: '16px',
            position: 'absolute',
            top: 'calc(100% - 8px)',
            left: 'calc(50% - 8px)'
          }}></port1>
        </RegisterPort>
        <RegisterPort nodeId={node.id} portId={`${node.id}-6`}>
          <port1 style={{
            width: '16px',
            height: '16px',
            position: 'absolute',
            top: 'calc(0% - 8px)',
            left: 'calc(50% - 8px)'
          }}></port1>
        </RegisterPort>
        {() => hasHideIcon(node) === true
          ? <>
              <hideLine inline style={{ position: 'absolute', left: 'calc(50%)', top: 'calc(100% + 8px)', height: '18px', width: '0px', borderLeft: '1px solid #1D59F2' }}></hideLine>
              <hideIcon1
                inline
                flex-display
                flex-justify-content-center
                flex-align-items-center
                onClick={(e) => handleHideButton(e, node)}
                style={{ position: 'absolute', height: '16px', width: '16px', zIndex: 1000, left: 'calc(50% - 8px)', top: 'calc(100% + 24px)', cursor: 'pointer', fontSize: '14px', border: '1px solid #1D59F2', borderRadius: '50%', color: '#1D59F2', backgroundColor: '#fff' }}>
                  {() => data.hideChildren ? data.childrenNum || '+' : '-'}
              </hideIcon1>
            </>
          : null}
      </pageNode>}
      </page>
    )
  }

  PageNode.shape = 'linkPage'

  PageNode.size = { width: 240, height: 218 }

  PageNode.Style = (frag) => {
    const el = frag.root.elements
    el.pageNode.style({
      width: '239px',
      // height: '225px',
      position: 'relative'
    })
    el.browserHeader.style((props) => {
      return {
        height: '24px',
        borderRadius: '10px 10px 0 0',
        position: 'relative',
        backgroundColor: getNodeStyleColor(props.node)
      }
    })
    el.browserTab.style({
      padding: '0 2px',
      margin: '0 60px 0 30px',
      height: '24px',
      color: '#fff',
      lineHeight: '24px',
      fontSize: '14px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    })
    el.browserActions.style({
      fontSize: 0,
      cursor: 'pointer',
      position: 'absolute',
      left: '10px',
      top: '50%',
      transform: 'translate(0, -50%)'
    })
    el.browserSite.style({
      backgroundColor: '#fff',
      borderRight: '1px solid #999',
      borderLeft: '1px solid #999'
    })
    el.siteBox.style({
      boxSizing: 'border-box',
      padding: '4px 14px',
      height: '42px',
      fontSize: '12px',
      color: '#666',
      wordBreak: 'break-all'
    })
    el.site.style({
      maxHeight: '34px',
      lineHeight: '17px',
      wordBreak: 'break-all',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      '-webkit-line-clamp': '2',
      '-webkit-box-orient': 'vertical'
    })
    el.siteImg.style({
      marginLeft: '4px'
    })
    el.browserBody.style({
      backgroundColor: '#fff',
      height: '152px'
    })
    el.hideIcon1.style({
      backgroundColor: 'red'
    })
  }
  PageNode.ConfigPanel = ConfigPanel

  PageNode.onAdd = async (nodeConfig) => {
    const name = '新建空白页面'
    const p = await Page.createPage({
      name,
      version: linkShareData.VERSION_ID,
      posX: nodeConfig.x,
      posY: nodeConfig.y,
      isHide: false,
      hideChildren: false,
      size: { width: 240, height: 220 },
      childrenNum: 0
    })
    return {
      ...p,
      data: {
        name,
        navbars: [],
        params: [],
        chunks: [],
        key: p.key,
        path: p.path,
        pv: 0,
        error: 0,
        isHide: p.isHide,
        hideChildren: p.hideChildren,
        forceRefresh: p.forceRefresh,
        size: p.size,
        childrenNum: p.childrenNum
      }
    }
  }
  PageNode.onRemove = (node) => {
    Page.remove(node.id)
  }
  window.Page = Page
  PageNode.onSave = async (node) => {
    const entityData = {
      id: node.id, // 自定义
      name: node.data.name,
      posX: node.data.x,
      posY: node.data.y
    }

    await Page.update({ id: entityData.id }, entityData)
  }

  return PageNode
})())

/** @jsx createElement */
import {
  createElement,
  reactive,
  atom,
  useViewEffect,
  useImperativeHandle,
  useRef,
  toRaw,
  debounceComputed
} from 'axii'
import { message, Split, contextmenu } from 'axii-components'
// import copyTextToClipboard from 'copy-text-to-clipboard'
import './reset.less'
import './global.css'
import { GraphContext } from './components/Graph'
import Relation from './Relation'
import styles from './index.module.less'
import { createUniqueIdGenerator, nextTick } from './util'
import AxiiNode from './components/AxiiNode'
import createERGraph from './createERGraph'
import ConfigPanel from './components/ConfigPanel'
import { Page, Link } from '@/models'
import ToolBar from './components/ToolBar'
// import ContextMenu from '../ContextMenu'

const createId = () => -1

function getContainerSize () {
  return {
    // TODO 留给了 config panel 的宽度。这里不应该这样搞，应该去读能用的宽高
    width: document.body.offsetWidth - 290,
    height: document.body.offsetHeight - 87
  }
}

export const PORT_JOINT = '|'

export default function EREditor ({ data: rawData, customFields, onChange, onSave, versionId }, editorRef) {
  const { entities, relations } = reactive(rawData)
  const containerRef = useRef()
  const graphRef = atom()
  const selectedItemRef = atom()
  const selectedTypeRef = atom('')
  const highlightId = atom()
  // const ready = atom(true)

  if (editorRef) {
    useImperativeHandle(editorRef, () => ({
      getData () {
        return {
          entities: toRaw(entities),
          relations: toRaw(relations)
        }
      }
    }))
  }

  const parseId = (id) => {
    const [page, status] = id.split(PORT_JOINT)
    return { page: Number(page), status: Number(status) }
  }
  // TODO 因为 node click 的事件不是由我们的组件自己决定发出的，所以没法写在自己组件里面，并传相应的值，只能写在这里。
  const onNodeClick = ({ cell }) => {
    // if (cell.getAxiiProps) {
    const id = parseId(cell.id).page
    selectedTypeRef.value = null
    selectedItemRef.value = entities.find(e => e.id === id)
    selectedTypeRef.value = 'entity'
    highlightId.value = id
    // }
  }

  const onPanelChange = (data) => {
    const { highlight, status } = data
    if (highlight) highlightId.value = highlight
    if (status) {
      // 状态切换的时候页面关系要重新渲染，暂时简单粗暴实现
      // CAUTION: 用画布去控制的话会触发 node 和 edge 的 remove 事件，导致页面和链接被删除……
      window.location.reload()
      // ready.value = false
      // ready.value = true
    }
  }

  const onEdgeClick = ({ cell }) => {
    const relation = relations.find(e => e.id === cell.id)
    if (!relation) return
    selectedTypeRef.value = null
    selectedItemRef.value = relation
    selectedTypeRef.value = 'relation'
  }

  const onNodeMoved = ({ x, y, node }) => {
    const entity = entities.find(e => e.id === parseId(node.id).page)
    Page.update(entity.id, { posX: x, posY: y })
      .then(() => {
        entity.posX = x
        entity.posY = y
      })
  }

  const onGraphClick = () => {
    debounceComputed(() => {
      selectedItemRef.value = null
      selectedTypeRef.value = 'graph'
    })
  }

  const onEdgeConnect = ({ edge, ...rest }) => {
    const sourceNode = edge.getSource()
    const targetNode = edge.getTarget()
    if (!targetNode || !sourceNode) {
      console.warn('target or source is null', targetNode, sourceNode)
      return
    }

    const source = { ...parseId(sourceNode.cell), name: sourceNode.port }
    const target = { ...parseId(targetNode.cell), name: targetNode.port }

    Link.createLink(source, target)
      .then(link => {
        relations.push(reactive(link))
        onEdgeClick({ cell: edge })
      })
  }

  const onEdgeDelete = ({ edge }) => {
    const link = relations.find(x => x.id === edge.id)
    toRaw(link).destroy()
      .then(onGraphClick)
  }

  const onNodeCreate = ({ x, y }) => {
    const data = {
      name: 'newPage',
      posX: x,
      posY: y,
      params: [],
      navbars: [],
      version: versionId
    }
    Page.createPage(data)
      .then((page) => {
        const entity = reactive(page)
        entities.push(entity)
        selectedItemRef.value = entity
        selectedTypeRef.value = 'entity'
      })
  }

  const onNodeDelete = ({ node }) => {
    const page = entities.find(x => x.id === parseId(node.id).page)
    toRaw(page)
      .destroy()
      .then(onGraphClick())
  }

  const validateEdge = ({ edge, type, previous }) => {
    // CAUTION 我们希望一切都由我们数据驱动来控制，所以一直 return false。
    //  但 x6 的 validate return false 实际上是执行了 undo，无法真正的去阻止默认行为。
    //  所以我们只能在 nextTick 里修正，但这样界面会闪动一下。
    const source = edge.getSource()
    const target = edge.getTarget()
    console.log('validateEdge', source, target, type, previous)
    if (previous.cell) {
      // 说明是修改 target/source
      console.log(`change ${type}`, source, target, type, previous)
      // TODO 要修改数据。但是不需要重绘。
      const relation = relations.find(r => r.id === edge.id)
      nextTick(() => {
        debounceComputed(() => {
          const [sourceField, sourcePortSide] = source.port.split(PORT_JOINT)
          const [targetField, targetPortSide] = target.port.split(PORT_JOINT)
          relation.source = {
            entity: source.cell,
            field: sourceField
          }
          relation.target = {
            entity: target.cell,
            field: targetField
          }
          relation.view = {
            sourcePortSide,
            targetPortSide
          }
        })
      })
    } else {
      console.log(`new ${type}`, edge.id, source, target)
      // 说明是新增，不允许，改为手动新增。
      const [sourceFieldId, sourcePortSide] = source.port.split(PORT_JOINT)
      const [targetFieldId, targetPortSide] = target.port.split(PORT_JOINT)
      nextTick(() => {
        relations.push({
          id: edge.id,
          name: '',
          type: '1:1',
          source: {
            entity: source.cell,
            field: sourceFieldId
          },
          target: {
            entity: target.cell,
            field: targetFieldId
          },
          view: {
            sourcePortSide,
            targetPortSide
          }
        })
      })
    }
    // 阻止默认行为
    return false
  }

  useViewEffect(() => {
    const graph = createERGraph(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      connecting: { validateEdge }
    })
    graph.createId = createId
    graph.bindKey('cmd+s', (e) => {
      e.stopPropagation()
      e.preventDefault()
      if (onSave) onSave({ entities: toRaw(entities), relations: toRaw(relations) })
    })

    graphRef.value = graph
    const resizeFn = () => {
      // const { width, height } = getContainerSize()
      // graph.resize(width, height)
      graph.resize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }
    resizeFn()
    window.addEventListener('resize', resizeFn)

    graph.on('blank:click', onGraphClick)
    graph.on('blank:dblclick', onNodeCreate)
    // graph.on('blank:contextmenu', showMenu)
    graph.on('edge:connected', onEdgeConnect)
    graph.on('edge:removed', onEdgeDelete)
    graph.on('node:removed', onNodeDelete)
    graph.on('node:click', onNodeClick)
    graph.on('edge:click', onEdgeClick)
    graph.on('node:moved', onNodeMoved)

    return () => {
      window.removeEventListener('resize', resizeFn)
      graph.off('blank:click', onGraphClick)
      graph.off('blank:dblclick', onNodeCreate)
      // graph.off('blank:contextmenu', showMenu)
      graph.off('edge:connected', onEdgeConnect)
      graph.off('edge:removed', onEdgeDelete)
      graph.off('node:removed', onNodeDelete)
      graph.off('node:click', onNodeClick)
      graph.off('edge:click', onEdgeClick)
      graph.off('node:moved', onNodeMoved)
    }
  })

  return (
    <container block block-height="100%" style={{ background: '#fff' }}>
      <Split layout:block layout:block-height="100%">
        <div block flex-display flex-direction-column block-height="100%">
          <div block flex-grow-0 className={styles.toolbar}>
            {/* <ToolBar commands={commands}/> */}
          </div>
          <div block flex-grow-1 id="container" className="x6-graph" ref={containerRef}/>
        </div>
        <div className={styles.config}>
          {() => graphRef.value
            ? <ConfigPanel graph={graphRef.value} item={selectedItemRef.value} type={selectedTypeRef} onChange={onPanelChange} versionId={versionId} />
            : null}
        </div>
      </Split>
      <GraphContext.Provider value={graphRef}>
        {() => graphRef.value
          ? entities.map(entity =>
          <AxiiNode
            id={`${entity.id}${PORT_JOINT}${entity.currentStatus.id}`}
            key={entity.id}
            shape='entity-shape'
            component="Entity"
            viewProps={{ x: entity.posX, y: entity.posY }}
            entity={entity}
            onChange={onChange}
            highlightId={highlightId}
          />
          )
          : null}
        {() => graphRef.value
          ? relations.map(relation =>
          <Relation key={relation.id} relation={relation} onChange={onChange} entities={entities} />
          )
          : null}
      </GraphContext.Provider>
    </container>
  )
}

EREditor.forwardRef = true

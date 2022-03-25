import { createElement, useViewEffect, useRef, reactive, createComponent, atom } from 'axii'
import { k6 } from 'axii-x6'
import debounce from 'lodash/debounce'
import { useVersion } from '@/layouts/VersionLayout'
import { getProductERModel } from '@/services/product'
import ButtonNew from '@/components/Button.new'
import { EntityNode, EntityPort, EntityEdge, globalData, transOldData } from './Entity'
import Modal from '@/components/Modal'
import { DagreLayout } from '@antv/layout'
import GroupEditor from './GroupEditor'
import { ModelGroup } from '@/models'
const { confirm } = Modal
const { K6, Register, Graph, NodeForm, Toolbar, ShareContext } = k6

const EDITOR_ID = 'pp-model'
// 组内布局行列间距
const LAYOUT_SEP = { RANK: 20, NODE: 20 }
// 组间布局行列间距
const GROUP_LAYOUT_SEP = { RANK: 20, NODE: 40 }
// 实体大小
const ENTITY_SIZE = {
  WIDTH: 255, // 实体宽度
  BASE_HEIGHT: 54, // 实体基础高度(无field)
  FIELD_HEIGHT: 29 // field所占行高度
}

const NewModelEditor = createComponent(function NewModelEditor ({ data }) {
  const transedData = transOldData(data)
  console.log('transedData: ', transedData)

  // TODO：先手工计算下画布高度, 减掉的数字是页面导航+留白的占据的高度
  const graphHeight = document.body.offsetHeight - 104
  const dmRef = useRef()
  window.dmRef = dmRef
  const layoutLoading = atom(false)
  const version = useVersion()
  const selectedGroupId = atom(null)
  const opacityNodes = []
  const groups = atom([])

  window.addEventListener('resize', () => {
    const newWidth = document.body.offsetWidth - 208
    const newHeight = document.body.offsetHeight - 104
    dmRef.current.resize(newWidth, newHeight)
  })

  // 设置图样式
  const graphConfig = {
    grid: {
      size: 15,
      visible: true
    }
  }

  useViewEffect(() => {
    return () => {
      console.log('销毁2')
    }
  })

  const getRealGroupId = (id) => {
    if (!id || id < 0) return 0
    const index = groups.value.findIndex(g => g.id === id)
    if (index >= 0) return id
    else return 0
  }

  function handleAutoLayout () {
    layoutLoading.value = true
    const nodes = dmRef.current.nm.nodes
    const nodesArray = { 0: [] }
    const edgesArray = { 0: [] }
    const groupNodesArray = []
    if (groups.value.length) {
      groups.value.forEach(g => {
        if (g.id) {
          nodesArray[g.id] = []
          edgesArray[g.id] = []
        }
      })
    }
    nodes.forEach(node => {
      const groupId = getRealGroupId(node.data.groupId)
      if (node.edges && node.edges.length > 0) {
        node.edges.forEach(edge => {
          // edge分组
          const targetNode = nodes.find(n => n.id === edge.target.cell)
          if (targetNode) {
            const targetGroupId = getRealGroupId(targetNode.data.groupId)
            if (groupId === targetGroupId) {
              edgesArray[groupId].push(edge)
            }
          }
        })
      }
      const tmpNode = {
        id: String(node.id),
        size: { width: ENTITY_SIZE.WIDTH, height: ENTITY_SIZE.BASE_HEIGHT + node.data?.fields?.length * ENTITY_SIZE.FIELD_HEIGHT },
        x: 0,
        y: 0,
        oldPosition: {
          x: node.data.x,
          y: node.data.y
        },
        fieldsNum: node.data?.fields?.length || 0
      }
      // node分组
      nodesArray[groupId].push(tmpNode)
    })
    // 分组层次布局
    Object.keys(nodesArray).forEach(groupId => {
      if (nodesArray[groupId].length > 0) {
        const dagreLayout = new DagreLayout({
          type: 'dagre',
          rankdir: 'LR',
          align: 'UL',
          ranksep: LAYOUT_SEP.RANK,
          nodesep: LAYOUT_SEP.NODE
        })
        dagreLayout.layout({ nodes: nodesArray[groupId], edges: edgesArray[groupId] })
        let minX, minY, maxX, maxY, maxYFieldsNum
        nodesArray[groupId].forEach(node => {
          node.x = Math.round(node.x - node.size.width / 2)
          node.y = Math.round(node.y - node.size.height / 2)
          minX = minX ? (minX > node.x ? node.x : minX) : node.x
          minY = minY ? (minY > node.y ? node.y : minY) : node.y
          maxX = maxX ? (maxX < node.x ? node.x : maxX) : node.x
          if (!maxY || maxY < node.y) {
            maxY = node.y
            maxYFieldsNum = node.fieldsNum
          }
        })
        const width = maxX + ENTITY_SIZE.WIDTH - minX
        const height = maxY + ENTITY_SIZE.BASE_HEIGHT + maxYFieldsNum * ENTITY_SIZE.FIELD_HEIGHT - minY
        const groupNode = {
          id: String(groupId),
          x: 0,
          y: 0,
          size: { width: width, height: height }
        }
        groupNodesArray.push(groupNode)
      }
    })
    // 组间布局:grid进行组间布局时不同组统一设置宽高，空间利用不合理；利用dagre进行平铺布局
    const dagreLayout = new DagreLayout({
      type: 'dagre',
      rankdir: 'TB',
      align: 'UL',
      ranksep: GROUP_LAYOUT_SEP.RANK,
      nodesep: GROUP_LAYOUT_SEP.NODE
    })
    dagreLayout.layout({ nodes: groupNodesArray, edges: [] })
    const curSelectedGroup = { x: null, y: null }
    Object.keys(nodesArray).forEach(groupId => {
      if (nodesArray[groupId].length > 0) {
        const { x, y, size } = groupNodesArray.find(g => g.id === groupId)
        if (selectedGroupId.value === Number(groupId)) {
          curSelectedGroup.x = x
          curSelectedGroup.y = y
        }
        const groupX = Math.round(x - size.width / 2)
        const groupY = Math.round(y - size.height / 2)
        nodesArray[groupId].forEach(node => {
          node.id = Number(node.id)
          if (node.oldPosition.x !== node.x + groupX || node.oldPosition.y !== node.y + groupY) {
            dmRef.current.syncNode(node.id, { x: node.x + groupX, y: node.y + groupY }, true)
          }
        })
        ModelGroup.update(groupId, { centerX: x, centerY: y })
      } else {
        ModelGroup.update(groupId, { centerX: null, centerY: null })
      }
    })
    // 将当前组移至画布中心
    if (curSelectedGroup.x && curSelectedGroup.y) {
      dmRef.current.centerPoint(curSelectedGroup.x, curSelectedGroup.y)
    } else {
      dmRef.current.centerContent()
    }
    layoutLoading.value = false
  }

  function onBeforeRemove (cell) {
    const name = atom(cell.data?.name || cell.name || '该实体')
    if (cell.source) {
      name.value = `连线${cell.data?.name || cell.name || ''}`
    }
    return new Promise(resolve => {
      confirm({
        title: `是否确认删除${name.value}`,
        onOk () {
          resolve(true)
        },
        onCancel () {
          resolve(false)
        }
      })
    })
  }

  function onChangeNode (id, obj) {
    return dmRef.current.syncNode(id, obj)
  }

  const onChangeSelectedGroup = async ({ id }) => {
    selectedGroupId.value = (id && id > 0) ? id : null
    highlightGroupNodes(id)
    if (id && id > 0) {
      const group = groups.value.find(g => g.id === id)
      if (group && group.centerX && group.centerY) {
        dmRef.current.centerPoint(group.centerX, group.centerY)
        return
      }
    }
    dmRef.current.centerContent()
  }

  function highlightGroupNodes (id) {
    if (!id || id <= 0) {
      opacityNodes.forEach(n => {
        n.style.opacity = 1
      })
      return
    }
    opacityNodes.slice(0, opacityNodes.length)
    const nodes = document.querySelectorAll('g[data-shape="html"]')
    const nodesData = dmRef.current.nm.nodes
    const map = nodesData.reduce((acc, x) => (
      x.data.groupId === id ? { ...acc, [x.id]: true } : acc
    ), {})
    nodes.forEach(n => {
      const id = n.getAttribute('data-cell-id')
      if (map[id]) {
        n.style.opacity = 1
        return
      }
      n.style.opacity = 0.2
      opacityNodes.push(n)
    })
  }

  const onChangeGroups = (groupList) => {
    groups.value = groupList
  }

  return (
    <meContainer block>
      <ShareContext.Provider value={{ versionId: version.value.id, onChangeNode }}>
      <K6 layout:block layout:flex-display height={graphHeight} ref={dmRef} graphConfig={graphConfig} type='model'>
        <Register node={EntityNode} port={EntityPort} edge={EntityEdge} />
        <Toolbar
          onBeforeRemove={onBeforeRemove}
          extra={[
            <ButtonNew key="add" primary k6-add-node size="small">
              新增实体
            </ButtonNew>,
            <autoLayout key="autoLayout">
              {() =>
                (<ButtonNew primary size="small" onClick={debounce(handleAutoLayout)} loading={layoutLoading.value}>
                  自动布局
                </ButtonNew>)
              }
            </autoLayout>,
            <GroupEditor key='editGroup' onChangeSelectedGroup={onChangeSelectedGroup} onChangeGroups={onChangeGroups}></GroupEditor>
          ]} />
        <Graph data={transedData} />
        {{
          nodeForm: <NodeForm />
        }}
      </K6>
      </ShareContext.Provider>
    </meContainer>
  )
})

export default () => {
  const version = useVersion()

  const editorData = reactive({
    entities: null,
    relations: null
  })

  useViewEffect(() => {
    const { product } = version.value

    globalData.PRODUCT_ID.set(product.id)

    getProductERModel(product.id).then(({ relations, entities }) => {
      Object.assign(editorData, {
        entities,
        relations
      })
    })

    return () => {
      console.log('Model Editor dispose')
      globalData.clear()
    }
  })

  return (
    <modelContainer id={EDITOR_ID} block block-width="100%" block-height={800} >
      {() => {
        if (editorData.entities && editorData.relations) {
          return (<NewModelEditor data={editorData}/>)
        }
      }}
    </modelContainer>
  )
}

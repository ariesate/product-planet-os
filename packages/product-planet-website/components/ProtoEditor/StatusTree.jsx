import { createElement, createComponent, atom, reactive } from 'axii'
import cloneDeep from 'lodash/cloneDeep'
import { MindTree } from 'axii-components'
import Drawer from '../Drawer'

const genStatusTree = (statusMap) => {
  const tree = []
  for (const id in statusMap) {
    const status = statusMap[id]
    const { prevId } = status
    const prev = statusMap[prevId]
    if (prevId && prev) {
      if (!prev.children) {
        prev.children = []
      }
      prev.children.push(status)
    } else {
      tree.push(status)
    }
  }
  return tree
}

const StatusTree = ({ statusMap, visible, onStatusSelect }) => {
  // CAUTION: 给节点添加 children 会污染原数据，得 clone 一下
  const map = cloneDeep(statusMap)
  const data = reactive(genStatusTree(map))

  const renderItem = (item) => {
    return <statusNode block onClick={() => onStatusSelect(item.id)}>{item.name}</statusNode>
  }

  return <Drawer
    title="选择状态"
    visible={visible}
    style={{ display: 'block', padding: 24 }}
    maskCloseable={true}
    width={atom(800)}
  >
    {() => <MindTree data={data} render={renderItem} />}
  </Drawer>
}

export default createComponent(StatusTree)

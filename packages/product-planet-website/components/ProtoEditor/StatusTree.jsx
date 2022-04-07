import { createElement, createComponent, atom, reactive } from 'axii'
import cloneDeep from 'lodash/cloneDeep'
import { MindTree, message } from 'axii-components'
import Drawer from '../Drawer'
import PartialTag, { partialTypes, checkPartial } from '@/components/PartialTag'

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

const StatusTree = ({ title = '选择状态', statusMap, visible, onStatusSelect, extra, deletedVisible = true }) => {
  // CAUTION: 给节点添加 children 会污染原数据，得 clone 一下
  const map = cloneDeep(statusMap)
  const data = reactive(genStatusTree(map))
  const onClickStatusNode = (item) => {
    if (!deletedVisible && checkPartial(item) === partialTypes.remove) {
      message.error('该状态已删除，请重新选择页面状态')
    } else {
      onStatusSelect(item.id, item.name)
    }
  }

  const renderItem = (item) => {
    return <statusNode block block-position-relative block-padding="8px 42px 0 8px" onClick={() => onClickStatusNode(item)}>
      {item.name}
      <PartialTag partial={item} />
      </statusNode>
  }

  return <Drawer
    title={title}
    visible={visible}
    style={{ display: 'block', padding: 24 }}
    maskCloseable={true}
    width={atom(800)}
    extra={extra}
  >
    {() => <MindTree data={data} render={renderItem} />}
  </Drawer>
}

export default createComponent(StatusTree)

import { createElement } from 'axii'
import { createCardTool } from '../card'
import { CardItem } from '../card/type'
import icon from './icon.svg?raw'
import Item from './Item'

export interface TaskListItem extends CardItem {
  type: string
  status: string
  assignee: User
}
export interface TaskDetail extends TaskListItem {
  description: string
  createdAt: string
  creator: User
  priority: string
}
export interface User {
  name: string
  avatar: string
}

export default createCardTool({
  title: 'Task',
  icon,
  style: {
    display: 'inline-block',
    minWidth: '240px',
    minHeight: '102px',
    userSelect: 'none',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.10)',
    boxSizing: 'content-box'
  },
  renderDetail: (item: TaskDetail) => {
    return createElement(Item, { item })
  },
  renderListItem: (item: TaskListItem) => {
    return item.name
  },
  fetchItem: null,
  fetchList: null
})

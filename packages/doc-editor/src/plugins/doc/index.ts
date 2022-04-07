import { createElement } from 'axii'
import { createCardTool } from '../card'
import { CardItem } from '../card/type'
import icon from './icon.svg?raw'
import Item from './Item'

export interface DocListItem extends CardItem {
}
export interface DocDetail extends DocListItem {
  createdAt: string
  creator?: DocCreator
}
export interface DocCreator {
  displayName: string
  avatar: string
}

export default createCardTool({
  title: 'Document',
  icon,
  renderDetail: (item: DocDetail) => {
    return createElement(Item, { item })
  },
  renderListItem: (item: DocListItem) => {
    return item.name
  },
  fetchItem: null,
  fetchList: null
})

import { createElement } from 'axii'
import { createCardTool } from '../card'
import { CardItem } from '../card/type'
import icon from './icon.svg?raw'
import Item from './Item'

export interface UseCaseListItem extends CardItem {
  name: string
}
export interface UseCaseDetail extends UseCaseListItem {
  createdAt: string
  image?: string
}

export default createCardTool({
  title: 'UseCase',
  icon,
  renderDetail: (item: UseCaseDetail) => {
    return createElement(Item, { item })
  },
  renderListItem: (item: UseCaseListItem) => {
    return item.name
  },
  fetchItem: null,
  fetchList: null
})

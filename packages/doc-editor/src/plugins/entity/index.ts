import { createElement } from 'axii'
import { createCardTool } from '../card'
import { CardItem } from '../card/type'
import icon from './icon.svg?raw'
import Item from './Item'

export interface EntityListItem extends CardItem {
  name: string
}
export interface EntityDetail extends EntityListItem {
  fields: EntityField[]
}
export interface EntityField {
  id: number
  name: string
  type: string
}

export default createCardTool({
  title: 'Entity',
  icon,
  style: {
    display: 'inline-block',
    minWidth: '220px'
  },
  renderDetail: (item: EntityDetail) => {
    return createElement(Item, { item })
  },
  renderListItem: (item: EntityListItem) => {
    return item.name
  },
  fetchItem: null,
  fetchList: null
})

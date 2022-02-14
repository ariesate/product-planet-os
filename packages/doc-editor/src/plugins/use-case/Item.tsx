import { createElement, createComponent, FC, propTypes } from 'axii'
import type { UseCaseDetail } from './index'
import image from './image.svg?raw'
import action from './action.svg?raw'

interface ItemProps {
  item?: UseCaseDetail
}
const Item: FC<ItemProps> = ({ item }) => {
  return (
    <container
      block
      block-position-relative
      block-width="100%"
      block-padding="16px 24px 16px 12px"
      flex-display>
      {() =>
        item?.image ? (
          <img
            block
            block-width-64px
            block-height-64px
            src={item.image}
            alt="IMAGE"
          />
        ) : (
          <i
            // @ts-ignore
            dangerouslySetInnerHTML={{ __html: image }}
          />
        )
      }
      {() =>
        !item ? null : (
          <content
            block
            block-margin-left-16px
            flex-display
            flex-direction-column
            flex-justify-content-space-between>
            <name>{item.name}</name>
            <date>创建于: {item.createdAt}</date>
          </content>
        )
      }
      <action block block-margin-left-auto>
        <i
          // @ts-ignore
          dangerouslySetInnerHTML={{ __html: action }}
        />
      </action>
    </container>
  )
}

Item.propTypes = {
  item: propTypes.object
}

Item.Style = (frag) => {
  frag.root.elements.container.style({
    boxSizing: 'border-box'
  })
  frag.root.elements.image.style({
    objectFit: 'fill'
  })
  frag.root.elements.name.style({
    fontWeight: '500',
    fontSize: '16px'
  })
  frag.root.elements.date.style({
    fontSize: '14px',
    color: '#959da5'
  })
}

export default createComponent(Item)

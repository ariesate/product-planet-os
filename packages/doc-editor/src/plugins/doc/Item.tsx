import { createElement, createComponent, FC, propTypes } from 'axii'
import type { DocDetail } from './index'
import image from './image.svg?raw'

interface ItemProps {
  item?: DocDetail
}
const Item: FC<ItemProps> = ({ item }) => {
  return (
    <container
      block
      block-position-relative
      block-width="100%"
      block-padding="16px 24px 16px 12px"
      flex-display
      flex-align-items-center>
      <i
        // @ts-ignore
        dangerouslySetInnerHTML={{ __html: image }}
      />
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
      {item?.creator ? (
        <img
          block
          block-margin-left-auto
          block-width-32px
          block-height-32px
          src={item.creator.avatar}
          alt={item.creator.displayName}
        />
      ) : null}
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
  frag.root.elements.img.style({
    borderRadius: '50%',
    overflow: 'hidden'
  })
}

export default createComponent(Item)

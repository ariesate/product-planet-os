import {
  createElement,
  createComponent,
  FC,
  atom,
  useViewEffect,
  propTypes,
  CSSProperties
} from 'axii'
import HoverFeature, { HoverProps } from './HoverFeature'
import { ActionType, CardItem, FetchItemType, RenderType } from './type'

export interface CardDetailBlockProps extends HoverProps {
  id: number
  style?: CSSProperties
  fetch: FetchItemType<CardItem>
  render: RenderType<CardItem | undefined | null>
  onClick?: ActionType<CardItem>
}
const CardDetailBlock: FC<CardDetailBlockProps> = ({
  id,
  style,
  fetch,
  render,
  onClick
}) => {
  const item = atom<CardItem>(null)
  useViewEffect(() => {
    fetch(id.value).then((data) => {
      item.value = data
    })
  })
  return (
    <container
      block
      style={style}
      onClick={(e) => {
        if (item.value == null) {
          return
        }
        e.stopPropagation()
        onClick?.(item.value)
      }}>
      {() => render(item.value)}
    </container>
  )
}

CardDetailBlock.propTypes = {
  id: propTypes.number.default(() => atom(null)),
  style: propTypes.object,
  fetch: propTypes.function.isRequired,
  render: propTypes.function.isRequired,
  onClick: propTypes.function
}

CardDetailBlock.Style = (frag) => {
  frag.root.elements.container.style(({ hovered, style, onClick }) => ({
    boxShadow:
      onClick != null && hovered.value
        ? '0 3px 5px 0 rgb(31 35 41 / 4%)'
        : 'none',
    borderRadius: '4px',
    border: '1px solid #e6e8eb',
    cursor: onClick != null ? 'pointer' : 'default',
    boxSizing: 'border-box',
    ...style
  }))
}

// @ts-ignore
export default createComponent(CardDetailBlock, [HoverFeature])

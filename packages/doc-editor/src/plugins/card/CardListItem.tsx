import { createElement, createComponent, FC, atom, propTypes } from 'axii'
import HoverFeature, { HoverProps } from './HoverFeature'

export interface CardListItemProps extends HoverProps {
  bordered?: boolean
  children?: any
}

const CardListItem: FC<CardListItemProps> = ({ children }) => {
  return (
    <container block block-padding-16px>
      {children}
    </container>
  )
}

CardListItem.propTypes = {
  bordered: propTypes.bool.default(() => atom(false))
}

CardListItem.Style = (frag) => {
  frag.root.elements.container.style(({ hovered, bordered }) => ({
    cursor: 'pointer',
    backgroundColor: hovered.value ? '#eee' : 'inherit',
    borderTop: bordered.value ? '1px solid #f9f9f9' : 'none',
    boxSizing: 'border-box'
  }))
}

// @ts-ignore
export default createComponent(CardListItem, [HoverFeature])

import { createElement, createComponent, FC, propTypes, atom } from 'axii'
import type { EntityField } from './index'

interface FieldProps extends EntityField {}
const Field: FC<FieldProps> = ({ name, type }) => {
  return (
    <container
      block
      block-padding="2px 0"
      flex-display
      flex-align-items-center
      flex-justify-content-space-between>
      <name>{name}</name>
      <type>{type}</type>
    </container>
  )
}

Field.propTypes = {
  id: propTypes.number.default(() => atom(null)),
  name: propTypes.string.default(() => atom('')),
  type: propTypes.string.default(() => atom(''))
}

Field.Style = (frag) => {
  frag.root.elements.container.style({
    borderBottom: '1px solid rgba(206, 212, 222, 0.2)',
    fontSize: '14px'
  })
  frag.root.elements.type.style({
    color: '#bfbfbf'
  })
}

export default createComponent(Field)

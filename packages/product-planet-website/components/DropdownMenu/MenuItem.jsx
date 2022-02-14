import { createElement, createComponent, propTypes } from 'axii'
import { HoverFeature } from '../Hoverable'

/**
 * @type {import('axii').FC}
 */
function MenuItem (props) {
  return (
    <container
      block
      block-padding="12px 16px"
      flex-display
      flex-align-items-center
      {...props}
    />
  )
}

MenuItem.Style = (frag) => {
  frag.root.elements.container.style(({ hovered }) => ({
    cursor: 'pointer',
    fontSize: '14px',
    backgroundColor: hovered.value ? '#f1f1f1' : 'unset'
  }))
}

MenuItem.propTypes = {
  children: propTypes.arrayOf(propTypes.element())
}

export default createComponent(MenuItem, [HoverFeature])

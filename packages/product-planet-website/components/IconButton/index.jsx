import { createElement, createComponent, propTypes, atom } from 'axii'
import { HoverFeature } from '../Hoverable'

/**
 * @type {import('axii').FC}
 */
function IconButton ({ icon, size, iconSize, iconFill, children, ...props }) {
  return (
    <container
      block
      block-width={size}
      block-height={size}
      flex-display
      flex-justify-content-center
      flex-align-items-center
      {...props}>
      {createElement(icon, { size: iconSize, unit: 'px', fill: iconFill })}
      {children}
    </container>
  )
}

IconButton.Style = (frag) => {
  frag.root.elements.container.style(({ hovered, fill }) => ({
    fontSize: 0,
    borderRadius: '2px',
    cursor: 'pointer',
    backgroundColor: fill.value,
    opacity: hovered.value ? 0.8 : 1
  }))
}

IconButton.propTypes = {
  icon: propTypes.oneOf(propTypes.string(), propTypes.elementType()),
  size: propTypes.string.default(() => atom('24px')),
  fill: propTypes.string.default(() => atom('#3D3D3D')),
  iconFill: propTypes.string.default(() => atom('#fff')),
  iconSize: propTypes.number.default(() => atom(20)),
  children: propTypes.arrayOf(propTypes.element())
}

export default createComponent(IconButton, [HoverFeature])

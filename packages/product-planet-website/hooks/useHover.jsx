/** @jsx createElement */
import {
  createComponent,
  createElement,
  atom
} from 'axii'

export default function useHover () {
  const isHover = atom(false)

  function HoverableNode ({ children, onMouseEnter, onMouseLeave, ...otherProps }) {
    if (children[0].attributes) {
      children[0].attributes.isHover = isHover
    }
    return (
      <hoverBox
        {...otherProps}
        onMouseEnter={() => {
          isHover.value = true
          onMouseEnter && onMouseEnter()
        }}
        onMouseLeave={() => {
          isHover.value = false
          onMouseLeave && onMouseLeave()
        }}>
        {children}
      </hoverBox>
    )
  }
  return {
    Node: createComponent(HoverableNode),
    isHover
  }
}

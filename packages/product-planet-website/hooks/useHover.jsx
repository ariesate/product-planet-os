/** @jsx createElement */
import {
  createComponent,
  createElement,
  atom
} from 'axii'

export default function useHover () {
  const isHover = atom(false)

  function HoverableNode ({ children, ...otherProps }) {
    children[0].attributes.isHover = isHover
    return (
      <hoverBox
        {...otherProps}
        onMouseEnter={() => {
          isHover.value = true
        }}
        onMouseLeave={() => {
          isHover.value = false
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

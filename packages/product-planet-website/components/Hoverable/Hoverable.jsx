import { createElement, atom, propTypes } from 'axii'

/**
 * 悬停状态组件
 * @param {{children?: (hovered: boolean) => React.ReactNode|React.ReactNode}} param0
 */
function Hoverable ({ children, ...props }) {
  const hovered = atom(false)
  return (
    <div
      {...props}
      onMouseEnter={() => {
        hovered.value = true
      }}
      onMouseLeave={() => {
        hovered.value = false
      }}>
      {() => children?.[0]?.(hovered.value)}
    </div>
  )
}

export function useHoverProps () {
  const hovered = atom(false)
  const onMouseEnter = () => {
    hovered.value = true
  }
  const onMouseLeave = () => {
    hovered.value = false
  }
  return {
    hovered,
    onMouseEnter,
    onMouseLeave
  }
}

function HoverFeature (frag) {
  frag.root.modify((node, { hovered }) => {
    node.attributes.onMouseEnter = () => {
      hovered.value = true
    }
    node.attributes.onMouseLeave = () => {
      hovered.value = false
    }
  })
}
HoverFeature.propTypes = {
  hovered: propTypes.bool.default(() => atom(false))
}

export { HoverFeature }

export default Hoverable

import { createElement, createComponent, atom, propTypes } from 'axii'

/**
 * @typedef {{trigger?: 'click'|'hover'; align?: 'left'|'center'|'right'; offsetY?: string; content: import('axii').AxiiElement}} Props
 * @type {import('axii').FC<Props>}
 */
function Popover ({ active, trigger, content, offsetY, children }) {
  return (
    <container
      block
      block-position-relative
      onMouseEnter={() => {
        if (trigger.value === 'hover') {
          active.value = true
        }
      }}
      onMouseLeave={() => {
        if (trigger.value === 'hover') {
          active.value = false
        }
      }}
      onClick={(e) => {
        if (trigger.value !== 'click' || active.value) {
          return
        }
        active.value = true
        e.stopPropagation()
        window.addEventListener(
          'click',
          (e) => {
            e.preventDefault()
            e.stopPropagation()
            active.value = false
          },
          { once: true }
        )
      }}>
      {children}
      {() => (
        <content
          block
          block-display-none={!active.value}
          block-margin-top={offsetY}
          block-position-absolute>
          {content}
        </content>
      )}
    </container>
  )
}

function getTransform (align) {
  let left
  let right
  let translateX
  if (align === 'center') {
    left = '50%'
    translateX = '-50%'
  } else if (align === 'right') {
    right = 0
  }
  return {
    left,
    right,
    transform: translateX ? `translateX(${translateX})` : undefined
  }
}

Popover.Style = (frag) => {
  frag.root.elements.content.style(({ align }) => ({
    zIndex: 1,
    backgroundColor: '#fff',
    borderRadius: '2px',
    boxShadow: '0px 3px 6px rgba(0,0,0,0.12)',
    ...getTransform(align.value)
  }))
}

Popover.propTypes = {
  active: propTypes.bool.default(() => atom(false)),
  trigger: propTypes.string.default(() => atom('click')),
  align: propTypes.string.default(() => atom('center')),
  offsetY: propTypes.string.default(() => atom('4px'))
}

export default createComponent(Popover)

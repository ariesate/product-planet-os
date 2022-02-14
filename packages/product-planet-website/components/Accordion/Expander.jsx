import { createElement, createComponent, propTypes, atom, watch } from 'axii'
import UpIcon from 'axii-icons/Up'
import DownIcon from 'axii-icons/Down'

/**
 * @typedef {(expanded: import('axii').Atom<boolean>) => import('axii').AxiiElement} Renderer
 * @typedef {{ arrow?: Renderer; title?: import('axii').Atom<string>|Renderer); expanded?: import('axii').Atom<boolean>; children?: import('axii').AxiiElement|Renderer); onToggle?: () => void }} ExpanderProps
 * @type {import('axii').FC}
 * @param {ExpanderProps} props
 */
function Expander ({ arrow, title, children, expanded, onToggle, onChange }) {
  watch(
    () => expanded.value,
    () => onChange?.(expanded.value)
  )
  return (
    <container block>
      <header
        block
        block-padding-18px
        flex-display
        flex-align-items-center
        onClick={() => {
          if (onToggle) {
            onToggle()
          } else {
            expanded.value = !expanded.value
          }
        }}>
        {() =>
          typeof arrow === 'function'
            ? (
                arrow(expanded)
              )
            : (
            <div block block-margin-right-8px block-font-size-0>
              {expanded.value
                ? (
                <UpIcon size="16" unit="px" />
                  )
                : (
                <DownIcon size="16" unit="px" />
                  )}
            </div>
              )
        }
        {() =>
          typeof title === 'function' ? title(expanded) : <div>{title}</div>
        }
      </header>
      {() =>
        typeof children === 'function'
          ? (
              children(expanded)
            )
          : expanded.value
            ? (
          <content block block-padding-24px>
            {children}
          </content>
              )
            : null
      }
    </container>
  )
}

Expander.Style = (frag) => {
  frag.root.elements.container.style({
    backgroundColor: '#fff',
    borderRadius: '4px'
  })
  frag.root.elements.header.style({
    boxShadow: '0px 0px 4px #c9d1de',
    userSelect: 'none'
  })
}

Expander.propTypes = {
  expanded: propTypes.bool.default(() => atom(false))
}

export default createComponent(Expander)

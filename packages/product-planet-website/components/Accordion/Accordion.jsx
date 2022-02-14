import {
  createElement,
  createComponent,
  propTypes,
  atom,
  cloneElement,
  atomComputed,
  isComponentVnode
} from 'axii'
import { Expander } from '.'

/**
 * @type {import('axii').FC}
 */
function Accordion ({ activeKey, children, onChange, strict }) {
  return (
    <container>
      {() => {
        return !Array.isArray(children)
          ? children
          : children.map((child) => {
            if (!isComponentVnode(child) || child.type !== Expander) {
              if (strict.value) {
                throw new Error('Accordion 子节点只能是 Expander')
              }
            }
            const key = child.rawKey
            const expanded = atomComputed(() => {
              return activeKey.value === key
            })
            return cloneElement(child, {
              expanded,
              onToggle: () => {
                if (activeKey.value !== key) {
                  activeKey.value = key
                } else {
                  activeKey.value = null
                }
                onChange?.(activeKey.value)
              }
            })
          })
      }}
    </container>
  )
}

Accordion.propTypes = {
  activeKey: propTypes.number.default(() => atom(null)),
  strict: propTypes.bool.default(() => atom(true))
}

export default createComponent(Accordion)

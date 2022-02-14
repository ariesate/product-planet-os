import { createElement, createComponent, propTypes, reactive } from 'axii'
import Popover from '../Popover'
import MenuItem from './MenuItem'

/**
 * @typedef {{options: [{title: string; onClick?:() => void; icon?: import('axii').Component}]}} Props
 * @type {import('axii').FC<Props>}
 */
function DropdownMenu ({ options, children, ...props }) {
  return (
    <Popover
      {...props}
      content={() => (
        <container block block-min-width-120px>
          {options?.map(({ title = null, onClick, icon }, i) => (
            <MenuItem key={i} onClick={onClick}>
              {() =>
                icon
                  ? (
                  <span block block-font-size-0 block-margin-right-8px>
                    {createElement(icon, { size: '16', unit: 'px' })}
                  </span>
                    )
                  : null
              }
              {title}
            </MenuItem>
          ))}
        </container>
      )}>
      {children}
    </Popover>
  )
}

DropdownMenu.Style = (frag) => {
  frag.root.elements.container.style({})
}

DropdownMenu.propTypes = {
  options: propTypes.array.default(() => reactive([])),
  children: propTypes.arrayOf(propTypes.element())
}

export default createComponent(DropdownMenu)

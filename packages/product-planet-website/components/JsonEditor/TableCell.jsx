import { createElement, createComponent, propTypes, atom } from 'axii'
import { Checkbox } from 'axii-components'

/**
 * @type {import('axii').FC}
 */
function TableCell ({ data, type }) {
  return (
    <div>
      {() => {
        switch (type) {
          case 'boolean':
            return (
              <Checkbox
                layout:block-width-120px
                layout:block-font-size-14px
                value={data}>
                {data}
              </Checkbox>
            )
          case 'number':
            return (
              <input
                block
                block-width-120px
                block-padding="0 6px"
                inputMode="numeric"
                type="number"
                value={data}
                onBlur={(e) => {
                  data.value = isNaN(e.target.value)
                    ? 0
                    : Number(e.target.value)
                }}
              />
            )
          default:
            return (
              <input
                block
                block-width-120px
                block-padding="0 6px"
                value={data}
                onBlur={(e) => {
                  data.value = e.target.value
                }}
              />
            )
        }
      }}
    </div>
  )
}

TableCell.propTypes = {
  data: propTypes.any.default(() => atom(''))
}

TableCell.Style = (frag) => {
  frag.root.elements.input.style({
    border: 'none',
    background: 'none',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontWeight: 'normal'
  })
}

export default createComponent(TableCell)

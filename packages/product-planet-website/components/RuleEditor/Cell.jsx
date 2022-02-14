import { createElement, createComponent } from 'axii'
import { Checkbox } from 'axii-components'

/**
 * @type {import('axii').FC}
 */
function Cell ({ value, type, onSubmit }) {
  const handleChange = () => {
    onSubmit?.(!value)
  }
  const handleBlur = (e) => {
    onSubmit?.(e.target.value)
  }
  return (
    <container block flex-display flex-align-content-center>
      {function () {
        switch (type) {
          case 'bool':
            return <Checkbox layout:block-width-120px value={value} onChange={handleChange} />
          case 'number':
            return (
              <input
                block
                block-width-120px
                block-padding="0 6px"
                inputMode="numeric"
                type="number"
                value={value}
                onBlur={handleBlur}
              />
            )
          default:
            return (
              <input
                block
                block-width-120px
                block-padding="0 6px"
                value={value}
                onBlur={handleBlur}
              />
            )
        }
      }}
    </container>
  )
}

Cell.Style = (fragments) => {
  fragments.root.elements.container.style({
    backgroundColor: '#fff'
  })
  fragments.root.elements.input.style({
    border: 'none',
    background: 'none',
    lineHeight: '28px',
    outlineColor: '#0052cc',
    boxSizing: 'border-box'
  })
}

export default createComponent(Cell)

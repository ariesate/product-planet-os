import { createElement, createComponent, propTypes, atom } from 'axii'

/**
 * @type {import('axii').FC}
 */
function InlineInput ({ value, placeholder }) {
  return (
    <input
      block
      block-min-width-200px
      block-padding="0 6px"
      value={value}
      placeholder={placeholder}
      onBlur={(e) => {
        value.value = e.target.value
      }}
      onClick={e => {
        e.stopPropagation()
      }}
    />
  )
}

InlineInput.Style = (frag) => {
  frag.root.elements.input.style({
    border: 'none',
    background: 'none',
    fontSize: '16px',
    lineHeight: '22px',
    outline: 'none',
    boxSizing: 'border-box',
    fontWeight: 'normal',
    borderBottom: 'solid 1px'
  })
}

InlineInput.propTypes = {
  value: propTypes.any.default(() => atom('')),
  placeholder: propTypes.string
}

export default createComponent(InlineInput)

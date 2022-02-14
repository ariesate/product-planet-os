import { createElement, createComponent, Fragment, atom, propTypes } from 'axii'

function Editable ({
  value,
  placeholder,
  onSubmit,
  children,
  size,
  color,
  ...props
}) {
  const isEditing = atom(false)
  const handleEdit = (e) => {
    e.stopPropagation()
    isEditing.value = true
  }
  const handleSubmit = (e) => {
    isEditing.value = false
    onSubmit?.(e.target.value)
  }

  return (
    <>
      {() =>
        isEditing.value
          ? (
          <input
            block-inline
            block-padding-0
            {...props}
            ref={(input) => {
              input.focus()
            }}
            value={value}
            onBlur={handleSubmit}
          />
            )
          : (
          <text {...props} onDblClick={handleEdit}>
            {value || placeholder}
          </text>
            )
      }
    </>
  )
}

Editable.propTypes = {
  value: propTypes.string,
  placeholder: propTypes.string,
  children: propTypes.arrayOf(propTypes.element()),
  size: propTypes.oneOfType(propTypes.string(), propTypes.number()),
  collor: propTypes.string,
  onSubmit: propTypes.function
}

Editable.Style = (fragments) => {
  fragments.root.elements.input.style(({ size, color }) => ({
    border: 'none',
    background: 'none',
    borderBottom: 'solid 1px',
    fontSize: size,
    color
  }))
  fragments.root.elements.text.style(({ size, color }) => ({
    fontSize: size,
    color
  }))
  fragments.root.elements.input.match.focus.style({
    outline: 'none'
  })
}

export default createComponent(Editable)

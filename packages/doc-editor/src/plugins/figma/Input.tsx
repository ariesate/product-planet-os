import { createElement, createComponent, FC, atom, propTypes } from 'axii'

export interface InputProps {
  placeholder?: string
  onChange: (url: string) => void
}

const Input: FC<InputProps> = ({ placeholder, onChange }) => {
  return (
    <input
      block
      block-width="100%"
      block-padding-10px
      placeholder={placeholder}
      onBlur={(e: FocusEvent & { target: HTMLInputElement }) => {
        const url = e.target.value
        onChange?.(url)
      }}
      onPaste={(e) => {
        const url = e.clipboardData.getData('text')
        onChange?.(url)
      }}
    />
  )
}

Input.propTypes = {
  placeholder: propTypes.string.default(() => atom('')),
  onChange: propTypes.function.isRequired
}

Input.Style = (frag) => {
  frag.root.elements.input.style({
    border: '1px solid #e4e4e4',
    borderRadius: '3px',
    outline: 'none',
    fontSize: '14px',
    boxSizing: 'border-box'
  })
}

export default createComponent(Input)

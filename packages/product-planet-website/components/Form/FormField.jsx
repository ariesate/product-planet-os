import {
  createElement,
  createComponent,
  propTypes,
  atom,
  atomComputed,
  isAtom
} from 'axii'
import { Input } from 'axii-components'

/**
 * @typedef {{id: string|number; name: string;}} Option
 * @typedef {{label: string; value: any; type?: 'input'|'select'; options?: Option[]}} Props
 * @type {import('axii').FC}
 */
function FormField ({ label, type, value, required, placeholder, options }) {
  return (
    <container block>
      <label inline inline-position-relative inline-margin-right-12px>
        {label}
        <asterisk
          block
          block-display-none={atomComputed(() =>
            isAtom(required) ? !required.value : !required
          )}
          block-position-absolute
          block-left="-8px"
          block-top-0>
          *
        </asterisk>
      </label>
      {() => {
        if (type === 'input' || type == null) {
          return (
            <Input
              inline
              inline-min-width-200px
              value={value}
              placeholder={placeholder}
            />
          )
        }
        if (type === 'select') {
          return (
            <select
              inline
              inline-font-size-14px
              inline-height-30px
              inline-min-width-200px
              inline-padding-4px
              value={value}
              placeholder={placeholder}
              onChange={(e) => {
                value.value = e.target.value
              }}>
              {options?.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          )
        }
      }}
    </container>
  )
}

FormField.Style = (frag) => {
  frag.root.elements.select.style({
    border: '1px solid rgb(217, 217, 217)',
    borderRadius: '2px',
    outlineColor: 'rgb(64, 169, 255)'
  })
  frag.root.elements.asterisk.style({
    color: '#ff4d4f'
  })
}

FormField.propType = {
  required: propTypes.bool.default(() => atom(false)),
  value: propTypes.any.default(() => atom(''))
}

export default createComponent(FormField)

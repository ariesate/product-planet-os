import {
  createElement,
  createComponent,
  propTypes,
  reactive,
  delegateLeaf,
  useImperativeHandle,
  isAtom
} from 'axii'
import FormField from './FormField'

function isEmpty (value) {
  return value == null || value === ''
}

/**
 * @typedef {{key: string; label?: string; hidden?: boolean; type: 'input'|'select'; options?: any[]; required?: boolean; validator?: (value: any) => void; error?: string;}} Field
 * @typedef {{fields: Field[]; data: object}} Props
 * @type {import('axii').FC<Props>}
 * @param {Props} props
 */
function Form ({ ref, fields, data }) {
  if (ref) {
    useImperativeHandle(ref, () => ({
      validate () {
        for (const field of fields) {
          const required = isAtom(field.required) ? field.required.value : field.required
          if (required && isEmpty(data[field.key])) {
            throw new Error(field.error || `请填写${field.label || field.key}`)
          }
          if (typeof field.validator === 'function') {
            return field.validator.call(undefined, data[field.key])
          }
        }
      }
    }))
  }
  return (
    <container>
      {() =>
        fields.map(({ key, label, hidden, ...props }) => (
          <FormField
            {...props}
            key={key}
            layout:block-display={hidden?.value ? 'none' : 'block'}
            layout:block-margin-bottom-12px
            label={label || key}
            value={delegateLeaf(data)[key]}
          />
        ))
      }
    </container>
  )
}

Form.propTypes = {
  data: propTypes.object.default(() => reactive({}))
}
Form.forwardRef = true

export default createComponent(Form)

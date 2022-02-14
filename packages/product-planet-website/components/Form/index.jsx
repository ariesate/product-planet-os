import {
  createElement,
  createComponent,
  propTypes,
  reactive,
  delegateLeaf,
  useImperativeHandle
} from 'axii'
import FormField from './FormField'

function isEmpty (value) {
  return value == null || value === ''
}

/**
 * @typedef {{key: string; label?: string; type: 'input'|'select'; options?: any[]; required?: boolean; validator?: (value: any) => void; error?: string;}} Field
 * @typedef {{fields: Field[]; data: object}} Props
 * @type {import('axii').FC<Props>}
 * @param {Props} props
 */
function Form ({ ref, fields, data }) {
  if (ref) {
    useImperativeHandle(ref, () => ({
      validate () {
        for (const field of fields) {
          if (field.required && isEmpty(data[field.key])) {
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
        fields.map(({ key, label, ...props }) => (
          <FormField
            {...props}
            key={key}
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
  fields: propTypes.array.default(() => reactive([])),
  data: propTypes.object.default(() => reactive({}))
}
Form.forwardRef = true

export default createComponent(Form)

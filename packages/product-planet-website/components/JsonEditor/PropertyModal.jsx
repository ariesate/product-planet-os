import {
  createElement,
  createComponent,
  propTypes,
  atom,
  atomComputed,
  reactive,
  watch,
  batchOperation,
  useRef
} from 'axii'
import { message } from 'axii-components'
import Button from '../Button'
import Modal from '../Modal'
import Form from '../Form'

const Types = [
  {
    id: 'boolean',
    name: '布尔型'
  },
  {
    id: 'string',
    name: '字符串'
  },
  {
    id: 'number',
    name: '数值型'
  }
]

export function defaultOf (type) {
  switch (type) {
    case 'boolean':
      return false
    case 'number':
      return 0
    default:
      return ''
  }
}

/**
 * @type {import('axii').FC}
 */
function PropertyModal ({ visible, properties, data, propertykey }) {
  const property = reactive({ key: '', type: '', description: '' })
  const title = atomComputed(() =>
    propertykey.value ? '更新属性' : '添加属性'
  )
  const form = useRef()
  watch(
    () => visible.value,
    () => {
      if (visible.value) {
        if (propertykey.value) {
          property.key = propertykey.value
          const prop = properties[propertykey.value]
          property.type = prop?.type || ''
          property.description = prop?.description || ''
        } else {
          property.key = ''
          property.type = ''
          property.description = ''
        }
      }
    }
  )
  return (
    <Modal
      title={title}
      visible={visible}
      onCancel={() => {
        visible.value = false
      }}
      onOk={() => {
        try {
          form.current.validate()
        } catch (error) {
          message.error(error.message)
          return
        }
        batchOperation(properties, (props) => {
          if (propertykey.value) {
            delete props[propertykey.value]
          }
          props[property.key] = {
            type: property.type
          }
          if (property.description) {
            props[property.key].description = property.description
          }
        })
        visible.value = false
      }}
      footer={({ onOk, onCancel }) => {
        return (
          <div
            block
            flex-display
            flex-justify-content={
              propertykey.value ? 'space-between' : 'flex-end'
            }>
            {!propertykey.value
              ? null
              : (
              <Button
                primary
                danger
                onClick={() => {
                  onCancel?.()
                  delete properties[propertykey.value]
                  batchOperation(data, (data) => {
                    data.forEach((item) => {
                      delete item[propertykey.value]
                    })
                  })
                  propertykey.value = undefined
                }}>
                删除
              </Button>
                )}
            <div>
              <Button onClick={onCancel}>取消</Button>
              <Button
                layout:inline
                layout:inline-margin-left-8px
                primary
                onClick={onOk}>
                确认
              </Button>
            </div>
          </div>
        )
      }}>
      <Form
        ref={form}
        data={property}
        fields={[
          {
            key: 'key',
            label: '字段名称',
            required: true,
            validator: (value) => {
              if (
                (!propertykey.value || propertykey.value !== value) &&
                value in properties
              ) {
                throw new Error('字段名已存在')
              }
            }
          },
          {
            key: 'type',
            type: 'select',
            label: '字段类型',
            options: Types,
            required: true
          },
          {
            key: 'description',
            label: '字段描述'
          }
        ]}
      />
    </Modal>
  )
}

PropertyModal.propTypes = {
  visible: propTypes.bool.default(() => atom(false)),
  properties: propTypes.object.default(() => reactive({})),
  data: propTypes.object.default(() => reactive([])),
  propertykey: propTypes.string.default(() => atom())
}

export default createComponent(PropertyModal)

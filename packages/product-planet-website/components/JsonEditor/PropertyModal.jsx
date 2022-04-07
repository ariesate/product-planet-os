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
function PropertyModal ({ visible, json, propertykey }) {
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
          const prop = json.schema.items.properties[propertykey.value]
          property.type = prop?.type || ''
          property.description = prop?.description || ''
        } else {
          property.key = ''
          property.type = 'string'
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
        batchOperation(json, ({ schema, data }) => {
          let resetData = true
          if (propertykey.value) {
            resetData = schema.items.properties[propertykey.value].type !== property.type
            if (propertykey.value !== property.key) {
              data.forEach((item) => {
                if (!resetData) {
                  item[property.key] = item[propertykey.value]
                }
                delete item[propertykey.value]
              })
            }
            delete schema.items.properties[propertykey.value]
          }
          schema.items.properties[property.key] = {
            type: property.type
          }
          if (property.description) {
            schema.items.properties[property.key].description =
              property.description
          }
          if (resetData && property.type) {
            data.forEach((item) => {
              item[property.key] = defaultOf(property.type)
            })
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
                  delete json.schema.items.properties[propertykey.value]
                  batchOperation(json.data, (data) => {
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
              if (/[^a-zA-Z0-9_]/.test(value)) {
                throw new Error('名称格式只能包含字母、数字、下划线')
              }
              if (
                (!propertykey.value || propertykey.value !== value) &&
                value in json.schema.items.properties
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
  json: propTypes.object.default(() => reactive({ schema: {}, data: [] })),
  propertykey: propTypes.string.default(() => atom())
}

export default createComponent(PropertyModal)

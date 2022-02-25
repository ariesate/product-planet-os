import Modal from '@/components/Modal'
import Form from '@/components/Form'
import { Meta } from '@/models'
import {
  createElement,
  createComponent,
  atom,
  propTypes,
  reactive,
  useRef
} from 'axii'
import { message } from 'axii-components'

const DefaultSourceDataFormat = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      name: { type: 'string' },
      member: { type: 'boolean', description: '成员' }
    },
    required: []
  },
  required: []
}
const DefaultSourceData = [
  {
    id: 1,
    name: 'test',
    member: false
  }
]

/**
 * @type {import('axii').FC}
 */
function MetaModal ({ visible, data, group, onCreated }) {
  const loading = atom(false)
  const form = useRef()

  const createMeta = async () => {
    const dup = await Meta.findOne({
      where: {
        name: data.name,
        group: group.value.id
      },
      fields: ['id']
    })
    if (dup) {
      throw new Error('名称已存在')
    }
    return Meta.create({
      name: data.name,
      content: JSON.stringify({
        dataFormat: DefaultSourceDataFormat,
        data: DefaultSourceData
      }),
      group: group.value.id
    })
  }

  const dismiss = () => {
    data.name = ''
    data.type = 'json'
    visible.value = false
  }

  return (
    <Modal
      title="添加数据"
      visible={visible}
      loading={loading}
      onOk={async () => {
        try {
          form.current.validate()
        } catch (error) {
          message.error(error.message)
          return
        }
        let id
        loading.value = true
        try {
          id = await createMeta()
        } catch (error) {
          message.error(error.message)
          return
        } finally {
          loading.value = false
        }
        onCreated?.(id)
        dismiss()
      }}
      onCancel={dismiss}>
      <Form
        ref={form}
        data={data}
        fields={[
          {
            key: 'name',
            label: '数据名称',
            placeholder: '支持字母、数字、下划线',
            required: true,
            validator: (value) => {
              if (/[^a-zA-Z0-9_]/.test(value)) {
                throw new Error('名称格式只能包含字母、数字、下划线')
              }
              if (value.length > 30) {
                throw new Error('名称长度不能超过30个字符')
              }
            }
          },
          {
            key: 'type',
            type: 'select',
            label: '数据类型',
            required: true,
            options: [
              {
                id: 'json',
                name: '表格'
              }
            ]
          }
        ]}
      />
    </Modal>
  )
}

MetaModal.propTypes = {
  visible: propTypes.bool.default(() => atom(false)),
  data: propTypes.object.default(() => reactive({ name: '', type: 'json' })),
  group: propTypes.object.default(() => atom())
}

export default createComponent(MetaModal)

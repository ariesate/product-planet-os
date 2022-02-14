import Modal from '@/components/Modal'
import Form from '@/components/Form'
import { useVersion } from '@/layouts/VersionLayout'
import { Meta } from '@/models'
import api from '@/services/api'
import {
  createElement,
  createComponent,
  atom,
  propTypes,
  reactive,
  useRef
} from 'axii'
import { message } from 'axii-components'

/**
 * @type {import('axii').FC}
 */
function MetaModal ({ visible, data, group, onCreated }) {
  const loading = atom(false)
  const form = useRef()
  const version = useVersion()

  const createMeta = async () => {
    const { product } = version.value
    const { sourceId } = await api.firefly.createSource({
      sourceName: data.name,
      projectId: product.fireflyId,
      folderId: group.value.folderId
    })
    return Meta.create({
      name: data.name,
      sourceId,
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

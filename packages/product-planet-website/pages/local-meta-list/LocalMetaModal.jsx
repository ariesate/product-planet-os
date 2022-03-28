import Modal from '@/components/Modal'
import Form from '@/components/Form'
import { useVersion } from '@/layouts/VersionLayout'
import { LocalMeta } from '@/models'
import {
  createElement,
  createComponent,
  atom,
  propTypes,
  reactive,
  useRef,
  atomComputed
} from 'axii'
import { message } from 'axii-components'

const TypeOptions = [
  { id: 'map', name: '二维表' },
  { id: 'sheet', name: '电子表格' },
  { id: 'doc', name: '文档' },
  { id: 'code', name: '代码' },
  { id: 'image', name: '图片' },
  { id: 'custom', name: '自定义' }
]

/**
 * @type {import('axii').FC}
 */
function LocalMetaModal ({ visible, data, onCreated }) {
  const loading = atom(false)
  const form = useRef()
  const version = useVersion()

  const createMeta = async () => {
    return LocalMeta.create({
      name: data.name,
      desc: data.desc,
      type: data.type,
      editor: data.editor,
      version: version.value.id
    })
  }

  const dismiss = () => {
    data.name = ''
    data.desc = ''
    data.type = 'map'
    data.editor = ''
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
      <Form ref={form} data={data} fields={[
        {
          key: 'name',
          label: '数据名称',
          placeholder: '支持字母、数字、下划线',
          required: true,
          validator: (value) => {
            if (/[^a-zA-Z0-9_]/.test(value)) {
              throw new Error('名称格式只能包含字母、数字、下划线')
            }
            if (value.length > 20) {
              throw new Error('名称长度不能超过20个字符')
            }
          }
        },
        {
          key: 'type',
          type: 'select',
          label: '数据类型',
          required: true,
          options: TypeOptions
        },
        {
          key: 'editor',
          label: '插件地址',
          placeholder: '请填写编辑器地址',
          required: atomComputed(() => data.type === 'custom'),
          hidden: atomComputed(() => data.type !== 'custom'),
          validator: (value) => {
            if (data.type === 'custom' && !value) {
              throw new Error('请填写编辑器地址')
            }
          }
        },
        {
          key: 'desc',
          label: '数据描述',
          placeholder: '不超过50个字符',
          required: false,
          validator: (value) => {
            if (value?.length > 50) {
              throw new Error('描述长度不能超过50个字符')
            }
          }
        }
      ]} />
    </Modal>
  )
}

LocalMetaModal.propTypes = {
  visible: propTypes.bool.default(() => atom(false)),
  data: propTypes.object.default(() =>
    reactive({ name: '', desc: '', type: 'map', editor: '' })
  )
}

export default createComponent(LocalMetaModal)

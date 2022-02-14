import Modal from '@/components/Modal'
import Form from '@/components/Form'
import { useVersion } from '@/layouts/VersionLayout'
import { MetaGroup } from '@/models'
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
function MetaGroupModal ({ visible, data, onCreated }) {
  const loading = atom(false)
  const form = useRef()
  const version = useVersion()

  const createGroup = async () => {
    // 创建firely project
    const { product } = version.value
    if (!product.fireflyId) {
      const { projectId } = await api.firefly.createProject({
        projectName: `产品星球-${product.name}`,
        projectEnName: `product_planet_generated_${product.id}`
      })
      await product.update({ fireflyId: projectId })
    }
    // 创建firely folder
    const { folderId } = await api.firefly.createFolder({
      projectId: product.fireflyId,
      folderName: data.name
    })
    return await MetaGroup.create({
      name: data.name,
      folderId,
      product: product.id
    })
  }
  const dismiss = () => {
    data.name = ''
    visible.value = false
  }

  return (
    <Modal
      title="添加分组"
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
          id = await createGroup()
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
            label: '分组名称',
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
          }
        ]}
      />
    </Modal>
  )
}

MetaGroupModal.propTypes = {
  visible: propTypes.bool.default(() => atom(false)),
  data: propTypes.object.default(() => reactive({ name: '' }))
}

export default createComponent(MetaGroupModal)

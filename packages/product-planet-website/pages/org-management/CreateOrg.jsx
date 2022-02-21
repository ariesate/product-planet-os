import { createElement, createComponent, useRef, atom, reactive, propTypes } from 'axii'
import { message } from 'axii-components'
import Modal from '@/components/Modal'
import api from '@/services/api'
import Form from '@/components/Form'

/**
 * @type {import('axii').FC}
 */
function CreateOrg ({ visible, onCreated, data }) {
  const loading = atom(false)
  const form = useRef()

  const dismiss = () => {
    data.name = ''
    visible.value = false
  }

  return (
    <Modal
      title="创建组织"
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
          id = await api.orgs.createOrg(data.name)
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
            label: '组织名称',
            placeholder: '3至12个字符',
            required: true,
            validator: (value) => {
              if (value.length < 3) {
                throw new Error('名称长度不少于3个字符')
              }
              if (value.length > 12) {
                throw new Error('名称长度不能超过12个字符')
              }
            }
          }
        ]}
      />
    </Modal>
  )
}

CreateOrg.propTypes = {
  visible: propTypes.bool.default(() => atom(false)),
  data: propTypes.object.default(() => reactive({ name: '' })),
  group: propTypes.object.default(() => atom()),
  onCreated: propTypes.function
}

export default createComponent(CreateOrg)

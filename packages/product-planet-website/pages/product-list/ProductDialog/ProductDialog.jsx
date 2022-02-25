import { createElement, atom, computed, createComponent, reactive, propTypes } from 'axii'
import { message, Input } from 'axii-components'
import { Dialog } from '@/components/Dialog/Dialog'
import Textarea from '@/components/Textarea'
import api from '@/services/api'
import ImageUpload from '@/components/ImageUpload'

ProductDialog.propTypes = {
  type: propTypes.string.default(() => atom('create')),
  visible: propTypes.bool.default(() => atom(false)),
  submitCallback: propTypes.function,
  initialValues: propTypes.object.default(() => reactive({
    name: undefined,
    description: undefined,
    logo: undefined
  }))
}

function ProductDialog ({
  type,
  visible,
  submitCallback,
  initialValues
}) {
  const title = computed(() => `${type.value === 'create' ? '新建' : '编辑'}产品`)
  const file = atom(null)

  // ======================== 表单数据校验 ========================
  const validateForm = async () => {
    if (!initialValues.name || initialValues.name.length > 50) {
      return Promise.reject(new Error('请填写名称，最大支持 50 个字符'))
    }
    if (initialValues.description && initialValues.description.length > 200) {
      return Promise.reject(new Error('产品描述最多支持 200 个字符'))
    }
    return Promise.resolve()
  }

  // ======================== 提交表单 ========================
  const submitting = atom(false)
  const handleSubmit = async () => {
    try {
      await validateForm()
    } catch (error) {
      message.warning(error.message)
    }
    submitting.value = true
    const uploadLogo = async (productId) => {
      if (file.value) {
        const ext = file.value.name.slice(file.value.name.lastIndexOf('.'))
        initialValues.logo = await api.$upload(file.value, `product/${productId}/logo${ext}`)
      }
    }
    try {
      if (type.value === 'create') {
        const id = api.product.createProduct(initialValues)
        await uploadLogo(id)
        await api.product.updateProduct({
          id,
          logo: initialValues.logo
        })
      } else {
        await uploadLogo(initialValues.id)
        await api.product.updateProduct(initialValues)
      }
      message.success(title.value + '成功')
      visible.value = false
      submitCallback?.()
    } catch (error) {
      message.error(error.message)
    } finally {
      submitting.value = false
    }
  }

  // ======================== 表单字段渲染 ========================
  const FORM_SCHEMA = {
    name: {
      label: '名称',
      renderer: () =>
        <Input
          value={initialValues?.name || ''}
          onChange={(_, __, e) => (initialValues.name = e.target.value)}
        />
    },
    description: {
      label: '介绍',
      renderer: () =>
        <Textarea
          rows={5}
          value={initialValues?.description || ''}
          onChange={(e) => (initialValues.description = e.target.value)}
        />
    },
    logo: {
      label: '图标',
      renderer: () => {
        return (
          <div block flex-display flex-direction-column style={{ gap: 10 }}>
             <ImageUpload value={initialValues.logo} width="200px" height="200px" onChange={e => {
               file.value = e
             }} />
          </div>
        )
      }
    }
  }

  return (
    <Dialog
      width="500px"
      title={title}
      visible={visible}
      onCancel={() => (visible.value = false)}
      onSure={handleSubmit}
      loading={submitting}
    >
      <form block flex-display flex-direction-column style={{ gap: '24px' }}>
        {() =>
          Object.keys(FORM_SCHEMA).map((key) => {
            const item = FORM_SCHEMA[key]
            return (
              <form-item block flex-display key={key}>
                <label block>
                  <span inline inline-line-height-30px inline-width-90px>{() => item.label}：</span>
                </label>
                <control block flex-display flex-direction-column style={{ flex: 1 }}>
                  {() => item.renderer()}
                </control>
              </form-item>
            )
          })
        }
      </form>
    </Dialog>
  )
}

export default createComponent(ProductDialog)

import ButtonNew from '@/components/Button.new'
import ImageUpload from '@/components/ImageUpload'
import Textarea from '@/components/Textarea'
import { useVersion } from '@/layouts/VersionLayout'
import api from '@/services/api'
import { updateProductVersion } from '@/utils/util'
import {
  createElement,
  Fragment,
  createComponent,
  atomComputed,
  atom
} from 'axii'
import { Input, message } from 'axii-components'

UpdateBaseInfo.propTypes = {}

function UpdateBaseInfo () {
  const version = useVersion()
  const product = atomComputed(() => version.value.product)
  const initialValues = atomComputed(() => ({
    id: product.value.id,
    name: product.value.name,
    description: product.value.description,
    logo: product.value.logo
  }))
  const file = atom(null)

  // ======================== 表单字段渲染 ========================
  const FORM_SCHEMA = {
    name: {
      label: '名称',
      renderer: () => (
        <Input
          value={initialValues.value?.name || ''}
          onChange={(_, __, e) => (initialValues.value.name = e.target.value)}
        />
      )
    },
    description: {
      label: '介绍',
      renderer: () => (
        <Textarea
          rows={5}
          value={initialValues.value?.description || ''}
          onChange={(e) => (initialValues.value.description = e.target.value)}
        />
      )
    },
    logo: {
      label: '图标',
      renderer: () => {
        return (
          <div block flex-display flex-direction-column style={{ gap: 10 }}>
            <ImageUpload value={initialValues.value.logo} width="200px" height="200px" onChange={e => {
              file.value = e
            }} />
          </div>
        )
      }
    }
  }

  // ======================== 表单数据校验 ========================
  const validateForm = async () => {
    if (!initialValues.value.name || initialValues.value.name.length > 50) {
      return Promise.reject(new Error('请填写名称，最大支持 50 个字符'))
    }
    if (initialValues.value.description && initialValues.value.description.length > 200) {
      return Promise.reject(new Error('产品描述最多支持 200 个字符'))
    }
    return Promise.resolve()
  }

  // ======================== 更新基本信息 ========================
  const submitting = atom(false)
  const handleUpdate = async () => {
    try {
      await validateForm()
    } catch (error) {
      message.error(error.message)
    }
    submitting.value = true
    if (file.value) {
      const ext = file.value.name.slice(file.value.name.lastIndexOf('.'))
      initialValues.value.logo = await api.$upload(file.value, `product/${product.value.id}/logo${ext}`)
    }
    try {
      await api.product.updateProduct(initialValues.value)
      message.success('更新成功')
      updateProductVersion(version)
    } catch (error) {
      message.error(error.message)
    } finally {
      submitting.value = false
    }
  }

  return (
    <>
      <form block flex-display flex-direction-column style={{ gap: '10px' }}>
        {() =>
          Object.keys(FORM_SCHEMA).map((key) => {
            const item = FORM_SCHEMA[key]
            return (
              <form-item
                block
                flex-display
                flex-direction-column
                style={{ gap: '5px' }}
                key={key}>
                <span inline inline-font-size-12px>
                  {() => item.label}：
                </span>
                <control
                  block
                  flex-display
                  flex-direction-column
                  style={{ flex: 1 }}>
                  {() => item.renderer()}
                </control>
              </form-item>
            )
          })
        }
      </form>
      <ButtonNew loading={submitting} onClick={handleUpdate}>保存</ButtonNew>
    </>
  )
}

export default createComponent(UpdateBaseInfo)

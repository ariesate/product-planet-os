import ButtonNew from '@/components/Button.new'
import Textarea from '@/components/Textarea'
import { useVersion } from '@/layouts/VersionLayout'
import { updateProduct } from '@/services/product'
import { updateProductVersion } from '@/utils/util'
import {
  createElement,
  Fragment,
  createComponent,
  propTypes,
  atomComputed,
  useRef,
  watch,
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
    logo: `https://bs3-hb1.corp.kuaishou.com/upload-product-planet/${product.value.logoPath}`
  }))

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
        const imgRef = useRef()
        return (
          <div block flex-display flex-direction-column style={{ gap: 10 }}>
            {() => {
              if (!initialValues.value?.logo) return null
              if (initialValues.value?.logo instanceof File) {
                const reader = new FileReader()
                reader.onload = function OnLoad () {
                  imgRef.current.src = this.result
                }
                reader.readAsDataURL(initialValues.value?.logo)
                return <img ref={imgRef} src="/#" width="200" />
              }
              return <img ref={imgRef} src={initialValues.value?.logo} width="200" />
            }}
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={(event) => {
                initialValues.value.logo = event.target.files?.[0]
              }}>
              上传图片
            </input>
          </div>
        )
      }
    }
  }

  // ======================== 表单数据校验 ========================
  const validateForm = async () => {
    if (!initialValues.value.name || initialValues.value.name.length > 50) {
      return Promise.reject('请填写名称，最大支持 50 个字符')
    }
    if (initialValues.value.description && initialValues.value.description.length > 200) {
      return Promise.reject('产品描述最多支持 200 个字符')
    }
    return Promise.resolve()
  }

  // ======================== 更新基本信息 ========================
  const submitting = atom(false)
  const handleUpdate = async () => {
    await validateForm()
    submitting.value = true
    updateProduct(initialValues.value)
      .then(() => {
        message.success('更新成功')
        updateProductVersion(version)
      })
      .finally(() => {
        submitting.value = false
      })
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

UpdateBaseInfo.Style = (fragments) => {}

export default createComponent(UpdateBaseInfo)

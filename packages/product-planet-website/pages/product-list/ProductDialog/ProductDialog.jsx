import { createElement, Fragment, useViewEffect, atom, computed, createComponent, useRef, reactive, propTypes } from 'axii'
import { Button, useForm, message, Input, Select } from 'axii-components'
import { Dialog } from '@/components/Dialog/Dialog'
import { createProduct, updateProduct } from '@/services/product'
import { NOOP } from '@/tools/noop'
import Textarea from '@/components/Textarea'
import api from '@/services/api'

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
  const projects = reactive([])

  useViewEffect(() => {
    fetchData()
  })

  const fetchData = async () => {
    const data = await api.team.getProjects() || []
    projects.push(...data.map(item => ({
      name: item.projectName,
      id: item.projectId
    })))
  }

  // ======================== 表单数据校验 ========================
  const validateForm = async () => {
    if (!initialValues.name || initialValues.name.length > 50) {
      return Promise.reject('请填写名称，最大支持 50 个字符')
    }
    if (initialValues.description && initialValues.description.length > 200) {
      return Promise.reject('产品描述最多支持 200 个字符')
    }
    return Promise.resolve()
  }

  // ======================== 提交表单 ========================
  const submitting = atom(false)
  const handleSubmit = async () => {
    submitting.value = true
    validateForm()
      .then(
        () =>
          (type.value === 'create' ? createProduct : updateProduct)(initialValues)
            .then(() => {
              message.success(title.value + '成功')
              visible.value = false
              submitCallback?.()
            })
        ,
        msg => message.warning(msg)
      )
      .finally(() => {
        submitting.value = false
      })
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
        const imgRef = useRef()
        return (
          <div block flex-display flex-direction-column style={{ gap: 10 }}>
            {() => {
              if (!initialValues?.logo) return null
              if (initialValues?.logo instanceof File) {
                const reader = new FileReader()
                reader.onload = function OnLoad () {
                  imgRef.current.src = this.result
                }
                reader.readAsDataURL(initialValues?.logo)
                return <img ref={imgRef} src="/#" width="200"/>
              }
              return <img ref={imgRef} src={initialValues?.logo} width="200"/>
            }}
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={(event) => {
                initialValues.logo = event.target.files?.[0]
              }}
            >
              上传图片
            </input>
          </div>
        )
      }
    }
  }

  if (type.value === 'create') {
    FORM_SCHEMA.team = {
      label: 'Team 项目',
      renderer: () =>
        <Select
          layout:inline-width-200px
          options={projects}
          onChange={((option, { value }) => {
            initialValues.teamProjectId = value.value.id
          })}
        />
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

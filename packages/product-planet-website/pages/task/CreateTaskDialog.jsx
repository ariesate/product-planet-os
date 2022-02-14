import {
  createElement,
  atom,
  computed,
  createComponent,
  reactive,
  propTypes,
  useViewEffect
} from 'axii'
import { Select, message, Input } from 'axii-components'
import { Dialog } from '@/components/Dialog/Dialog'
import Textarea from '@/components/Textarea'
import { getFields } from '@/services/team'
import { getSearch } from '@/services/member'
import { createTask } from '@/services/team/index.js'
import { useVersion } from '@/layouts/VersionLayout/index.js'
import api from '@/services/api'

CreateTaskDialog.propTypes = {
  type: propTypes.string.default(() => atom('create')),
  visible: propTypes.bool.default(() => atom(false)),
  submitCallback: propTypes.function.default(() => () => {}),
  labelType: propTypes.string.default(() => atom('')),
  data: propTypes.object.default(() => reactive({})),
}

function CreateTaskDialog ({
  type,
  visible,
  data,
  submitCallback
}) {
  const version = useVersion()
  const fields = reactive([])
  const userOptions = reactive([])
  const values = reactive({})
  const title = computed(() => `${Object.keys(data).length ? '修改' : '创建'}${type.value === 'children' ? '子' : '需求'}任务`)
  const classId = atom('')

  useViewEffect(() => {
    fetchData()
  })

  const fetchData = async () => {
    const projectId = version.value.product?.teamProjectId
    if (!projectId) return
    const classes = await api.team.getTaskClass({
      projectId
    })
    classId.value = classes.find(item => item.taskClassName === '需求').taskClassId
    const data = await api.team.getFields({ taskClassId: classId.value })
    Object.assign(fields, data, {})
  }

  const handleUserChange = async (e, fieldKey, value) => {
    if (e?.type === 'input') {
      const value = e.target?.value
      const users = (await getSearch(value)) || []
      userOptions.splice(0, userOptions.length, ...users)
    } else {
      values[fieldKey] = value.value
    }
  }

  // ======================== 表单字段渲染 ========================
  const FORM_SCHEMA = computed(() => {
    const data = fields.filter(field => field.required).filter(field => {
      return (field.fieldType === 'DROP_DOWN_SINGLE' && field.fieldItemModels) || field.fieldType === 'USER_PICKER'
    })
    const schema = {
      title: {
        label: '任务名',
        required: true,
        renderer: () =>
          <Input
            value={values?.title || ''}
            onChange={(_, __, e) => (values.title = e.target.value)}
          />
      },
      description: {
        label: '描述',
        required: false,
        renderer: () =>
          <Textarea
            rows={5}
            value={values?.description || ''}
            onChange={(e) => (values.description = e.target.value)}
          />
      }
    }
    data.forEach(field => {
      Object.assign(schema, {
        [field.fieldKey]: {
          label: field.fieldName,
          format: true,
          required: true,
          renderer: () => {
            const key = field.fieldKey
            if (field.fieldType === 'USER_PICKER') {
              return <Select
                layout:inline-width-200px
                options={userOptions}
                onChange={(option, { value }, c, event) => handleUserChange(event, key, value)}
                renderOption={(option) => `${option.name} (${option.id})`}
                recommendMode
              />
            }
            if (field.fieldType === 'DROP_DOWN_SINGLE') {
              const options = field.fieldItemModels.map(model => ({
                name: model.itemName,
                id: model.itemValue
              }))
              return <Select
                layout:inline-width-200px
                options={options}
                onChange={(option, { value }) => {
                  values[key] = value.value
                }}
              />
            }
          }
        }
      })
    })
    return schema
  })

  // ======================== 表单数据校验 ========================
  const validateForm = async () => {
    let errMsg = ''
    for (const key of Object.keys(FORM_SCHEMA)) {
      if (!values[key] && FORM_SCHEMA[key].required) {
        errMsg = `请填写${FORM_SCHEMA[key].label}信息`
        break
      }
    }
    if (errMsg) return Promise.reject(errMsg)
    return Promise.resolve
  }

  // ======================== 提交表单 ========================
  const submitting = atom(false)
  const handleSubmit = async () => {
    submitting.value = true
    validateForm()
      .then(
        async () => {
          const data = {
            fields: {}
          }
          for (const key in FORM_SCHEMA) {
            if (FORM_SCHEMA[key].format) {
              data.fields[key] = [values[key].id]
            } else {
              data[key] = values[key]
            }
          }
          const projectId = version.value.product?.teamProjectId
          const res = await createTask({
            ...data,
            projectId,
            sectionId: version.value.teamSectionId,
            taskClass: classId.value
          })
          // Team 创建完任务后马上请求接口的话拿不到新任务，得等会
          setTimeout(() => {
            submitCallback?.(res.taskId)
            message.success(title.value + '成功')
            submitting.value = false
            visible.value = false
          }, 1000)
        }
        ,
        msg => message.warning(msg)
      )
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
                <label block block-width-80px>
                  <span inline inline-line-height={'30px'}>{() => item.label}：</span>
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

export default createComponent(CreateTaskDialog)

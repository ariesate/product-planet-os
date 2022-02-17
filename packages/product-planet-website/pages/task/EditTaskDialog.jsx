import {
  createElement,
  atom,
  createComponent,
  reactive,
  propTypes
} from 'axii'
import { Select, message, Input, useRequest } from 'axii-components'
import { Dialog } from '@/components/Dialog/Dialog'
import Textarea from '@/components/Textarea'
import api from '@/services/api'
import { Task } from '@/models'

CreateTaskDialog.propTypes = {
  type: propTypes.string.default(() => atom('create')),
  visible: propTypes.bool.default(() => atom(false)),
  submitCallback: propTypes.function.default(() => () => {}),
  labelType: propTypes.string.default(() => atom('')),
  data: propTypes.object.default(() => reactive({}))
}

// 因为任务信息字段与 schema 字段不统一，所以重新写了个组件

function CreateTaskDialog({ visible, data, submitCallback }) {
  const userOptions = reactive([])
  const values = reactive({
    taskName: data.taskName,
    description: data.description,
    priority: {
      id: data.priorityId,
      name: data.priorityName
    },
    assignee: {
      email: data.assignee.email,
      id: data.assignee.id
    }
  })
  const title = '修改任务'

  const { data: priorityOpts } = useRequest(async () => {
    return {
      data: await api.team.getPriority()
    }
  }, {
    data: atom([])
  })

  const handleUserChange = async (e, fieldKey, value) => {
    if (e?.type === 'input') {
      const value = e.target?.value
      const users = (await api.orgs.findOrgMembers(value)) || []
      userOptions.splice(0, userOptions.length, ...users)
    } else {
      values[fieldKey] = value.value
    }
  }

  // ======================== 表单字段渲染 ========================
  const FORM_SCHEMA = {
    taskName: {
      label: '任务名',
      required: true,
      renderer: () => (
        <Input
          value={values.taskName}
          onChange={(_, __, e) => (values.taskName = e.target.value)}
        />
      )
    },
    description: {
      label: '描述',
      required: false,
      renderer: () => (
        <Textarea
          rows={5}
          value={values.description || ''}
          onChange={(e) => (values.description = e.target.value)}
        />
      )
    },
    assignee: {
      label: '执行人',
      required: true,
      renderer: () =>
        <Select
          layout:inline-width-200px
          value={values.assignee}
          options={userOptions}
          onChange={(option, { value }, c, event) => handleUserChange(event, 'assignee', value)}
          renderOption={(option) => `${option.email} (${option.id})`}
          renderValue={x => x.email}
          recommendMode
        />
    },
    priority: {
      label: '优先级',
      required: true,
      renderer: () =>
        <Select
          layout:inline-width-200px
          value={values.priority}
          options={priorityOpts.value}
          renderValue={x => x.name}
          onChange={(option, { value }) => {
            values.priority = value.value
          }}
        />
    }
  }

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
    validateForm().then(
      async () => {
        await Task.update(data.id, {
          taskName: values.taskName,
          description: values.description,
          assignee: values.assignee.id,
          priorityId: values.priority.id,
          priorityName: values.priority.name
        })
        submitCallback?.()
        message.success(title + '成功')
        submitting.value = false
        visible.value = false
      },
      (msg) => message.warning(msg)
    )
  }

  return (
    <Dialog
      width="500px"
      title={title}
      visible={visible}
      onCancel={() => (visible.value = false)}
      onSure={handleSubmit}
      loading={submitting}>
      <form block flex-display flex-direction-column style={{ gap: '24px' }}>
        {() =>
          Object.keys(FORM_SCHEMA).map((key) => {
            const item = FORM_SCHEMA[key]
            return (
              <form-item block flex-display key={key}>
                <label block block-width-80px>
                  <span inline inline-line-height={'30px'}>
                    {() => item.label}：
                  </span>
                </label>
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
    </Dialog>
  )
}

export default createComponent(CreateTaskDialog)

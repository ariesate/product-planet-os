import {
  createElement,
  atom,
  computed,
  createComponent,
  reactive,
  propTypes
} from 'axii'
import { Select, message, Input, useRequest } from 'axii-components'
import { Dialog } from '@/components/Dialog/Dialog'
import Textarea from '@/components/Textarea'
import { createTask } from '@/services/team/index.js'
import { useVersion } from '@/layouts/VersionLayout/index.js'
import api from '@/services/api'
import Voice from './Voice'
import VoiceIcon from 'axii-icons/Voice'

CreateTaskDialog.propTypes = {
  type: propTypes.string.default(() => atom('create')),
  visible: propTypes.bool.default(() => atom(false)),
  submitCallback: propTypes.function.default(() => () => {}),
  labelType: propTypes.string.default(() => atom('')),
  data: propTypes.object.default(() => reactive({}))
}

function CreateTaskDialog ({ type, visible, data, submitCallback }) {
  const version = useVersion()
  const userOptions = reactive([])
  const values = reactive({})
  const title = computed(
    () =>
      `${Object.keys(data).length ? '修改' : '创建'}${
        type.value === 'children' ? '子' : '需求'
      }任务`
  )
  // 目前只有需求任务，暂时写死 1 了
  const classId = atom(1)
  const showVoice = atom(false)

  const { data: priorityOpts } = useRequest(
    async () => {
      return {
        data: await api.team.getPriority()
      }
    },
    {
      data: atom([])
    }
  )

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
    title: {
      label: '任务名',
      required: true,
      renderer: () => (
        <Input
          value={values?.title || ''}
          onChange={(_, __, e) => (values.title = e.target.value)}
        />
      )
    },
    description: {
      label: '描述',
      required: false,
      renderer: () => (
        <div block block-position-relative>
          <Textarea
            rows={5}
            value={values?.description || ''}
            onChange={(e) => (values.description = e.target.value)}
            width="100%"
            block
            block-width="100%"
            block-box-sizing-border-box
          />
          <VoiceIcon
            size="16"
            unit="px"
            style={{
              position: 'absolute',
              right: 10,
              bottom: 10,
              cursor: 'pointer'
            }}
            onClick={() => (showVoice.value = true)}
          />
        </div>
      )
    },
    assignee: {
      label: '执行人',
      required: true,
      renderer: () => (
        <Select
          layout:inline-width-200px
          options={userOptions}
          onChange={(option, { value }, c, event) =>
            handleUserChange(event, 'assignee', value)
          }
          renderOption={(option) => `${option.email} (${option.id})`}
          renderValue={(value) => (value.value ? value.value.email : '')}
          recommendMode
        />
      )
    },
    priority: {
      label: '优先级',
      required: true,
      renderer: () => (
        <Select
          layout:inline-width-200px
          options={priorityOpts.value}
          onChange={(option, { value }) => {
            values.priority = value.value
          }}
        />
      )
    },
    reporter: {
      label: '报告人',
      required: true,
      renderer: () => (
        <Select
          layout:inline-width-200px
          options={userOptions}
          onChange={(option, { value }, c, event) =>
            handleUserChange(event, 'reporter', value)
          }
          renderOption={(option) => `${option.email} (${option.id})`}
          renderValue={(value) => (value.value ? value.value.email : '')}
          recommendMode
        />
      )
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
    validateForm().then(
      async () => {
        submitting.value = true
        const versionId = version.value.id
        const productId = version.value.product.id
        const res = await createTask({
          ...values,
          productId,
          versionId,
          taskClass: classId.value
        })
        submitCallback?.(res.id)
        message.success(title.value + '成功')
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
      {() => showVoice.value ? <Voice onTextChange={(text) => values.description = (values.description || '') + text}/> : null}
    </Dialog>
  )
}

export default createComponent(CreateTaskDialog)

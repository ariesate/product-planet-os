import {
  createElement,
  atom,
  computed,
  createComponent,
  useRef,
  reactive,
  propTypes,
  atomComputed
} from 'axii'
import { message, Input, Select } from 'axii-components'
import { Dialog } from '@/components/Dialog/Dialog'

const borderColor = 'rgb(206, 206, 206)'
const dataTypes = [
  { id: 'map', name: '二维表' },
  { id: 'sheet', name: '电子表格' },
  { id: 'doc', name: '文档' },
  { id: 'code', name: '代码' },
  { id: 'image', name: '图片' },
  { id: 'custom', name: '自定义' }
]

RuleDialog.propTypes = {
  type: propTypes.string.default(() => atom('create')),
  visible: propTypes.bool.default(() => atom(false)),
  submitCallback: propTypes.function.default(() => {}),
  initialValues: propTypes.object.default(() =>
    reactive({
      name: undefined,
      key: undefined
    })
  )
}

function RuleDialog ({ type, visible, submitCallback, initialValues }) {
  const title = computed(
    () => `${type.value === 'create' ? '新增' : '编辑'}元数据`
  )

  // ======================== 表单数据校验 ========================
  const validateForm = async () => {
    if (!initialValues.name || initialValues.name.length > 50) {
      return Promise.reject('请填写名称，最大支持 50 个字符')
    }
    if (!initialValues.key || initialValues.key.length > 20) {
      return Promise.reject('请填写key，最大支持 20 个字符')
    }

    if (!/^[a-zA-Z$_][a-zA-Z\d_]*$/.test(initialValues.key)) {
      return Promise.reject('元数据key必须为合法变量名')
    }
    return Promise.resolve
  }

  // ======================== 提交表单 ========================
  const submitting = atom(false)
  const handleSubmit = async () => {
    submitting.value = true
    validateForm()
      .then(
        () => submitCallback(initialValues),
        (msg) => message.warning(msg)
      )
      .finally(() => {
        submitting.value = false
      })
  }

  // ======================== 表单字段渲染 ========================
  const FORM_SCHEMA = {
    name: {
      label: '元数据名称',
      type: 'input',
      renderer: () => (
        <Input
          value={initialValues?.name || ''}
          onChange={(arg1, arg2, e) => {
            initialValues.name = e?.target?.value
          }}
        />
      )
    },
    key: {
      label: '元数据KEY',
      type: 'input',
      renderer: () => (
        <Input
          value={initialValues?.key || ''}
          placeholder="名称只能包含英文字母、数字和下划线"
          onInput={(e) => {
            if (
              e.target.value &&
              !/^[a-zA-Z$_][a-zA-Z\d_]*$/.test(e.target.value)
            ) {
              return
            }
            initialValues.key = e.target.value
          }}
        />
      )
    },
    type: {
      label: '元数据类型',
      type: 'select',
      renderer: () => (
        <select
          defaultValue={dataTypes.find(x => x.id === initialValues?.type)?.name}
          options={dataTypes}
          block
          block-height-32px
          style={{ borderColor }}
          onChange={(e) => {
            initialValues.type = e.target.value
            if (initialValues.type === 'custom') {
              FORM_SCHEMA.editor.visible = true
            }
          }}
        >
          {dataTypes.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      )
    },
    editor: {
      label: '编辑器地址',
      type: 'input',
      renderer: () => (
        <Input
          value={initialValues?.editor || ''}
          placeholder="如: https:/unpkg.com/@myeditorcool/sheeteditor@latest/dist/sheeteditor.es.js"
          onInput={(e) => {
            initialValues.editor = e.target.value
          }}
        />
      )
    }
  }

  return (
    <Dialog
      title={title}
      visible={visible}
      loading={submitting}
      onCancel={() => (visible.value = false)}
      onSure={handleSubmit}>
      <form block flex-display flex-direction-column style={{ gap: '24px' }}>
        {() => {
          return Object.keys(FORM_SCHEMA).map((key) => {
            const item = FORM_SCHEMA[key]
            return (
              <form-item
                flex-display
                key={key}
                style={atomComputed(() => {
                  const alignItems = item.type !== 'textarea' ? 'center' : 'flex-start'
                  const display = (key === 'editor' && initialValues.type !== 'custom') ? 'none' : 'flex'
                  return { display, alignItems }
                })}
              >
                <label block>{() => item.label}：</label>
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
        }}
      </form>
    </Dialog>
  )
}

export default createComponent(RuleDialog)

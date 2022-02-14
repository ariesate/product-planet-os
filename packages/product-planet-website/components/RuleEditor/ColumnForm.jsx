import { createElement, createComponent, atom, watch, computed } from 'axii'
import { Input } from 'axii-components'
import Dialog from '../Dialog'

const Types = [
  {
    id: 'bool',
    name: '布尔型'
  },
  {
    id: 'string',
    name: '字符串'
  },
  {
    id: 'number',
    name: '数值型'
  }
]

/**
 * @type {import('axii').FC}
 */
function ColumnForm ({ visible, data, onSubmit }) {
  const key = atom()
  const name = atom()
  const type = atom()
  watch(
    () => data.value,
    () => {
      key.value = data.value?.key
      name.value = data.value?.name
      type.value = data.value?.type
    }
  )
  const handleSubmit = () => {
    onSubmit?.({
      key: key.value,
      name: name.value,
      type: type.value,
      index: data.value.index
    })
  }
  const title = computed(() => (data.value.index == null ? '添加列' : '更新列'))
  return (
    <Dialog
    title={title}
      visible={visible}
      onCancel={() => {
        visible.value = false
      }}
      onSure={handleSubmit}>
      <container>
        <field block block-margin-bottom-12px>
          <label inline inline-margin-right-12px>
            唯一名称
          </label>
          <Input value={key} />
        </field>
        <field block block-margin-bottom-12px>
          <label inline inline-margin-right-12px>
            显示名称
          </label>
          <Input value={name} />
        </field>
        <field block block-margin-bottom-12px>
          <label inline inline-margin-right-12px>
            字段类型
          </label>
          <select
            value={type}
            inline
            inline-font-size-14px
            onChange={(e) => {
              type.value = e.target.value
            }}>
            {Types.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </field>
      </container>
    </Dialog>
  )
}

export default createComponent(ColumnForm)

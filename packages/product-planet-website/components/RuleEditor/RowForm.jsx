import { createElement, createComponent, atom, watch, computed } from 'axii'
import { Input } from 'axii-components'
import Dialog from '../Dialog'

/**
 * @type {import('axii').FC}
 */
function RowForm ({ visible, data, onSubmit }) {
  const key = atom()
  const name = atom()
  watch(
    () => data.value,
    () => {
      key.value = data.value?.key
      name.value = data.value?.name
    }
  )
  const handleSubmit = () => {
    onSubmit?.({
      key: key.value,
      name: name.value,
      index: data.value.index
    })
  }
  const title = computed(() => (data.value.index == null ? '添加行' : '更新行'))
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
      </container>
    </Dialog>
  )
}

export default createComponent(RowForm)

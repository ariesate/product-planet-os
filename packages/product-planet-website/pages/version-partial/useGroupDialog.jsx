/** @jsx createElement */
import {
  atomComputed,
  createElement,
  atom
} from 'axii'
import { Input, Checkbox } from 'axii-components'
import { VersionGroup } from '@/models'
import { Dialog } from '../../components/Dialog/Dialog'
import Modal from '../../components/Modal'
import { useLocalBool } from '@/hooks/useLocalAtom'

export default function useGroupDialog ({
  versionId,
  onAdd = () => {}
}) {
  const switchNow = useLocalBool('GROUP_DIALOG_SWITCH_NOW')
  const refresh = atom(0)

  const visible = atom(false)
  const name = atom('')
  const createLoading = atom(false)
  async function add () {
    createLoading.value = true

    try {
      const id = await VersionGroup.create({
        name: name.value,
        version: versionId
      })
      refresh.value++
      onAdd(id, switchNow.value)
    } catch (err) {
      Modal.confirm({ title: '功能提示：' + err.message })
    }

    createLoading.value = false
    visible.value = false
  }

  const sureText = atomComputed(() => {
    if (switchNow.value) {
      return '新建并切换'
    }
    return '新建'
  })

  const dialog = () => (
    <Dialog
      loading={createLoading}
      visible={visible} title="新建分组" sureText={sureText} onSure={add} onCancel={() => (visible.value = false)}>
      <row block>
        <span inline inline-margin="0 8px 0 0">
          新分组名称
        </span>
        <Input value={name} />
      </row>

      <box block block-margin="24px 0 0 0" style={{ color: '#999' }}>
        <Checkbox value={switchNow} >切换到新分组</Checkbox>
      </box>
    </Dialog>
  )

  return {
    node: dialog,
    visible,
    refresh
  }
}

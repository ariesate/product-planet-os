/** @jsx createElement */
import {
  delegateLeaf,
  watch,
  traverse,
  reactive,
  createElement,
  atom,
  atomComputed,
  draft
} from 'axii'
import { UseCase } from '@/models'
import { Input, Checkbox } from 'axii-components'
import { Dialog } from '../../components/Dialog/Dialog'
import { useLocalBool } from '@/hooks/useLocalAtom'

export default function useNewCaseDialog ({
  versionId,
  caseItem = reactive({}),
  onAdd = () => {},
  onUpdate = () => {}
}) {
  const startNow = useLocalBool('UseCase_Should_StartNow')

  const refresh = atom(0)

  const visible = atom(false)
  const { draftValue, displayValue } = draft(caseItem)

  const innerCase = draftValue

  const createLoading = atom(false)
  async function addNewCase () {
    createLoading.value = true

    let id
    if (draftValue.id) {
      await UseCase.update(innerCase.id, {
        name: innerCase.name
      })
      refresh.value++
      createLoading.value = false
      visible.value = false

      onUpdate(caseItem)
    } else {
      id = await UseCase.create({
        name: innerCase.name,
        version: versionId
      })
      refresh.value++
      createLoading.value = false
      visible.value = false

      onAdd(id, startNow.value)
    }
  }

  const sureText = atomComputed(() => {
    if (innerCase.id) {
      return '更新'
    } else {
      if (startNow.value) {
        return '新建并开始录制'
      }
      return '新建'
    }
  })

  const titleText = atomComputed(() => {
    if (innerCase.id) {
      return '用例设置'
    }
    return '新建用例'
  })

  const dialog = () => (
    <Dialog
      loading={createLoading}
      visible={visible} title={titleText} sureText={sureText} onSure={addNewCase} onCancel={() => (visible.value = false)}>

      <formRow block flex-display flex-align-items="center" >
        名称：<Input layout:block value={delegateLeaf(innerCase).name} placeholder="新建用例" />
      </formRow>
      <box block block-margin="24px 0 0 0" style={{ color: '#999' }}>
        <Checkbox value={startNow}>是否立即开始录制</Checkbox>
      </box>
    </Dialog>
  )

  return {
    node: dialog,
    visible,
    refresh
  }
}

/** @jsx createElement */
import { createElement, atom } from 'axii'
import { Input } from 'axii-components'
import { ProductVersion } from '@/models'
import { Dialog } from '../../components/Dialog/Dialog'
import Modal from '../../components/Modal'
import { useVersion } from '@/layouts/VersionLayout'
import { updateProductVersion } from '@/utils/util'

export default function useNewVersionDialog ({ productId, onAdd }) {
  const refresh = atom(0)
  const version = useVersion()

  const visible = atom(false)
  const name = atom('')
  const createLoading = atom(false)
  async function add () {
    createLoading.value = true

    try {
      const data = await ProductVersion.startNewVersion({
        name: name.value,
        product: productId
      })
      const { teamProjectId } = version.value?.product || {}
      if (data.id && teamProjectId) {
        await ProductVersion.createTeamGroup({
          versionId: data.id,
          productId,
          teamSectionName: name.value,
          teamProjectId
        })
        await updateProductVersion(null, data.id)
      }
      refresh.value++
      onAdd(data.id)
    } catch (err) {
      Modal.confirm({ title: '功能提示：' + err.message })
    }

    createLoading.value = false
    visible.value = false
  }

  const dialog = () => (
    <Dialog
      loading={createLoading}
      visible={visible}
      title="新迭代"
      sureText="确定创建"
      onSure={add}
      onCancel={() => (visible.value = false)}>
      <row block>
        新迭代名称：
        <Input value={name} />
      </row>
    </Dialog>
  )

  return {
    node: dialog,
    visible,
    refresh
  }
}

/** @jsx createElement */
import {
  atom,
  atomComputed,
  createElement,
  createComponent,
  useViewEffect,
  watch,
  propTypes,
  computed
} from 'axii'
import { useVersion } from '@/layouts/VersionLayout'
import ButtonNew from '@/components/Button.new'
import Modal from '@/components/Modal'
import { ProductVersion } from '@/models'
import { updateProductVersion } from '@/utils/util'
import useNewVersionDialog from './useNewVersionDialog'
import useVersionHistoryDialog from './useVersionHistoryDialog'
import { historyLocation } from '@/router'
import { versionStatusMap, isVersionDone, mapStatusText } from './util'
import DisplayPartialList from './DisplayPartialList'
import GroupTabs from './GroupTabs'
import useGroupDialog from './useGroupDialog'

function ProductVersionFC () {
  const version = useVersion()
  console.log('version.value: ', version.value)
  if (!version.value) {
    return
  }
  const versionId = version.value.id
  const productId = version.value.product.id

  const groupId = atomComputed(() => {
    const v = parseInt(historyLocation.query.group)
    return isNaN(v) ? undefined : v
  })

  const newVersionDialog = useNewVersionDialog({
    productId,
    onAdd (newVersionId) {
      historyLocation.goto(`/product/${productId}/version/${newVersionId}/partial`)
      setTimeout(() => {
        location.reload()
      })
    }
  })

  const historyDialog = useVersionHistoryDialog({
    productId,
    versionId: atomComputed(() => version.value?.id)
  })

  const groupDialog = useGroupDialog({
    versionId,
    onAdd: (gid, switchNow) => {
      updateProductVersion(atom(null), versionId)
      if (switchNow) {
        historyLocation.patchQuery({ group: gid })
      }
    }
  })

  function onAdd () {
    groupDialog.visible.value = true
  }

  useViewEffect(() => {
    watch(() => newVersionDialog.refresh.value, () => {
      updateProductVersion(atom({}), versionId)
    })
  })

  function createNewVersion () {
    const isDone = isVersionDone(version.value)
    if (isDone) {
      newVersionDialog.visible.value = true
    } else {
      Modal.confirm({ title: '当前迭代未结束，暂无法创建新迭代' })
    }
  }

  function changeStatus (target) {
    if (target) {
      ProductVersion.update(versionId, { currentStatus: target }).then(() => {
        updateProductVersion(atom({}), versionId)
      })
    }
  }

  const actions = atomComputed(() => {
    const s = version.value?.currentStatus
    const actions = []
    switch (s) {
      case versionStatusMap.ARCHIVE:
      case versionStatusMap.DONE:
        break
      case versionStatusMap.UNDONE:
      case versionStatusMap.DRAFT:
        actions.push(...[
          <ButtonNew key="toDone" onClick={changeStatus.bind(null, versionStatusMap.DONE)}>结束</ButtonNew>,
          <ButtonNew key="toHold" onClick={changeStatus.bind(null, versionStatusMap.HOLD)}>暂停</ButtonNew>
        ])
        break
      case versionStatusMap.HOLD:
        actions.push(...[
          <ButtonNew key="toDone" onClick={changeStatus.bind(null, versionStatusMap.DONE)}>结束</ButtonNew>,
          <ButtonNew key="toUndone" onClick={changeStatus.bind(null, versionStatusMap.UNDONE)}>重启</ButtonNew>
        ])
        break
    }
    return actions
  })

  function addNewGroup () {
    groupDialog.visible.value = true
  }

  return (
    <productVersion block block-height="100%">
      <baseRow block block-padding="16px" flex-display flex-align-items="center">
        基础信息
        <action1 inline inline-margin="0 0 0 16px"><ButtonNew onClick={createNewVersion}>创建新迭代</ButtonNew></action1>
        <action2 inline inline-margin="0 0 0 16px" onClick={historyDialog.show} style={{ fontSize: 14 }}>查看历史</action2>
      </baseRow>
      <baseInfo block block-padding="16px" block-margin="0 16px 16px">
        <infoRow block>
          迭代id：{() => version.value.id}
        </infoRow>
        <infoRow block>
          名称：{() => version.value.name}
        </infoRow>
        <infoRow block>
          状态：{() => mapStatusText(version.value.currentStatus)}
        </infoRow>
        <versionActions block block-margin="16px 0 0 0">
          {() => actions.value.map(vdom => {
            vdom.attributes.style = { margin: '0 12px 0 0' }
            return vdom
          })}
        </versionActions>
      </baseInfo>

      <baseRow block block-padding="16px 16px 4px" flex-display flex-align-items="center">
        迭代变更
        <action3 inline inline-margin="0 0 0 16px"><ButtonNew onClick={addNewGroup}>创建新分组</ButtonNew></action3>
      </baseRow>
      <GroupTabs versionId={versionId} onAdd={addNewGroup}/>

      <displayPartialBox block block-margin="16px" >
        <DisplayPartialList entity="UseCase" productId={productId} versionId={versionId} groupId={groupId} />
        <DisplayPartialList entity="PageStatus" productId={productId} versionId={versionId} groupId={groupId} />
        <DisplayPartialList entity="Page" productId={productId} versionId={versionId} groupId={groupId} />
      </displayPartialBox>
      {newVersionDialog.node}
      {historyDialog.node}
      {groupDialog.node}
    </productVersion>
  )
}

ProductVersionFC.Style = (frag) => {
  const ele = frag.root.elements
  ele.productVersion.style({
    backgroundColor: '#fff'
  })
  ele.action2.style({
    textDecoration: 'underline',
    cursor: 'pointer'
  })
  ele.baseRow.style({
    fontSize: '20px'
  })
  ele.baseInfo.style({
    backgroundColor: '#fff',
    border: '1px solid #eee'
  })
  ele.infoRow.style({
    margin: '0 0 8px 0'
  })
  ele.displayPartialBox.style({
  })
}

export default createComponent(ProductVersionFC)

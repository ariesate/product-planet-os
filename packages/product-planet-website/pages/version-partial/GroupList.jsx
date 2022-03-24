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
import ButtonNew from '@/components/Button.new'
import { useRequest, Input, message, Checkbox } from 'axii-components'
import { useVersion } from '@/layouts/VersionLayout'
import List from '@/components/List'
import useGroupDialog from './useGroupDialog'
import { updateProductVersion } from '@/utils/util'
import { historyLocation } from '@/router'

function GroupsListRC (props) {
  const {
    groups,
    versionId
  } = props
  function switchTo (item) {
    historyLocation.patchQuery({ group: item.id })
  }
  const groupDialog = useGroupDialog({
    versionId,
    onAdd: (gid, switchNow) => {
      updateProductVersion(atom(null), versionId)
      if (switchNow) {
        historyLocation.patchQuery({ group: gid })
      }
    }
  })
  return (
    <groupsDialog block block-width="300px" >
      <List dataSource={groups} renderItem={(item, i) => {
        return (
          <List.Item border layout:block-padding="8px 12px"
            onClick={switchTo.bind(null, item)}
            extra={[<ButtonNew key="switch" >切换</ButtonNew>]}>
            {item.name}
          </List.Item>
        )
      }}/>
      <groupListAction block block-padding="8px 12px">
        <ButtonNew onClick={() => (groupDialog.visible.value = true)}>新增分组</ButtonNew>
      </groupListAction>
      {groupDialog.node}
    </groupsDialog>
  )
}

GroupsListRC.Style = (frag) => {
  const ele = frag.root.elements
  ele.groupsDialog.style({
    border: '1px solid #666',
    backgroundColor: '#fff'
  })
}

export default createComponent(GroupsListRC)

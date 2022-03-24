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
import { Tabs } from 'axii-components'
import { useVersion } from '@/layouts/VersionLayout'
import ButtonNew from '@/components/Button.new'
import { historyLocation } from '@/router'
import Plus from 'axii-icons/Plus'
import useGroupDialog from './useGroupDialog'
import { updateProductVersion } from '@/utils/util'

const GroupCustomTabs = Tabs.extend((frag) => {
  frag.tabHeader.elements.tabHeader.style(({ tabKey, visibleKey }) => {
    const isCurrent = tabKey === visibleKey.value
    return {
      borderRadius: '4px 4px 0 0',
      color: isCurrent ? '#fff' : '#333',
      backgroundColor: isCurrent ? '#262626' : '#fff',
      padding: '6px 24px',
      // fontWeight: isCurrent ? '',
      cursor: 'pointer'
    }
  })

  frag.tabHeaders.modify((vNodes, props) => {
    vNodes.push(
      <plusBox
        inline inline-height="22px" inline-position="relative" inline-top="4px" inline-margin-left="6px"
        style={{ cursor: 'pointer' }}
        onClick={props.onAdd}>
        <Plus size="22" unit="px" />
      </plusBox>
    )
  })
})

function GroupTabsFC ({ versionId, onAdd }) {
  const version = useVersion()
  const groups = atomComputed(() => {
    const g = version.value?.groups || []
    return [{ id: undefined, name: '全部' }].concat(g)
  })

  const queryGroup = atomComputed(() => {
    const v = parseInt(historyLocation.query.group)
    return isNaN(v) ? undefined : v
  })
  const currentGroup = atom(queryGroup.value)

  useViewEffect(() => {
    watch(() => queryGroup.value, () => {
      currentGroup.value = queryGroup.value
    })
    watch(() => currentGroup.value, () => {
      historyLocation.patchQuery({ group: currentGroup.value || '' })
    })
  })

  return (
    <groupTabs block block-padding="16px 16px 0">
      <GroupCustomTabs activeKey={queryGroup} onAdd={onAdd}>
        {() => groups.value.map((g) => {
          return (
            <Tabs.TabPane title={g.name} key={g.id} tabKey={g.id}>
            </Tabs.TabPane>
          )
        })}
      </GroupCustomTabs>
    </groupTabs>
  )
}
GroupTabsFC.Style = (frag) => {
  const ele = frag.root.elements
}

export default createComponent(GroupTabsFC)

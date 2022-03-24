/** @jsx createElement */
import {
  atomComputed,
  createElement,
  atom,
  reactive,
  computed,
  Fragment,
  draft
} from 'axii'
import ContextMenu from '@/components/ContextMenu'

export default function usePinMenu ({
  width = 160,
  disable,
  visible = atom(false),
  statuses,
  currentPins,
  onNewState = () => {},
  onNewPage = () => {},
  onRemove = () => {}
} = {}) {
  const { draftValue: innerVisible, displayValue } = draft(visible)
  const position = reactive({ x: 0, y: 0 })

  function MenuBox () {
    const menuStyle = computed(() => {
      return {
        position: 'absolute',
        top: `${position.y}px`,
        left: `${position.x}px`,
        zIndex: 1
      }
    })
    const delText = atomComputed(() => (currentPins.value[0]?.action?.id ? '删除' : '取消'))
    return (
      <>
      { () => (!disable.value && displayValue.value)
        ? (
            <menuBox block block-width={width} style={menuStyle}>
              <ContextMenu options={[
                {
                  title: '跳转到新页面',
                  onClick () {
                    innerVisible.value = false
                    onNewPage()
                  }
                },
                {
                  title: statuses.value.length <= 0 ? <span style={{ color: '#999' }}>没有更多状态</span> : '切换到新状态',
                  onClick () {
                    if (statuses.value.length > 0) {
                      onNewState()
                      innerVisible.value = false
                    }
                  }
                },
                {
                  title: delText.value,
                  onClick () {
                    innerVisible.value = false
                    onRemove()
                  }
                }
              ]}></ContextMenu>
            </menuBox>
          )
        : ''}
      </>
    )
  }
  return {
    MenuBox,
    visible: innerVisible,
    position
  }
}

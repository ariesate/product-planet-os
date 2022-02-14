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

export default function useMenu ({
  width = 160,
  disable,
  visible = atom(false),
  statuses,
  currentPin,
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
    const delText = atomComputed(() => (currentPin.value?.action?.id ? '删除' : '取消'))
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
                  title: '切换到新状态',
                  children: statuses.value.map(s => ({
                    title: s.name,
                    onClick () {
                      if (s.id) {
                        onNewState(s)
                      }
                      innerVisible.value = false
                    }
                  }))
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

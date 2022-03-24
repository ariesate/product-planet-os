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
import { contextmenu } from 'axii-components'

/**
 *
右键操作，只新增，对有的元素还是左键选中：
1.新增“点击”动作
2.新增“Hover”动作
3.结束录制/重新录制/开始录制，--> 跟当前的状态有关联
——

--

操作的callback需要透传到外部
 */

export const ACTION_TYPE_CLICK = 'click'
export const ACTION_TYPE_HOVER = 'hover'
export const ACTION_TYPE_BASE = 'base'
export const ACTION_TYPE_SHORTCUT = 'shortcut'
export const ACTION_TYPE_RIGHT_CLICK = 'rightClick'
export const ACTION_TYPE_SWITCH = 'outerSwitch'

/** 交互动作翻译 */
export const actionTypeMap = {
  [ACTION_TYPE_BASE]: '开始',
  [ACTION_TYPE_CLICK]: '点击',
  [ACTION_TYPE_HOVER]: 'hover',
  [ACTION_TYPE_SHORTCUT]: '快捷键',
  [ACTION_TYPE_RIGHT_CLICK]: '右键点击',
  [ACTION_TYPE_SWITCH]: '外部切换'
}

export default function useContextMenu ({
  actionPinEnable,
  editable,
  timeline,
  onAdd = () => {},
  onCheckProto = () => {}
}) {
  const pinButtonText = atomComputed(() => {
    if (editable.value) {
      return '结束录制'
    }
    if (timeline.length) {
      return '重新录制'
    } else {
      return '开始录制'
    }
  })

  function onContextMenuCb (e) {
    e.preventDefault()

    const options = []

    if (editable.value) {
      options.push(...[
        {
          title: '新增交互动作',
          children: [
            {
              title: '点击',
              onClick () {
                editable.value = true
                contextmenu.close()
                onAdd(e, ACTION_TYPE_CLICK)
              }
            },
            {
              title: 'Hover',
              onClick () {
                editable.value = true
                contextmenu.close()
                onAdd(e, ACTION_TYPE_HOVER)
              }
            },
            {
              title: '快捷键',
              onClick () {
                editable.value = true
                contextmenu.close()
                onAdd(e, ACTION_TYPE_SHORTCUT)
              }
            },
            {
              title: '右键点击',
              onClick () {
                editable.value = true
                contextmenu.close()
                onAdd(e, ACTION_TYPE_RIGHT_CLICK)
              }
            }
          ]
        },
        {
          title: '新增页面跳转',
          onClick () {
            editable.value = true
            contextmenu.close()
            onAdd(e, ACTION_TYPE_SWITCH)
          }
        },
        {
          title: '新增文字说明',
          onClick () {
            editable.value = true
            contextmenu.close()
            onAdd(e, null, 'TIPS')
          }
        },
        {
          title: '框选动作区域',
          onClick () {
            editable.value = true
            contextmenu.close()
            actionPinEnable.value = true
          }
        }
      ])
    }
    if (options.length > 0) {
      options.push({ title: <contextMenuLine block block-width="80px" block-height="1px" style={{ backgroundColor: '#666' }} /> })
    }
    options.push({
      title: '查看页面原型',
      onClick: () => {
        contextmenu.close()
        onCheckProto()
      }
    })
    options.push({
      title: pinButtonText.value,
      onClick: () => {
        contextmenu.close()
        editable.value = !editable.value
      }
    })

    contextmenu.open(
      <caseContextMenu block>
        <ContextMenu options={options}>
        </ContextMenu>
      </caseContextMenu>
      ,
      {
        left: e.pageX + 10, // +10 防止鼠标和Menu重叠
        top: e.pageY
      }
    )
  }

  return {
    onContextMenuCb
  }
}

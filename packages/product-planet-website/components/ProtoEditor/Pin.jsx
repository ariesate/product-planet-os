import { createElement, createComponent, atom, computed, useViewEffect } from 'axii'
import { PagePin } from '@/models'
import shortcut from '@/tools/shortcut'
// import { message } from 'axii-components'

const commonStyle = {
  display: 'block',
  position: 'absolute',
  caretColor: 'transparent',
  cursor: 'pointer'
}

export const PIN_TYPE = {
  ACTION: {
    id: 'ACTION',
    style: {
      ...commonStyle,
      backgroundColor: 'rgba(24,144,255,.6)'
    },
    portStyle: {
      border: '1px solid rgba(24,144,255,.6)'
    }
  },
  MARKUP: {
    id: 'MARKUP',
    style: {
      ...commonStyle,
      backgroundColor: 'rgba(239,175,65,.6)'
    },
    portStyle: {
      border: '1px solid rgba(239,175,65,.6)'
    }
  },
  TIPS: {
    id: 'TIPS',
    style: {
      display: 'inline',
      position: 'absolute'
    },
    portStyle: {
      display: 'none'
    }
  }
}

const PORT_RADIUS = 6

const pinId = id => `pin-${id}`
const tipsId = id => `tips-${id}`

const Pin = ({ draggable, data, onClick, onBlur, isStatusDraggable, scale, isMarkupVisible, selected }) => {
  /// Mark: 拖拽
  const isDraggable = atom(draggable)
  let bias = {}
  const dragPosition = (e) => {
    if (e.clientX < 0 || e.clientY < 0) return
    let pinNode = e.target
    // 有可能是 pin 的子节点
    while (pinNode?.id !== pinId(data.id)) {
      pinNode = pinNode.parentNode
    }
    const parent = pinNode.parentNode
    const { top, left } = parent.getBoundingClientRect()
    // console.log('dragPosition', e, left, top, bias)
    // CAUTION: clientX/left/bias 都是按当前实际距离算的，但 status 里的内容实际上被缩放了，设置 x 的时候要按比例还原
    const x = (e.clientX - left - bias.x) / scale
    const y = (e.clientY - top - bias.y) / scale
    pinNode.style.left = `${x}px`
    pinNode.style.top = `${y}px`
    return { x, y }
  }

  const updatePosition = (e) => {
    const { x, y } = dragPosition(e)
    data.x = x
    data.y = y
    PagePin.update(data.id, { x, y })
    // data 里 width/height 为 null 时后端会报错: Cannot read properties of undefined (reading 'targetLink')
    // data.save()
  }

  const onDragStart = (e) => {
    e.stopPropagation()
    if (!isDraggable.value) {
      e.preventDefault()
      return
    }
    isMarkupVisible.value = false
    isStatusDraggable.value = false

    const target = e.target
    e.dataTransfer.setDragImage(new Image(), 0, 0)
    const { top, left } = target.getBoundingClientRect()
    console.log('onDragStart', e, left, top)
    const x = e.clientX - left
    const y = e.clientY - top
    bias = { x, y }
  }

  // CAUTION: onDragOver 和 onDragEnd 这两个必须要 preventDefault 才能保证 onDrop 触发
  const onDragOver = (e) => {
    e.preventDefault()
  }

  const onDragEnd = (e) => {
    console.log('onDragEnd', e)
    e.preventDefault()
    updatePosition(e)
    isStatusDraggable.value = true
  }

  const onDragLeave = (e) => {
    console.log('onDragLeave', e)
    e.preventDefault()
  }

  const onDrag = (e) => {
    dragPosition(e)
    e.stopPropagation()
  }

  const onDrop = (e) => {
    console.log('onDrop', e)
    e.stopPropagation()
  }

  /// Mark: 缩放
  const isResizing = atom(false)
  const portPositions = computed(() => {
    return [
      // 左下
      { left: -PORT_RADIUS, bottom: -PORT_RADIUS, cursor: 'nesw-resize' },
      // 左中
      { left: -PORT_RADIUS, top: data.height / 2 - PORT_RADIUS, cursor: 'ew-resize' },
      // 左上
      { left: -PORT_RADIUS, top: -PORT_RADIUS, cursor: 'nwse-resize' },
      // 上中
      { left: data.width / 2 - PORT_RADIUS, top: -PORT_RADIUS, cursor: 'ns-resize' },
      // 右上
      { right: -PORT_RADIUS, top: -PORT_RADIUS, cursor: 'nesw-resize' },
      // 右中
      { right: -PORT_RADIUS, top: data.height / 2 - PORT_RADIUS, cursor: 'ew-resize' },
      // 右下
      { right: -PORT_RADIUS, bottom: -PORT_RADIUS, cursor: 'nwse-resize' },
      // 下中
      { right: data.width / 2 - PORT_RADIUS, bottom: -PORT_RADIUS, cursor: 'ns-resize' }
    ]
  })

  const onResizeStart = (port) => (e) => {
    if (!isDraggable.value) return
    // 禁用拖动、port 显示和编辑器显示，以免冲突
    isResizing.value = true
    isStatusDraggable.value = false
    isDraggable.value = false
    isMarkupVisible.value = false

    const { target, clientX: startX, clientY: startY } = e
    const { width: startW, height: startH } = data
    const pin = target.parentNode
    document.onmousemove = (ev) => {
      const { clientX, clientY } = ev
      const biasX = (clientX - startX) / scale
      const biasY = (clientY - startY) / scale
      const { left, right, top, bottom } = port
      let x = data.x
      let y = data.y
      let width = data.width
      let height = data.height
      if (left === -PORT_RADIUS) {
        const validateX = Math.min(biasX, startW)
        x += validateX
        width -= validateX
      }
      if (top === -PORT_RADIUS) {
        const validateY = Math.min(biasY, startH)
        y += validateY
        height -= validateY
      }
      if (right === -PORT_RADIUS) {
        width += biasX
      }
      if (bottom === -PORT_RADIUS) {
        height += biasY
      }

      pin.style.left = `${x}px`
      pin.style.top = `${y}px`
      pin.style.width = `${width}px`
      pin.style.height = `${height}px`

      document.onmouseup = () => {
        // 重置状态
        document.onmousemove = null
        document.onmouseup = null
        isStatusDraggable.value = true
        isDraggable.value = draggable

        // 保存数据
        data.x = x
        data.y = y
        data.width = width
        data.height = height
        data.save()

        setTimeout(() => {
          // 在 onPinClick 触发后再重置
          isResizing.value = false
        })
      }
    }
  }

  const onPinClick = (e) => {
    if (isResizing.value) return
    onClick(data)
    e.stopPropagation()
  }

  const isTips = data.type === PIN_TYPE.TIPS.id

  const updateTips = (e) => {
    e.stopPropagation()
    const content = e.target.innerText.trim()
    data.updateTips(content)
      .then(() => {
        // CAUTION: 原先根据用户输入生成的 innerText 是不受控的，有时候不会被清除，会和 data.tips.content 重复显示
        e.target.innerText = data.tips?.content || ''
      })
  }

  useViewEffect(() => {
    const tips = document.getElementById(tipsId(data.id))
    const blur = (e) => {
      e.preventDefault()
      tips.blur()
      onBlur()
    }
    const unbind = shortcut.bind(['meta+s', 'ctrl+s'], null, blur, () => false, tips)
    return unbind
  })

  return <pin
    draggable={isDraggable.value ? 'true' : false}
    onDragStart={onDragStart}
    onDrag={onDrag}
    onDragOver={onDragOver}
    onDragEnd={onDragEnd}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
    id={pinId(data.id)}
    onClick={onPinClick}
  >
    {() => portPositions.map((x, i) =>
      <port
        key={i}
        block
        block-position-absolute
        block-box-sizing-border-box
        style={{ ...x, display: selected && !isResizing.value ? 'block' : 'none' }}
        onMouseDown={onResizeStart(x)}
      />
    )}
    {() => isTips
      ? <tips key={tipsId(data.id)} id={tipsId(data.id)} inline inline-min-height-24px inline-min-width-16px contentEditable={selected} onBlur={updateTips}>
          {data?.tips?.content || ''}
        </tips>
      : null}
  </pin>
}

Pin.Style = (frag) => {
  const ele = frag.root.elements

  const genStyle = (data) => {
    const actionType = PIN_TYPE.ACTION
    const markupType = PIN_TYPE.MARKUP
    const tipsType = PIN_TYPE.TIPS
    if (data.action?.id && data.type !== PIN_TYPE.TIPS.id) {
      return actionType
    } else if (data.markup?.id) {
      return markupType
    } else if (data.tips?.id) {
      return tipsType
    } else {
      return PIN_TYPE[data.type || 'MARKUP']
    }
  }

  ele.pin.style(({ data }) => {
    const { x, y, width, height } = data

    const style = {
      top: y,
      left: x,
      width,
      height,
      borderRadius: 4
    }

    const extraStyle = genStyle(data).style

    return { ...style, ...extraStyle }
  })

  ele.port.style(({ data }) => {
    const style = {
      backgroundColor: '#fff',
      borderRadius: PORT_RADIUS * 2,
      width: PORT_RADIUS * 2,
      height: PORT_RADIUS * 2
    }

    const extraStyle = genStyle(data).portStyle

    return { ...style, ...extraStyle }
  })

  ele.tips.style(({ selected }) => ({
    backgroundColor: 'transport',
    border: selected ? '1px dashed red' : 'none',
    cursor: selected ? 'text' : 'grab',
    color: 'red',
    fontSize: '16px',
    // 取消选中时的蓝边
    outline: 'none',
    // 渲染换行符 \n
    whiteSpace: 'pre-line'
  }))
}

export default createComponent(Pin)

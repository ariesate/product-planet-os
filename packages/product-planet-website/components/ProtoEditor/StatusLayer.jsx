/* eslint-disable multiline-ternary */
/** @jsx createElement */
import { PageStatus } from '@/models'
import { createElement, createComponent, atom, reactive, useViewEffect } from 'axii'
import Pin from './Pin'
import shortcut from '@/tools/shortcut'
import { SCOPE } from './index'

const PORT_RADIUS = 6
const protoId = id => `proto-${id}`

let keepRatio = true

const StatusLayer = ({
  caseId,
  actionId,
  data,
  topStatus,
  resizable,
  onClick,
  selectedPin,
  onPinClick,
  pinMap,
  contentId,
  isDraggable,
  pinDraggable,
  isMarkupVisible,
  designMode,
  startSubscribePin,
  scale
}) => {
  console.log('render status', data)

  const updatePosData = () => {
    const { id, x, y, width, height } = data
    PageStatus.update(id, { x, y, width, height })
  }

  /// Mark: Drag
  let bias = {}
  const dragPosition = (e) => {
    if (e.clientX < 0 || e.clientY < 0) return
    const content = document.getElementById(contentId)
    const { top, left } = content.getBoundingClientRect()
    console.log('dragPosition', e, left, top, bias)
    // const target = e.target.parentNode
    const x = e.clientX - left - bias.x
    const y = e.clientY - top - bias.y
    // target.style.left = `${x}px`
    // target.style.top = `${y}px`
    statusStyle.left = x
    statusStyle.top = y
    return { x, y }
  }

  const updatePosition = (e) => {
    const { x: _x, y: _y } = dragPosition(e)
    const target = e.target.parentNode
    if (target.id === contentId) return
    // const status = statusMap.value[target.id]
    const x = _x / scale
    const y = _y / scale
    data.x = x
    data.y = y
    PageStatus.update(data.id, { x, y })
  }

  const onImgDragStart = (e) => {
    console.log('onImgStart', e, data.id !== topStatus.value.id, isDraggable.value)
    if (data.id !== topStatus.value.id || !isDraggable.value) {
      e.preventDefault()
    }
  }

  const onImgDrop = (e) => {
    console.log('onImgDrop', e, isDraggable.value)
    if (!isDraggable.value) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const onDragStart = (e) => {
    const target = e.target.parentNode
    if (target.id === contentId || !isDraggable.value) {
      e.preventDefault()
      return
    }
    const { top, left } = target.getBoundingClientRect()
    console.log('onDragStart', e, left, top)
    const x = e.clientX - left
    const y = e.clientY - top
    bias = { x, y }
    e.stopPropagation()
  }

  // CAUTION: onDragOver 和 onDragEnd 这两个必须要 preventDefault 才能保证 onDrop 触发
  const onDragOver = (e) => {
    e.preventDefault()
  }
  const onDragEnd = (e) => {
    e.preventDefault()
  }

  const onDrag = (e) => {
    dragPosition(e)
  }
  const onDrop = (e) => {
    console.log('onDrop', e)
    updatePosition(e)
    e.preventDefault()
  }

  /// Mark: Resize
  const isResizing = atom(false)

  // 一开始用 computed，但 data 变化的时候没有触发更新，暂时改成 atom
  const computePorts = () => [
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
  const portPositions = atom(computePorts())

  const onResizeStart = (port) => (e) => {
    if (!isDraggable.value) return
    // 禁用拖动、port 显示和编辑器显示，以免冲突
    isResizing.value = true
    isDraggable.value = false
    isMarkupVisible.value = false

    const { clientX: startX, clientY: startY } = e
    const { width: startW, height: startH } = data

    const ratio = startW / startH

    document.onmousemove = (ev) => {
      const { clientX, clientY } = ev
      const biasX = (clientX - startX) / scale
      const biasY = (clientY - startY) / scale
      const { left, right, top, bottom } = port
      let x = data.x
      let y = data.y
      let width = data.width
      let height = data.height

      if (keepRatio) {
        // 默认等比缩放
        if (left === -PORT_RADIUS) {
          const validateX = Math.min(biasX, startW)
          x += validateX
          width -= validateX
          height = width / ratio
        }
        if (right === -PORT_RADIUS) {
          width += biasX
          height = width / ratio
        }

        // 左右下角，往对角线缩放，y 不需要变化

        // 左右上角，往对角线缩放
        if (top === -PORT_RADIUS) {
          y += startH - height
        }

        // 左右中心点，往中轴缩放
        if (top !== -PORT_RADIUS && bottom !== -PORT_RADIUS) {
          y += (startH - height) / 2
        }

        // 上下中心点，往中轴缩放，并且以 height 为主变化（上面都以 width 为主）
        if (left !== -PORT_RADIUS && right !== -PORT_RADIUS) {
          const validateY = Math.min(biasY, startH)
          if (top === -PORT_RADIUS) {
            y += validateY
            height -= validateY
          } else {
            height += biasY
          }
          width = height * ratio
          x += (startW - width) / 2
        }
      } else {
        // 按住 shfit 自由缩放
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
      }

      statusStyle.left = x
      statusStyle.top = y
      imgStyle.width = width
      imgStyle.height = height

      document.onmouseup = () => {
        // 重置状态
        document.onmousemove = null
        document.onmouseup = null
        isDraggable.value = !caseId
        keepRatio = true

        // 保存数据
        data.x = x
        data.y = y
        data.width = width
        data.height = height
        updatePosData()
        portPositions.value = computePorts()

        // 等 onClick 触发后再重置状态
        // setTimeout(() => {
        isResizing.value = false
        // })
      }
    }
  }

  // const selected = atom(selected)
  // const onClick = (e) => {
  //   _onClick(e)
  //   console.log('on status click')
  //   if (isResizing.value) return
  //   toggleResize(!resizable)
  // }
  // const toggleResize = (canResize) => {
  //   resizable = canResize
  //   // statusStyle.zIndex = canResize ? 10 : 1
  //   canResize ? subscribeKeyDown() : unsubscribeKeyDown()
  // }

  const onDblclick = () => {
    const width = data.width / 2
    const height = data.height / 2

    data.width = width
    data.height = height
    updatePosData()

    imgStyle.width = width
    imgStyle.height = height
    portPositions.value = computePorts()
  }

  useViewEffect(() => {
    if (!data.height || !data.width) {
      // status 一开始没有宽高，直接使用图片的原始宽高
      const proto = document.getElementById(protoId(data.id))
      proto.onload = (e) => {
        data.height = e.target.height
        data.width = e.target.width
        updatePosData()
        console.log('proto size', proto, data.height, data.width)
      }
    }

    shortcut.bind('Shift', SCOPE, () => {
      keepRatio = false
    })
    const restore = (e) => {
      if (e.key === 'Shift') keepRatio = true
    }
    document.addEventListener('keyup', restore)

    return () => {
      document.removeEventListener('keyup', restore)
    }
  })

  // TODO: 目前 status 只有最上层的支持拖动，pin 却没有这个限制，后续保持一致？
  const draggable = data.id === topStatus.value.id && isDraggable.value
  let cursor = draggable ? 'grab' : 'default'
  if (startSubscribePin) cursor = 'crosshair'
  const statusStyle = reactive({ left: data.x * scale, top: data.y * scale, cursor })
  const imgStyle = reactive({ width: data.width, height: data.height })
  const src = designMode ? data.designPreviewUrl : data.proto

  return (
    <status
      inline
      inline-position-absolute
      key={data.id}
      id={data.id}
      style={statusStyle}
      onClick={onClick}
      onDblclick={onDblclick}
      // CAUTION: 光处理 draggable 不够
      draggable={draggable ? 'true' : 'false'}
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
    >
      <img id={protoId(data.id)} draggable="false" onDragStart={onImgDragStart} style={imgStyle} onDrop={onImgDrop} src={src} />

      {/* {() => status.proto ? ports.map(x =>
          <port block block-position-absolute block-width-8px block-height-8px style={{ ...portStyle, ...x }} />)
          : null
        } */}
      {() => data.pins ? data.pins.map((x) => {
        const pin = pinMap[x.id]
        if (!pin) return null

        const isMarkupOrDraft = !pin.action?.id
        // 是否只展示特定行动点由外部控制（actionId)
        const isValidateAction = pin.action?.useCase?.id === caseId && (!actionId || actionId === pin.action?.id)
        const inCase = caseId > -1
        return (isMarkupOrDraft || isValidateAction)
          ? <Pin
            key={x.id}
            draggable={pinDraggable}
            isStatusDraggable={isDraggable}
            data={pin}
            inCase={inCase}
            onClick={onPinClick}
            scale={scale}
            contentId={contentId}
            selected={selectedPin.value?.id === x.id}
            isMarkupVisible={isMarkupVisible}
          />
          : null
      }) : null}

      {() => portPositions.value.map((x, i) => <port
        key={i}
        block
        block-position-absolute
        block-box-sizing-border-box
        style={{ ...x, display: topStatus.value?.id === data.id && resizable && !isResizing.value ? 'block' : 'none' }}
        onMouseDown={onResizeStart(x)}
      />)}
    </status>
  )
}

StatusLayer.Style = (frag) => {
  const ele = frag.root.elements
  ele.status.style(({ scale }) => {
    return {
      fontSize: 0,
      transform: `scale(${scale})`,
      transformOrigin: 'top left'
    }
  })
  ele.port.style({
    backgroundColor: '#fff',
    borderRadius: PORT_RADIUS * 2,
    width: PORT_RADIUS * 2,
    height: PORT_RADIUS * 2,
    border: '1px solid #666'
  })
}

export default createComponent(StatusLayer)

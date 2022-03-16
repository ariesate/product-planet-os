/* eslint-disable multiline-ternary */
/** @jsx createElement */
import { PageStatus } from '@/models'
import { createElement, createComponent, atom, reactive, useViewEffect } from 'axii'
import { contextmenu } from 'axii-components'
import ContextMenu from '@/components/ContextMenu'
import Pin from './Pin'

const PORT_RADIUS = 6
const DEFAULT_PROTO_SIZE = 800
const statusId = id => `status-${id}`
const protoId = id => `proto-${id}`

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
    // console.log('dragPosition', e, left, top, bias)
    const target = e.target.parentNode
    const x = e.clientX - left - bias.x
    const y = e.clientY - top - bias.y
    target.style.left = `${x}px`
    target.style.top = `${y}px`
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

  // CAUTION: onDragOver 和 onDragEnter 这两个必须要 preventDefault 才能保证 onDrop 触发
  const onDragOver = (e) => {
    e.preventDefault()
  }

  // CAUTION: 在 onDragEnd 里的位置信息是相对于 img，不符合需求
  const onDragEnd = (e) => {
    console.log('onDragEnd', e)
    // updatePosition(e)
    e.preventDefault()
  }

  const onDrag = (e) => {
    dragPosition(e)
  }

  // CAUTION 拖拽的对象是 img，drop 的对象是 status，所以在 onDrop 里获取到的位置信息才是我们需要的
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

      if (!ev.shiftKey) {
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

      // CAUTION: 这里不能改变 statusStyle 和 imgStyle，因为变化太快太频繁，而 statusStyle/imgStyle 都会引起组件刷新
      const statusNode = document.getElementById(statusId(data.id))
      const protoNode = document.getElementById(protoId(data.id))
      statusNode.style.left = `${x * scale}px`
      statusNode.style.top = `${y * scale}px`
      protoNode.style.width = `${width}px`
      protoNode.style.height = `${height}px`

      document.onmouseup = () => {
        // 重置状态
        document.onmousemove = null
        document.onmouseup = null
        isDraggable.value = !caseId

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

  const scaleSize = (calc) => () => {
    const width = calc(data.width)
    const height = calc(data.height)

    data.width = width
    data.height = height
    updatePosData()

    if (width && height) {
      imgStyle.width = width
      imgStyle.height = height
      portPositions.value = computePorts()
    } else {
      // 重置尺寸需要刷新，不然继续改变尺寸会出问题
      window.location.reload()
    }
    contextmenu.close()
  }

  const onContextMenu = (e) => {
    e.preventDefault()
    contextmenu.open(
      <ContextMenu
        options={[
          {
            title: '缩小一半',
            onClick: scaleSize(x => x / 2)
          },
          {
            title: '放大一倍',
            onClick: scaleSize(x => x * 2)
          },
          {
            title: '重置尺寸',
            onClick: scaleSize(() => null)
          }
        ]}
      />,
      {
        left: e.pageX,
        top: e.pageY
      }
    )
  }

  useViewEffect(() => {
    console.log(!data.height || !data.width)
    if (!data.height || !data.width) {
      // status 一开始没有宽高，直接使用图片的原始宽高
      const proto = document.getElementById(protoId(data.id))
      proto.onload = (e) => {
        // DEFAULT_PROTO_SIZE 是个兜底，为了应对出 bug 的时候图片被缩到 0，用户就操作不了，有个默认值虽然比例会不对，但至少可以补救
        data.height = e.target.height || DEFAULT_PROTO_SIZE
        data.width = e.target.width || DEFAULT_PROTO_SIZE
        updatePosData()
        console.log('proto size', proto, data.height, data.width)
      }
    }
  })

  // TODO: 目前 status 只有最上层的支持拖动，pin 却没有这个限制，后续保持一致？
  const draggable = data.id === topStatus.value.id && isDraggable.value
  let cursor = draggable ? 'grab' : 'default'
  if (startSubscribePin) cursor = 'crosshair'
  const statusStyle = { left: data.x * scale, top: data.y * scale, cursor }
  const imgStyle = reactive({ width: data.width, height: data.height })
  const src = designMode ? data.designPreviewUrl : data.proto

  return (
    <status
      inline
      inline-position-absolute
      key={data.id}
      id={statusId(data.id)}
      style={statusStyle}
      onClick={onClick}
      onContextMenu={onContextMenu}
      // onDblclick={onDblclick}
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
        return (isMarkupOrDraft || isValidateAction)
          ? <Pin
            key={x.id}
            draggable={pinDraggable}
            isStatusDraggable={isDraggable}
            data={pin}
            scale={scale}
            contentId={contentId}
            selected={selectedPin.value?.id === x.id}
            isMarkupVisible={isMarkupVisible}
            onClick={onPinClick}
            onBlur={() => { selectedPin.value = null }}
          />
          : null
      }) : null}

      {() => (isDraggable.value ? portPositions.value : []).map((x, i) => <port
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

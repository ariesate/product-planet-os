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

  // CAUTION: onDragOver ??? onDragEnter ?????????????????? preventDefault ???????????? onDrop ??????
  const onDragOver = (e) => {
    e.preventDefault()
  }

  // CAUTION: ??? onDragEnd ?????????????????????????????? img??????????????????
  const onDragEnd = (e) => {
    console.log('onDragEnd', e)
    // updatePosition(e)
    e.preventDefault()
  }

  const onDrag = (e) => {
    dragPosition(e)
  }

  // CAUTION ?????????????????? img???drop ???????????? status???????????? onDrop ????????????????????????????????????????????????
  const onDrop = (e) => {
    console.log('onDrop', e)
    updatePosition(e)
    e.preventDefault()
  }

  /// Mark: Resize
  const isResizing = atom(false)

  // ???????????? computed?????? data ???????????????????????????????????????????????? atom
  const computePorts = () => [
    // ??????
    { left: -PORT_RADIUS, bottom: -PORT_RADIUS, cursor: 'nesw-resize' },
    // ??????
    { left: -PORT_RADIUS, top: data.height / 2 - PORT_RADIUS, cursor: 'ew-resize' },
    // ??????
    { left: -PORT_RADIUS, top: -PORT_RADIUS, cursor: 'nwse-resize' },
    // ??????
    { left: data.width / 2 - PORT_RADIUS, top: -PORT_RADIUS, cursor: 'ns-resize' },
    // ??????
    { right: -PORT_RADIUS, top: -PORT_RADIUS, cursor: 'nesw-resize' },
    // ??????
    { right: -PORT_RADIUS, top: data.height / 2 - PORT_RADIUS, cursor: 'ew-resize' },
    // ??????
    { right: -PORT_RADIUS, bottom: -PORT_RADIUS, cursor: 'nwse-resize' },
    // ??????
    { right: data.width / 2 - PORT_RADIUS, bottom: -PORT_RADIUS, cursor: 'ns-resize' }
  ]
  const portPositions = atom(computePorts())

  const onResizeStart = (port) => (e) => {
    if (!isDraggable.value) return
    // ???????????????port ???????????????????????????????????????
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
        // ??????????????????
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

        // ????????????????????????????????????y ???????????????

        // ?????????????????????????????????
        if (top === -PORT_RADIUS) {
          y += startH - height
        }

        // ?????????????????????????????????
        if (top !== -PORT_RADIUS && bottom !== -PORT_RADIUS) {
          y += (startH - height) / 2
        }

        // ????????????????????????????????????????????? height ??????????????????????????? width ?????????
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
        // ?????? shfit ????????????
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

      // CAUTION: ?????????????????? statusStyle ??? imgStyle???????????????????????????????????? statusStyle/imgStyle ????????????????????????
      const statusNode = document.getElementById(statusId(data.id))
      const protoNode = document.getElementById(protoId(data.id))
      statusNode.style.left = `${x * scale}px`
      statusNode.style.top = `${y * scale}px`
      protoNode.style.width = `${width}px`
      protoNode.style.height = `${height}px`

      document.onmouseup = () => {
        // ????????????
        document.onmousemove = null
        document.onmouseup = null
        isDraggable.value = !caseId

        // ????????????
        data.x = x
        data.y = y
        data.width = width
        data.height = height
        updatePosData()
        portPositions.value = computePorts()

        // ??? onClick ????????????????????????
        // setTimeout(() => {
        isResizing.value = false
        // })
      }
    }
  }

  const scaleSize = (calc) => () => {
    let width = calc(data.width)
    let height = calc(data.height)
    imgStyle.width = width
    imgStyle.height = height
    // ????????????????????????????????????????????????????????????
    const proto = document.getElementById(protoId(data.id))
    width = width || proto.width
    height = height || proto.height

    data.width = width
    data.height = height
    updatePosData()
    portPositions.value = computePorts()

    contextmenu.close()
  }

  const onContextMenu = (e) => {
    e.preventDefault()
    contextmenu.open(
      <ContextMenu
        options={[
          {
            title: '????????????',
            onClick: scaleSize(x => x / 2)
          },
          {
            title: '????????????',
            onClick: scaleSize(x => x * 2)
          },
          {
            title: '????????????',
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
      // status ?????????????????????????????????????????????????????????
      const proto = document.getElementById(protoId(data.id))
      proto.onload = (e) => {
        // DEFAULT_PROTO_SIZE ?????????????????????????????? bug ???????????????????????? 0???????????????????????????????????????????????????????????????????????????????????????
        data.height = e.target.height || DEFAULT_PROTO_SIZE
        data.width = e.target.width || DEFAULT_PROTO_SIZE
        updatePosData()
        console.log('proto size', proto, data.height, data.width)
      }
    }
  })

  // TODO: ?????? status ?????????????????????????????????pin ?????????????????????????????????????????????
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
      // CAUTION: ????????? draggable ??????
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
        // ????????????????????????????????????????????????actionId)
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

/** @jsx createElement */
import { createElement, createComponent } from 'axii'
import Pin from './Pin'

// const PORT_RADIUS = 4

const StatusLayer = ({
  caseId,
  actionId,
  statusQueue,
  currentStatus,
  statusMap,
  onPinClick,
  pinMap,
  selectedPin,
  contentId,
  isDraggable,
  isPinDraggable,
  isMarkupVisible,
  designMode,
  startSubscribePin,
  scale
}) => {
  console.log('StatusLayer status queue: ', statusQueue)

  let bias = {}
  const dragPosition = (e) => {
    if (e.clientX < 0 || e.clientY < 0) return
    const content = document.getElementById(contentId)
    const { top, left } = content.getBoundingClientRect()
    console.log('dragPosition', e, left, top, bias)
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
    const status = statusMap.value[target.id]
    const x = _x/scale
    const y = _y/scale
    status.x = x
    status.y = y
    PageStatus.update(status.id, { x, y })
  }

  const onImgDragStart = (status) => (e) => {
    console.log('onImgStart', e, status.id !== currentStatus.value.id, isDraggable.value)
    if (status.id !== currentStatus.value.id || !isDraggable.value) {
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
    if (target.id === contentId) {
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

  // TODO: 支持拖动缩放？
  // const ports = [
  //   { left: -PORT_RADIUS, top: -PORT_RADIUS },
  //   { right: -PORT_RADIUS, top: -PORT_RADIUS },
  //   { right: -PORT_RADIUS, bottom: 0 },
  //   { left: -PORT_RADIUS, bottom: 0 }
  // ]

  // const portStyle = {
  //   border: '2px solid #999',
  //   borderRadius: PORT_RADIUS * 2
  // }

  console.log('render queue', statusQueue)
  return statusQueue.map((status) => {
    if (!status?.id) return null
    // TODO: 目前 status 只有最上层的支持拖动，pin 却没有这个限制，后续保持一致？
    const draggable = status.id === currentStatus.value.id && isDraggable.value
    let cursor = draggable ? 'grab' : 'default'
    if (startSubscribePin) cursor = 'crosshair'
    const statusStyle = { left: status.x * scale, top: status.y * scale, cursor }
    const src = designMode ? status.designPreviewUrl : status.proto
    // const imgStyle = reactive({ width: '50%' })
    // const resize = () => {
    //   console.log('resize', status)
    //   imgStyle.width = imgStyle.width ? null : '100%'
    // }
    return (
      <status
        inline
        inline-position-absolute
        key={status.id}
        id={status.id}
        style={statusStyle}
        // CAUTION: 光处理 draggable 不够
        draggable={draggable ? 'true' : 'false'}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDrop={onDrop}
      >
        <img draggable="false" onDragStart={onImgDragStart(status)} onDrop={onImgDrop} src={src} />
        {/* {() => status.proto ? ports.map(x =>
          <port block block-position-absolute block-width-8px block-height-8px style={{ ...portStyle, ...x }} />)
          : null
        } */}
        {() => status.pins ? status.pins.map((x, i) => {
          const pin = pinMap[x.id]
          if (!pin) return null

          const isMarkupOrDraft = !pin.action?.id
          // 是否只展示特定行动点由外部控制（actionId)
          const isValidateAction = pin.action?.useCase?.id === caseId && (!actionId || actionId === pin.action?.id)
          const inCase = caseId > -1
          return (isMarkupOrDraft || isValidateAction) ?
            <Pin
              key={x.id}
              draggable={isPinDraggable}
              isStatusDraggable={isDraggable}
              data={pin}
              inCase={inCase}
              onClick={onPinClick}
              scale={scale}
              contentId={contentId}
              selected={selectedPin.value?.id === x.id}
              isMarkupVisible={isMarkupVisible}
            /> :
            null
        }) : null}
      </status>
    )
  })
}

StatusLayer.Style = (frag) => {
  const ele = frag.root.elements
  ele.status.style(({ scale }) => {
    return {
      transform: `scale(${scale})`,
      transformOrigin: 'top left'
    }
  })
}

export default createComponent(StatusLayer)
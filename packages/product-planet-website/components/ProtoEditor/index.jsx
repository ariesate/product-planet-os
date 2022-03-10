import { createElement, atom, computed, atomComputed, useViewEffect, createComponent, reactive, watch } from 'axii'
import { Select, Button, Input, Checkbox, message } from 'axii-components'
import AddIcon from 'axii-icons/Add'
import LeftIcon from 'axii-icons/Left'
import { useVersion } from '@/layouts/VersionLayout'
import { Page, PagePin, Markup, Action, PageStatus, ProtoDraft } from '@/models'
import List from '@/components/List'
import Dialog from '@/components/Dialog'
import MarkupEditor, { EDITOR_ID } from './Markup'
import Status from './StatusLayer'
import { historyLocation } from '@/router'
import ProtoDraftEditor from '../ProtoDraftEditor/ProtoDraftEditor'
import StatusTree from './StatusTree'
import { base64ToFile } from '@/utils/util'
import shortcut from '@/tools/shortcut'

export const MASK_ID = 'pp-mask'
export const CONTENT_ID = 'pp-content'
export const SCOPE = 'proto'

const getScaleKey = (pageId) => `pp-scale-${pageId}`
const getModeKey = (pageId, statusId) => `pp-mode-${pageId}-${statusId}`

const isEleVisible = (ele) => {
  const { top, right, bottom, left } = ele.getBoundingClientRect()
  const w = window.innerWidth
  const h = window.innerHeight
  if (bottom < 0 || top > h) {
    // y 轴方向
    return false
  }
  if (right < 0 || left > w) {
    // x 轴方向
    return false
  }
  return true
}

const ProtoEditor = ({ ref, pageId, statusId, pinId, caseId, actionId, isActionEnable, onActionPinClick, onStatusSelect: _onStatusSelect, pinDraggable = true, draggable = true, editable = atom(true) }) => {
  console.log('[ProtoEditor/index] pageId, statusId, caseId, actionId: ', pageId, statusId.value, caseId, actionId)
  const version = useVersion()
  // TIP：这里会运行2次，第1次是undefined 第2次才有值，避免初始化layout的异常
  if (!version.value?.id) {
    return null
  }
  const goBack = () => historyLocation.goto(`/product/${version.value.product.id}/version/${version.value.id}/link`)

  const page = atom({})
  const allStatus = reactive([])
  // 用 reactive 的话赋值时会多次触发下游的 computed 计算，用 atom 可以只触发一次
  const statusMap = atom({})
  const currentStatus = atomComputed(() => {
    if (!Object.keys(statusMap.value).length) return {}
    const status = statusId.value

    return statusMap.value[status] || statusMap.value[page.value.baseStatus?.id] || page.value.baseStatus
  })

  const statusQueue = atomComputed(() => {
    const res = []
    const id = currentStatus.value?.id
    if (!id) return res
    let status = statusMap.value[id]
    while (status) {
      res.unshift(status)
      status = statusMap.value[status.prevId]
    }
    // TODO: status 变更的时候，会计算两次
    // console.log('compute status queue', status, statusMap, JSON.parse(JSON.stringify(res)))
    return res
  })

  const treeVisible = atom(false)

  const isStatusDraggable = atom(draggable)
  const isMarkupVisible = atom(false)

  /// Mark: 设计模式
  const designMode = atomComputed(() => {
    const cache = window.localStorage.getItem(getModeKey(pageId, statusId.value))
    const hasDesign = currentStatus.value?.designPreviewUrl
    return cache && hasDesign
  })
  const onModeChange = ({ value }) => {
    window.localStorage.setItem(getModeKey(pageId, statusId.value), value.value)
  }

  /// Mark: 缩放
  const scaleOptions = reactive([
    { id: 1.5, name: '150%' },
    { id: 1.25, name: '125%' },
    { id: 1, name: '100%' },
    { id: 0.75, name: '75%' },
    { id: 0.5, name: '50%' },
    { id: 0.45, name: '45%' },
    { id: 0.4, name: '40%' }
  ])
  const defaultScale = window.localStorage.getItem(getScaleKey(pageId))
  const onScaleChange = val => {
    window.localStorage.setItem(getScaleKey(pageId), val.id)
  }
  console.log('default scale', defaultScale)
  const scale = atom(defaultScale ? scaleOptions.find(x => x.id === +defaultScale) : scaleOptions[2])

  /// Mark: Fetch data
  const fetchPage = () => Page
    .findOne({
      fields: ['id', 'name', 'baseStatus'],
      where: { id: pageId, version: { id: version.value.id } }
    })
    .then(res => {
      page.value = res
    })

  const fetchStatus = () => PageStatus
    .find({
      fields: ['id', 'name', 'x', 'y', 'width', 'height', 'proto', 'prevId', 'pins', 'protoDraft', 'designPreviewUrl'],
      where: { page: pageId }
    })
    .then(res => {
      allStatus.splice(0, allStatus.length)
      const map = {}
      res.forEach(x => {
        // TODO: PageStatus 要加一个 design 字段，暂时用 page 上的调试下
        // if (x.id === page.value.baseStatus.id) {
        //   x.design = page.value.designPreviewUrl
        // }
        map[x.id] = x
        allStatus.push(x)
      })
      statusMap.value = map
    })

  const pinMap = reactive({})
  const markups = reactive([])
  const handlePins = (res) => {
    markups.splice(0, markups.length)
    const uniqueUtil = {}
    console.log('[handlePins] res: ', res)
    res.forEach(x => {
      pinMap[x.id] = x

      // markup 去重
      if (!x.markup?.id || uniqueUtil[x.markup.id]) return

      x.markup.pins = [x.id]
      markups.push(x.markup)
      uniqueUtil[x.markup.id] = true
    })
  }
  const fetchPins = () => PagePin
    .find({
      fields: {
        id: true,
        x: true,
        y: true,
        width: true,
        height: true,
        markup: true,
        pageStatus: true,
        action: {
          id: true,
          useCase: true
        }
      },
      where: { pageStatus: statusQueue.value.map(x => x.id) }
    })
    .then(handlePins)

  const fetchData = async () => {
    return Promise.all([fetchPage(), fetchStatus()])
      .then(fetchPins)
  }

  const maskVisible = atom(false)
  const updateStatusQueue = (url) => {
    const last = statusQueue.value.pop()
    last.proto = url
    // 上传的图片覆盖手绘原型稿
    if (last.protoDraft?.id) {
      ProtoDraft.remove(last.protoDraft?.id)
      last.protoDraft = null
    }
    statusQueue.value = [...statusQueue.value, last]
  }
  const updateProto = (status, file) => {
    if (!status.id) return
    const model = status.updateProto ? status : new PageStatus(status)
    return model.updateProto(`pageStatus/${page.value.name}-${status.name}-${status.id}.png`, file)
      .then(url => {
        maskVisible.value = false
        return url
      })
  }

  useViewEffect(() => {
    fetchData()
      .then(() => {
        if (!pinId) return
        const pin = pinMap[pinId.value]
        if (!pin) return
        selectPin(pin)
      })
  })

  /// Mark: Event Handler
  const subscribePaste = (status, hasPrev) => {
    const uploadMask = document.getElementById(MASK_ID)
    uploadMask.onpaste = (event) => {
      const items = event.clipboardData?.items
      if (!items?.length) return

      let file
      for (const item of items) {
        if (item.type.includes('image')) {
          file = item.getAsFile()
          break
        }
      }
      if (!file) return
      if (status.id) {
        updateProto(status, file)
          .then(updateStatusQueue)
      } else {
        page.value.addStatus(status)
          .then(status => {
            updateProto(status, file)
              .then((url) => {
                status.proto = url
                allStatus.push(status)
                statusMap.value = { ...statusMap.value, [status.id]: status }
                onStatusSelect(status.id)
                // 独立状态，重置标注
                if (!hasPrev) markups.splice(0, markups.length)
              })
          })
      }

      uploadMask.onpaste = null
    }
  }

  // 手绘原型
  const draftVisible = atom(false)
  const drawConfig = reactive({
    data: {},
    onSave: () => {},
    onCancel: () => { draftVisible.value = false }
  })
  const subscribeDraw = (status, hasPrev) => {
    drawConfig.data = { ...status }
    drawConfig.onSave = async (nodeList, imageUri) => {
      const needCreateStatus = !status.id
      const imgFile = base64ToFile(imageUri, `${status.name}.png`)
      if (needCreateStatus) {
        const res = await page.value.addStatus(status)
        Object.assign(status, res || {})
        // 独立状态，重置标注
        if (!hasPrev) markups.splice(0, markups.length)
      }
      const url = await updateProto(status, imgFile)
      // 保存or更新手绘结构化信息
      const draftId = status.protoDraft?.id
      if (draftId) {
        await ProtoDraft.update(draftId, { protoNodes: JSON.stringify(nodeList), imgSrc: url })
      } else {
        await ProtoDraft.create({ pageStatus: status.id, protoNodes: JSON.stringify(nodeList), imgSrc: url })
      }
      // 重新拉取数据
      await fetchData()
      onStatusSelect(status.id)
      draftVisible.value = false
    }
  }

  const startPin = () => {
    startSubscribePin.value = true
    isStatusDraggable.value = false
  }

  const endPin = () => {
    startSubscribePin.value = false
    isStatusDraggable.value = draggable
  }

  const subscribeShortcut = () => {
    // 浏览用例时禁用快捷键
    if (!editable.value) return

    shortcut.enter(SCOPE)

    // 在编辑标注的时候，禁用快捷键
    const prevent = e => e.target?.isContentEditable || e.target.nodeName === 'INPUT'

    const tryToSubscribePin = () => {
      if (!selectedPin.value) {
        subscribePin(caseId > -1)
      }
    }

    const tryToremovePin = () => {
      if (selectedPin.value) {
        removePin(selectedPin.value, true)
      }
    }

    shortcut.bind('r', SCOPE, tryToSubscribePin, prevent)
    shortcut.bind('Escape', SCOPE, unsubscribePin, prevent)
    shortcut.bind(['d', 'Backspace'], SCOPE, tryToremovePin, prevent)
  }

  // 提供给外部使用
  if (ref) {
    ref.current = {
      createPinAt ({ pageX = 100, pageY = 100 }) {
        const content = document.getElementById(CONTENT_ID)
        const bbox = content.getBoundingClientRect()
        const status = statusMap.value[currentStatus.value.id]
        // TIP：这里的x和y是pin相对于status的相对值
        createPin({
          x: pageX - status.x - bbox.x,
          y: pageY - status.y - bbox.y,
          width: 150,
          height: 150,
          pageStatus: currentStatus.value.id
        })
      }
    }
  }

  async function createPin (pin, e = {}) {
    const id = await PagePin.create({
      ...pin
    })
    const newPin = new PagePin({ id, ...pin })
    pinMap[id] = newPin
    fetchStatus()

    // if (e.shiftKey) return

    selectPin(newPin)
  }

  const startSubscribePin = atom(isActionEnable?.value)
  const subscribePin = (isAction) => {
    startPin()
    // const content = document.getElementById(CONTENT_ID)
    document.onmousedown = (e) => {
      console.log(e)
      // target 是 img
      const statusNode = e.target.parentNode
      // 没有在原型图中框选
      if (!statusNode.id) return

      const { top, left } = statusNode.getBoundingClientRect()
      const posX = e.clientX - left
      const posY = e.clientY - top
      const draft = document.createElement('draft')
      draft.style.position = 'absolute'
      draft.style.left = `${posX}px`
      draft.style.top = `${posY}px`
      draft.style.borderRadius = '4px'
      draft.style.cursor = 'pointer'
      draft.draggable = 'false'
      draft.ondragstart = e => e.preventDefault()
      if (isAction) {
        draft.style.backgroundColor = 'rgba(24,144,255,.6)'
      } else {
        draft.style.backgroundColor = 'rgba(239,175,65,.6)'
      }
      statusNode.appendChild(draft)
      document.onmousemove = (ev) => {
        const x = Math.min(ev.clientX - left, posX)
        const y = Math.min(ev.clientY - top, posY)
        const width = Math.abs(posX - ev.clientX + left)
        const height = Math.abs(posY - ev.clientY + top)
        draft.style.left = `${x}px`
        draft.style.top = `${y}px`
        draft.style.width = `${width}px`
        draft.style.height = `${height}px`
        document.onmouseup = (e) => {
          statusNode.style.cursor = null
          unsubscribePin()

          statusNode.removeChild(draft)
          const pin = { x, y, width, height, pageStatus: +statusNode.id }

          createPin(pin, e)
        }
      }
    }
  }

  const unsubscribePin = () => {
    console.log('unsubscribe pin')
    endPin()
    document.onmousedown = null
    document.onmousemove = null
    document.onmouseup = null
  }

  const toggleSubscribePin = () => {
    startSubscribePin.value ? unsubscribePin() : subscribePin()
  }

  useViewEffect(() => {
    subscribeShortcut()
    // TIP：如果初始化就是true，则立即监听线框
    watch(() => isActionEnable?.value, () => {
      if (isActionEnable?.value) {
        subscribePin(true)
      } else {
        unsubscribePin()
      }
    }, true)
    return () => {
      unsubscribePin()
      shortcut.leave(SCOPE)
    }
  })

  const isStatusResizable = atom()
  const onStatusFocus = (data) => (e) => {
    if (data.id !== currentStatus.value.id || !editable.value) return
    isStatusResizable.value = !isStatusResizable.value
    unselectPin()
    e.stopPropagation()
  }

  const selectedPin = atom()
  const selectPin = (data) => {
    isStatusDraggable.value = false
    isStatusResizable.value = false

    if (!data.status) {
      const status = statusMap.value[data.pageStatus]
      data.status = status
    }
    selectedPin.value = data

    const handleAction = () => {
      isMarkupVisible.value = false
      onActionPinClick(data, status, allStatus, () => removePin(data, true))
    }
    const handlerMarkup = () => {
      isMarkupVisible.value = true
      setTimeout(() => {
        const editor = document.getElementById(EDITOR_ID)
        if (!isEleVisible(editor)) editor.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
      })
    }
    if (data.action?.id) {
      // 编辑行动点
      handleAction()
    } else if (data.markup?.id) {
      // 编辑标注
      handlerMarkup()
    } else if (caseId > -1) {
      // 添加行动点
      handleAction()
    } else {
      // 添加标注
      handlerMarkup()
    }
  }

  const onPinClick = data => {
    const pin = pinMap[data.id]
    selectPin(pin)
  }

  const removePin = (x, forceRefetch) => {
    const pin = x || selectedPin.value
    if (!pin) return

    return PagePin.remove(pin.id)
      .then(() => {
        unselectPin()
        // TODO: 之后要考虑 n:1，暂时只考虑 1:1 的情况
        const markId = pin.markup?.id
        if (markId) {
          const i = markups.findIndex(x => x.id === markId)
          markups.splice(i, 1)
          return Markup.remove(markId)
        }

        const actionId = pin.action?.id
        if (actionId) {
          return Action.remove(actionId)
        }
      })
      .then(() => {
        if (forceRefetch) fetchStatus()
      })
  }

  const unselectPin = () => {
    isStatusDraggable.value = draggable
    selectedPin.value = null
    isMarkupVisible.value = false
  }

  const saveMarkup = (data, rawPin, needClose) => {
    delete data.pins
    const markup = new Markup(data)
    markup
      .save()
      .then(() => {
        // TODO: 按理 ERStorage 应该自动做掉，但出了点 bug，先完成功能，后续重构
        if (!data.id) {
          const pin = rawPin.addRelation ? rawPin : new PagePin(rawPin)
          pin.addRelation('markup', markup.id)
        }
        if (needClose) unselectPin()
      })
      .then(fetchPins)
  }

  const dialogVisible = atom(false)
  const statusName = atom('')
  const needPrev = atom(false)
  const addStatus = () => {
    dialogVisible.value = true
  }
  const updateStatus = (status, hasPrev) => {
    dialogVisible.value = false
    maskVisible.value = true
    let newStatus = status
    if (hasPrev) {
      newStatus = { name: status.name }
      // 如果是从标注创建，就跟当前标注对应的 status 关联，否则跟当前 status 关联
      const prevId = selectedPin.value ? selectedPin.value.pageStatus : currentStatus.value.id
      newStatus.prevId = prevId
      if (selectedPin.value?.id) {
        const x = selectedPin.value.status.x + selectedPin.value.x
        const y = selectedPin.value.status.y + selectedPin.value.y
        newStatus.x = x
        newStatus.y = y
      }
    }
    subscribeDraw(newStatus, hasPrev)
    subscribePaste(newStatus, hasPrev)
  }

  const removeStatus = (data) => {
    // TODO: 写个后端接口
    const status = data.destroy ? data : new PageStatus(data)
    status.destroy()
      .then((res) => {
        if (!res || !status.pins?.length) return Promise.resolve()
        return Promise.all(status.pins?.map(x => {
          const pin = pinMap[x.id]
          return removePin(pin, false)
        }))
      })
      .then(fetchStatus)
      .then(() => {
        onStatusSelect(data.prevId || page.value.baseStatus.id)
      })
  }

  const onStatusSelect = (status) => {
    unselectPin()
    _onStatusSelect(status)
  }

  const renderListItem = (markup) => {
    const pin = pinMap[markup.pins[0]]
    const onClick = (e) => {
      e.stopPropagation()
      selectPin(pin)
    }
    const focus = atomComputed(() => {
      return selectedPin.value?.id === pin.id
    })
    const style = {
      borderBottom: '1px solid #999',
      cursor: 'pointer'
    }
    return <List.Item border focus={focus} block block-padding-16px block-height-32px block-line-height-32px style={style} onClick={onClick}>
      {markup.name}
    </List.Item>
  }

  function onContentClick () {
    isMarkupVisible.value = false
    isStatusResizable.value = null
    unselectPin()
  }

  return <container block block-height="100%" block-width="100%" >
    <pageHeader
      block
      block-position-fixed
      block-width="100%"
      block-height-64px
      block-padding-left-16px
      block-padding-right-16px
      block-box-sizing-border-box
      flex-display
      flex-align-items-center
      flex-justify-content-space-between
    >
      <left block flex-display flex-align-items-center>
        <back block block-box-sizing-border-box block-height-32px block-width-32px block-padding-top-8px onClick={goBack} >
          <LeftIcon />
        </back>
        <name block block-margin-right-8px>{() => page.value.name} / {() => currentStatus.value.name}</name>

        <Button layout:block-margin-right-24px onClick={() => { treeVisible.value = true }}>切换状态</Button>
        {/* <Select
          layout:block-margin-right-24px
          value={currentStatus}
          renderValue={x => x.value?.name}
          options={allStatus}
          onChange={val => {
            if (currentStatus.value.id === val.id) return
            console.log('update status', val.id)
            onStatusSelect(val.id)
            fetchPins()
          }}
        /> */}
        <Button layout:block-margin-right-24px onClick={addStatus}>添加状态</Button>
        <Button layout:block-margin-right-24px onClick={() => removeStatus(currentStatus.value)}>删除状态</Button>
        <Button layout:block-margin-right-24px onClick={() => updateStatus(currentStatus.value, false)}>更新原型</Button>
        <Button layout:block-margin-right-24px onClick={toggleSubscribePin}>{
          () => startSubscribePin.value ? '添加中，请在下方页面进行框选' : '添加标注(R)'
        }</Button>
        {/* <Button layout:block-margin-right-24px onClick={() => isPinEditable.value = }>调整标注</Button> */}
        {() => selectedPin.value ? <Button layout:block-margin-right-24px onClick={() => removePin(null, true)}>删除标注</Button> : null}
      </left>

      <right block flex-display flex-align-items-center>
        <div block block-margin-right-24px flex-display flex-align-items-center>
          设计稿模式：{() => <Checkbox disabled={!currentStatus.value?.designPreviewUrl} onChange={onModeChange} value={designMode} />}
        </div>
        <Select
          value={scale}
          options={scaleOptions}
          onChange={onScaleChange}
        />
      </right>
    </pageHeader>
    <markupList
      block block-position-fixed block-width-200px block-height="100%" block-margin-right-24px
      onClick={onContentClick} >
      <List
        header="标注列表"
        extra={<AddIcon style={{ cursor: 'pointer' }} onClick={(e) => {
          e.stopPropagation()
          subscribePin(false)
        }} />}
        dataSource={atom(markups)}
        renderItem={renderListItem}
      />
    </markupList>
    <content id={CONTENT_ID} block block-position-absolute onClick={onContentClick} >
      {() => {
        if (designMode.value && currentStatus.value.designPreviewUrl) {
          return <img src={currentStatus.value.designPreviewUrl} style={{ maxWidth: '100%' }}/>
        }
        const queue = statusQueue.value
        if (!queue.length) return null

        const noProto = queue.length === 1 && !queue[0].proto
        console.log('noProto', noProto)

        if (noProto) {
          return <empty block block-height="100%" block-width="100%" flex-display flex-align-items-center flex-justify-content-center>
            请先 <a onClick={() => updateStatus(currentStatus.value, false)}>添加原型</a>
          </empty>
        }

        return queue.map((status) => <Status
          key={status.proto}
          data={status}
          topStatus={currentStatus}
          resizable={isStatusResizable.value}
          onClick={onStatusFocus(status)}
          isDraggable={isStatusDraggable}
          pinDraggable={pinDraggable}
          caseId={caseId}
          actionId={actionId}
          onPinClick={onPinClick}
          selectedPin={selectedPin}
          pinMap={pinMap}
          scale={scale.value.id}
          contentId={CONTENT_ID}
          isMarkupVisible={isMarkupVisible}
          designMode={designMode.value}
          startSubscribePin={startSubscribePin.value}
        />)
      }}
      <MarkupEditor
        isVisible={isMarkupVisible}
        scale={scale}
        pin={selectedPin}
        defaultName={computed(() => `标注${markups.length}`)}
        onSave={saveMarkup}
        onCancel={unselectPin}
        onStatusAdd={(name) => {
          const duplicated = allStatus.some(x => x.name === name)
          if (duplicated) {
            message.error('已存在同名状态，请更换状态名')
            return false
          } else {
            updateStatus({ name }, true)
            return true
          }
        }}
        onStatusSelect={(name) => {
          const status = allStatus.find(x => x.name === name)
          if (status) {
            onStatusSelect(status.id)
          } else {
            message.error(`${name}不存在，请新增状态`)
            updateStatus({ name }, true)
          }
        }}
      />
      <protoMask
        id={MASK_ID}
        block
        block-width="100%"
        block-height="100%"
        block-position-fixed
        flex-display
        flex-justify-content-center
        flex-direction-column
        flex-align-items-center
        block-visible-hidden={computed(() => !maskVisible.value)}
        onClick={e => e.stopPropagation()}
        onDblclick={() => {
          maskVisible.value = false
        }}
      >
        <span>Ctrl + V 上传原型图
          <span>，或<a onClick={() => { maskVisible.value = false; draftVisible.value = true }}>手绘原型图</a></span>
        </span>
        <span>双击取消</span>
      </protoMask>
      {() => draftVisible.value
        ? <protoMask
          block
          block-width="100%"
          block-height="100%"
          block-position-fixed
          block-padding-40px
          style={{ boxSizing: 'border-box' }}
          // block-visible-hidden={computed(() => !draftVisible.value)}
          flex-display
          flex-justify-content-center
          flex-align-items-center
        >
          <ProtoDraftEditor config={drawConfig} />
        </protoMask>
        : null}
    </content>
    {() => treeVisible.value
      ? < StatusTree
        visible={treeVisible}
        statusMap={statusMap.value}
        onStatusSelect={onStatusSelect}
      />
      : null}
    <Dialog visible={dialogVisible} title="添加状态" onSure={() => updateStatus({ name: statusName.value }, needPrev.value)} onCancel={() => (dialogVisible.value = false)}>
      <div>状态名: <Input value={statusName} /></div>
      <div block block-margin-top-16px flex-display flex-align-items-center>是否关联当前状态<Checkbox value={needPrev} /></div>
    </Dialog>
 </container>
}

ProtoEditor.Style = frag => {
  const ele = frag.root.elements

  ele.pageHeader.style({
    backgroundColor: 'white',
    boxShadow: '0 1px 4px 0 rgb(0 21 41 / 12%)',
    zIndex: 3
  })

  ele.back.style({
    cursor: 'pointer'
  })

  ele.name.style({
    color: '#333',
    fontWeight: 'bold'
  })
  ele.pageBody.style({
  })
  ele.markupList.style({
    background: 'white',
    boxShadow: '2px 0 8px 0 rgb(29 35 41 / 5%)',
    top: 64,
    zIndex: 2
  })
  ele.content.style({
    background: '#999',
    // overflow: 'auto'
    left: 200,
    right: 0,
    top: 64,
    bottom: 0
  })
  ele.a.style({
    color: '#5491D5',
    cursor: 'pointer'
  })
  ele.protoMask.style({
    left: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,.2)',
    zIndex: 100,
    color: 'white',
    fontSize: 48
  })
  ele.editor.style({
    border: '2px solid #999'
  })
}

ProtoEditor.forwardRef = true

export default createComponent(ProtoEditor)

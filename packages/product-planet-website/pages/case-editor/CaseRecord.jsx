/** @jsx createElement */
import {
  useRef,
  createElement,
  createComponent,
  atom,
  useViewEffect,
  propTypes,
  reactive,
  computed,
  Fragment,
  watch,
  atomComputed
} from 'axii'
import ButtonNew from '../../components/Button.new'
import { useRequest } from 'axii-components'
import { Action } from '@/models/entities/action'
import { PagePin } from '@/models/entities/pagePin'
import ArrowRight from 'axii-icons/ArrowRight'
import cloneDeep from 'lodash/cloneDeep'
import useHover from '@/hooks/useHover'
import CloseOne from 'axii-icons/CloseOne'
import Move from 'axii-icons/Move'
import Play from 'axii-icons/Play'
import PauseOne from 'axii-icons/PauseOne'
import debounce from 'lodash/debounce'
import ArrowLeft from 'axii-icons/ArrowLeft'
import Left from 'axii-icons/Left'
import Right from 'axii-icons/Right'
import styles from './style.module.less'
import last from '@/tools/last'
import ProtoEditor from '@/components/ProtoEditor'
import useMenu from './useMenu'
import { PageStatus } from '@/models/entities/pageStatus'
import useInterval from './useInterval'
import useCallbackByRouter from './useCallbackByRouter'
import { useVersion } from '@/layouts/VersionLayout'
import { historyLocation } from '@/router'
import pick from 'lodash/pick'
import useContextMenu, { ACTION_TYPE_CLICK, ACTION_TYPE_HOVER, ACTION_TYPE_BASE, actionTypeMap } from './useContextMenu'

window.PageStatus = PageStatus
window.PagePin = PagePin
window.Action = Action

const ProtoEditor2 = ProtoEditor.extend(frag => {
  const ele = frag.root.elements
  ele.markupList.style(({ editable }) => ({
    display: editable.value ? 'block' : 'none',
    top: 0
  }))
  ele.pageHeader.style(() => ({
    display: 'none',
    top: 0
  }))
  ele.content.style(({ editable }) => ({
    top: 0,
    left: editable.value ? 200 : 0
  }))
  ele.container.style(({
    padding: 0
  }))
  ele.pageBody.style(() => ({
    marginTop: 0
  }))
})
// MOCK proto
function InnerProtoRC ({
  ref,
  actionType,
  timeline,
  caseId,
  currentDisplay,
  editable,
  parentRect,
  onNewState,
  onNewPage,
  gotoNext,
  actionPinEnable
}) {
  const innerProtoRef = useRef(null)
  const innerProtoRect = reactive({ width: 0, height: 0 })
  const currentPin = atom(null)
  const removePinRef = useRef(() => {})

  // 线框完成后的菜单选项
  const statuses2 = atom([])
  const menu = useMenu({
    disable: computed(() => !editable.value),
    statuses: statuses2,
    currentPin: currentPin,
    onNewState (status) {
      const pin = status.pin
      delete status.pin
      onNewState(status, pin)
    },
    onNewPage () {
      onNewPage(currentPin.value)
      currentPin.value = null
    },
    onRemove () {
      removePinRef.current()
      removePinRef.current = () => {}
      // TIP：通过切换开关，激活Proto的标注
      // TIP2：跟Proto的标注保持一致，每次只添加一个
      // actionPinEnable.value = true
    }
  })
  // TODO: 先计算，如果被fixed代替
  const innerProtoStyle = atomComputed(() => {
    if (innerProtoRect.width && innerProtoRect.height && parentRect.width && parentRect.height) {
      console.log('parentRect: ', parentRect)
      console.log('innerProtoRect: ', innerProtoRect)
      const widthScale = parentRect.width / innerProtoRect.width
      const heightScale = parentRect.height / innerProtoRect.height
      const scale = Math.max(widthScale, heightScale)
      const finalScale = Math.min(1, scale)

      const left = scale < 1 ? (parentRect.width - scale * innerProtoRect.width) / 2 : 0
      const top = scale < 1 ? (parentRect.height - scale * innerProtoRect.height) / 2 : 0

      return {
        transform: `scale(${finalScale}), translate(-50%, -50%)`,
        position: 'relative',
        left,
        top
      }
    }
    return {}
  })
  // TODO：特殊case，必须一开始是false然后是true，才能引起线框动作
  useViewEffect(() => {
    // TODO: 设置延时，开启原型的标注功能
    // setTimeout(() => {
    //   actionPinEnable.value = editable.value
    // }, 500)
    // watch(() => editable.value, () => {
    //   actionPinEnable.value = editable.value
    // })
    function clickOnDoc () {
      menu.visible.value = false
    }
    document.addEventListener('click', clickOnDoc)
    return () => {
      document.removeEventListener('click', clickOnDoc)
      console.log('[InnerProto] unmount')
    }
  })

  const protoEditorRef = useRef(null)
  if (ref) {
    ref.current = {
      createPinAt (...rest) {
        return protoEditorRef.current.createPinAt(...rest)
      }
    }
  }

  function onPinFinish (newPin, status, statusSet, removePinCb) {
    console.log('[CaseRecord] onPinFinish.newPin: ', newPin)
    if (!editable.value) {
      // TIP：播放态下，相当于页面上操作跳
      gotoNext()
      return
    }
    const position = {
      x: newPin.x + newPin.width + (status.x || 0) - 20,
      y: newPin.y + (status.y || 0)
    }

    Object.assign(menu.position, position)
    // TIP：不能切换到相同的状态，且 无sid的情况是使用的默认状态
    statuses2.value = statusSet.filter((s, i) => {
      if (!currentDisplay.value.statusId && i === 0) {
        return false
      }
      return currentDisplay.value.statusId !== s.id
    }).map(s => Object.assign({ pin: newPin }, s))
    // TIP：触发切换状态的提醒
    if (statuses2.value.length === 0) {
      statuses2.value = [{ name: '此页面无其它状态' }]
    }

    // TIP：拖动结束后，关闭动作
    actionPinEnable.value = false
    // TODO: 此处应该直接驱动UI，而不是通过中间变量去间接索引
    currentPin.value = newPin
    removePinRef.current = removePinCb
    menu.visible.value = true
  }

  const currentProto = computed(() => {
    return pick(currentDisplay.value, ['pageId', 'statusId', 'nextActionId'])
  })
  const key = atomComputed(() => {
    return `${currentProto.pageId}-${currentProto.statusId}-${currentProto.nextActionId}-${editable.value}`
  })

  // TIP：预加载后续原型，提升用例流畅度
  // const nextProto = computed(() => {
  //   return {
  //     pageId: currentDisplay.value.nextPageId,
  //     statusId: currentDisplay.value.nextStatusId,
  //     actionId: currentDisplay.value.nextActionId
  //   }
  // })
  // const nextKey = atomComputed(() => {
  //   return `next-${nextProto.pageId}-${nextProto.statusId}-${nextProto.actionId}`
  // })

  return (
    <innerProto ref={innerProtoRef}
      block block-height="100%" block-position="relative" style={innerProtoStyle}>
      {() => {
        console.log('[ProtoEditor2] key =', key.value)
        if (!currentProto.pageId) {
          return ''
        }
        return (
          <ProtoEditor2
            layout:id={key}
            ref={protoEditorRef}
            key={key.value}
            pinDraggable={editable.value}
            editable={editable}
            draggable={false}
            caseId={caseId}
            pageId={currentProto.pageId}
            actionId={currentProto.nextActionId}
            statusId={atom(currentProto.statusId)}
            isActionEnable={actionPinEnable}
            onActionPinClick={onPinFinish}
            onStatusSelect={() => {}}
          />
        )
      }}
      {/* {() => {
        if (!nextProto.pageId) {
          return ''
        }
        return (
          <preloadProto id={nextKey} block block-width="calc(100vw - 200px)" block-height="100vh" block-position-fixed style={{ top: '50%', left: '50%' }}>
            <ProtoEditor2
              key={nextKey.value}
              pinDraggable={editable.value}
              editable={editable}
              draggable={false}
              caseId={caseId}
              pageId={atom(nextProto.pageId)}
              actionId={nextProto.actionId}
              statusId={atom(nextProto.statusId)}
              isActionEnable={actionPinEnable}
              onActionPinClick={onPinFinish}
              onStatusSelect={() => {}}
              />
          </preloadProto>
        )
      }} */}
      <menuBoxContainer block block-position="absolute" style={{
        zIndex: 1,
        top: 0,
        left: 230
      }}>
        <menu.MenuBox></menu.MenuBox>
      </menuBoxContainer>
    </innerProto>
  )
}
InnerProtoRC.forwardRef = true
const InnerProto = createComponent(InnerProtoRC)

const initStepFunc = () => ({
  page: { id: null, name: null },
  status: { id: null, name: null },
  action: { id: null, type: ACTION_TYPE_BASE } // 初始
})

function CaseRecord (props) {
  const { id, editable, disableEdit } = props
  console.log('[CaseRecord] caseId = ', id)
  const slots = props.children[0]

  const actionType = atom(ACTION_TYPE_CLICK)
  const actionShape = atom('rect')

  const timeline = reactive(props.timeline)

  const playing = atom(false)

  const caseRecordRef = useRef(null)
  const caseRecordRect = reactive({ width: 0, height: 0 })
  // TIP：是否在protoEditor上开启动作添加
  const actionPinEnable = atom(false)
  // TIP：初始化的时候确保有一个step object可用
  const initStep = last(props.timeline) ? cloneDeep(last(props.timeline)) : initStepFunc()
  const currentStep = reactive(initStep)

  const editStepIndex = atom(Math.max(0, props.timeline.length - 1))

  const animation = useInterval({ fps: 30 })
  // TIP：切换播放状态，并设置定时器切换，stepInterval 表示多久变化一次
  const stepInterval = 2000
  const displayStepIndex = computed(() => {
    if (editable.value) {
      return { frame: 0, percent: 0 }
    }
    const s = animation.seconds.value
    const frame = Math.floor(s / stepInterval)
    const percent = (s - frame * stepInterval) / stepInterval
    return { frame, percent }
  })

  function togglePlay (isEnd) {
    playing.value = !playing.value
    // @TODO: 先避免异常，再排查
    setTimeout(() => {
      if (playing.value) {
        animation.start()
      } else {
        animation.stop()
      }
      if (isEnd) {
        animation.reset()
      }
    })
  }
  const currentDisplay = atomComputed(() => {
    // TIP: 勾一下
    // eslint-disable-next-line no-unused-expressions
    displayStepIndex.frame
    let step
    let nextStepIndex
    if (editable.value) {
      step = currentStep
      nextStepIndex = editStepIndex.value + 1
    } else {
      step = timeline[displayStepIndex.frame]
      nextStepIndex = displayStepIndex.frame + 1
      if (!step) {
        // 播放结束
        togglePlay(true)
      }
    }
    if (!step) {
      step = props.timeline[0]
      nextStepIndex = 1
    }

    const result = step
      ? {
          pageId: step.page.id,
          statusId: step.status.id,
          actionId: step.action.id
        }
      : {}

    const nextStep = timeline[nextStepIndex]
    console.log('[CaseRecord] nextStep: ', nextStep)
    if (nextStep) {
      Object.assign(result, {
        nextPageId: nextStep.page.id,
        nextStatusId: nextStep.status.id,
        nextActionId: nextStep.action.id
      })
    } else {
      Object.assign(result, {
        nextPageId: null,
        nextStatusId: null,
        nextActionId: null
      })
    }

    return result
  })

  function gotoStep (index) {
    if (editable.value) {
      if (editStepIndex.value === index) {
        return
      }

      // TIP: 说明timeline被全部删除完了
      if (index < 0) {
        Object.assign(currentStep, initStepFunc())
        editStepIndex.value = 0
      } else {
        Object.assign(currentStep, timeline[index])
        editStepIndex.value = index
      }
    } else {
      if (displayStepIndex.frame === index) {
        return
      }
      animation.gotoSecond(stepInterval * index, true)
      playing.value = false
    }
  }
  function gotoNext () {
    if (editable.value) {
      gotoStep(editStepIndex.value + 1)
    } else {
      animation.gotoSecond(animation.seconds.value + stepInterval, true)
    }
  }

  // page 选择新页面, status 基于当前页面选择新状态
  const selectTarget = atomComputed(() => {
    const { page, status, action } = currentStep

    // TIP：演示模式则强制进入
    if (disableEdit.value) {
      return 'status'
    }

    if (action?.type) {
      // TIP: 只有编辑态情况下才会去选择页面，或者是完全新建时（没有step）
      if (!page?.id && (editable.value)) {
        return 'page'
      }
      if (!status?.id) {
        return 'status'
      }
    }
    return ''
  })

  async function onNewState (status, pin) {
    // TIP: 这意味用户是从中间插入了一个状态，先禁止
    if (editStepIndex.value !== timeline.length - 1) {
      alert('提示：暂不支持从中间插入一个状态')
      return
    }
    currentStep.status = status

    const aid = await Action.createWithPin({
      triggerType: actionType.value,
      destinationType: 'status',
      destinationValue: status.id,
      useCase: id
    }, [pin])

    pushTimeline(aid)
  }
  function onNewPage (pin) {
    // TIP: 这意味用户是从中间插入了一个状态，先禁止
    if (editStepIndex.value !== timeline.length - 1) {
      alert('提示：暂不支持从中间插入一个页面')
      return
    }

    currentStep.action = { id: null, type: actionType.value, pin }
    currentStep.page = { id: null, name: null }
  }
  // TIP：新增的步骤的下标，page或status
  const newStepIndex = atom(-1)

  function pushTimeline (aid) {
    newStepIndex.value = editStepIndex.value + 1
    timeline.splice(editStepIndex.value + 1, 0, {
      page: currentStep.page,
      status: currentStep.status,
      action: { type: actionType.value, id: aid }
    })
    // TIP：更新当前操作对象
    editStepIndex.value = timeline.length - 1
    currentStep.action = { type: actionType.value, id: null }
  }

  // TIP：是pin完成后才能选择页面
  async function selectNewPage (p) {
    const currentPin = currentStep.action.pin
    delete currentStep.action.pin

    const aid = await Action.createWithPin({
      triggerType: currentStep.action.type,
      destinationType: 'page',
      destinationValue: p.id,
      useCase: id
    }, [currentPin])
    currentStep.page = p
    currentStep.status = { id: null, name: null }
    pushTimeline(aid)
    // TIP：选择完页面之后，则自动进入到编辑态。用户上次新建了case但是没选页面就跳走了
    props.editable.value = true
  }

  const protoEditorRef = useRef(null)
  const { onContextMenuCb } = useContextMenu({
    actionPinEnable,
    editable,
    timeline,
    async onAdd (e, addType) {
      actionType.value = addType
      await protoEditorRef.current.createPinAt({
        pageX: e.x,
        pageY: e.y
      })
    }
  })

  useViewEffect(() => {
    watch(() => currentDisplay.value, () => {
      console.log('currentDisplay.value:', currentDisplay.value)
    })

    const cb = (e) => {
      if (editable.value || !isCaseFocus.value) {
        return
      }
      // ArrowRight, ArrowLeft, Space
      switch (e.code) {
        case 'ArrowRight':
          gotoStep(displayStepIndex.frame + 1)
          break
        case 'ArrowLeft':
          gotoStep(displayStepIndex.frame - 1)
          break
        case 'Space':
          togglePlay()
          break
      }
    }
    caseRecordRef.current.addEventListener('keydown', cb)
    return () => {
      console.log('[CaseRecord] unmount')
      caseRecordRef.current.removeEventListener('keydown', cb)
    }
  })

  const isCaseFocus = atom(true)

  return (
    <caseRecord
      ref={caseRecordRef}
      block block-height="100%"
      onContextMenu={onContextMenuCb}
      className={styles['case-record']}
      tabIndex="-1" >
      { () => disableEdit.value || selectTarget.value === 'page' ? '' : (<RecordAction id={id} timeline={timeline} type={actionType} shape={actionShape} editable={editable} actionPinEnable={actionPinEnable} />)}

      {() => timeline.length && selectTarget.value !== 'page'
        ? (
            <RecordTimeline
              newStepIndex={newStepIndex}
              editStepIndex={editStepIndex}
              displayStepIndex={displayStepIndex}
              seconds={animation.seconds}
              timeline={timeline}
              editable={editable}
              togglePlay={togglePlay}
              playing={playing}
              gotoStep={gotoStep} />
          )
        : <empty block block-position="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>当前用例未包含任何“交互动作”</empty>}

      <SelectPageContainer
        Editor={slots.Editor}
        selectTarget={selectTarget}
        onSelectNewPage={selectNewPage}
        timeline={timeline} />

      {() => {
        const pageId = currentDisplay.value.pageId
        if (selectTarget.value !== 'page' && pageId) {
          return <InnerProto
            ref={protoEditorRef}
            actionType={actionType}
            timeline={timeline}
            currentDisplay={currentDisplay}
            caseId={id}
            editable={editable}
            parentRect={caseRecordRect}
            onNewState={onNewState}
            onNewPage={onNewPage}
            gotoNext={gotoNext}
            actionPinEnable={actionPinEnable} />
        }
        return ''
      }}
    </caseRecord>
  )
}

CaseRecord.propTypes = {
  timeline: propTypes.array.default(() => []),
  disableEdit: propTypes.bool.default(() => atom(false)),
  editable: propTypes.bool.default(() => atom(false))
}

CaseRecord.Style = (frag) => {
  const ele = frag.root.elements
  ele.caseRecord.style({
    backgroundColor: '#f5f5f5',
    outline: 'none', // because of tabIndex
    position: 'relative',
    overflow: 'scroll'
  })
}

/**
 * 选择页面的容器
 * 1.添加选择的提示 2.交互引导
 */
function SelectPageContainerRC ({
  selectTarget,
  Editor,
  onSelectNewPage,
  timeline
}) {
  const tipText = atomComputed(() => {
    if (selectTarget.value === 'page') {
      const pre = '点击下方的页面'
      if (timeline.length) {
        return `${pre}，作为跳转后的“新页面”`
      }
      return `${pre}，作为这次功能用例的开始点`
    }
    return ''
  })

  const selectPageName = atom('')

  function selectPage ({ id, name }) {
    onSelectNewPage({ id, name })
  }

  function draftEnd () {
    selectPageName.value = ''
  }

  return (
    <pageContainer block block-width="100%" block-height="100vh" block-position-absolute>
      {() => tipText.value ? <addPageTip block block-padding="16px" block-position="absolute" >{tipText.value}</addPageTip> : ''}
      {() => selectTarget.value === 'page' ? <Editor onClickPage={selectPage} /> : ''}
      {() => {
        // 选中的动画效果
        if (selectPageName.value) {
          return (
            <animationDraft
              className={styles['select-new-page']}
              block
              block-width="220px"
              block-height="50px"
              flex-display
              flex-align-items="center"
              flex-justify-content-center
              block-position-absolute
              style={{
                textAlign: 'center',
                zIndex: 5,
                backgroundColor: '#fff',
                left: '50%',
                transform: 'translate(-50%, 0)'
              }}
              onAnimationEnd={draftEnd}>
              页面：{selectPageName.value}
            </animationDraft>
          )
        }
        return ''
      }}
    </pageContainer>
  )
}

SelectPageContainerRC.Style = (frag) => {
  const ele = frag.root.elements
  ele.addPageTip.style({
    zIndex: '2',
    left: '50%',
    top: '16px',
    transform: 'translate(-50%, 0)',
    backgroundColor: '#eee',
    borderRadius: '8px',
    color: '#333',
    fontSize: '16px'
  })
}

const SelectPageContainer = createComponent(SelectPageContainerRC)

function TimelineStepRC ({ step, i, newStepIndex, isHover, onRemove, editable, focusIndex }) {
  const beforeDestination = []
  const destination = []
  i !== 0 && beforeDestination.push(<right inline inline-margin="2px 8px 0 0px"><ArrowRight /></right>)

  beforeDestination.push(
    <index inline inline-margin="0 8px 0 0" inline-width="1.5em"
      style={{ background: '#eee', color: '#666', borderRadius: '50%', textAlign: 'center', fontSize: '12px' }}>
      {i + 1}
    </index>
  )

  if (step.action?.id) {
    beforeDestination.push(
      <action inline inline-margin="0 8px 0 0px" >{actionTypeMap[step.action.type]}</action>
    )
    beforeDestination.push(<ArrowRight />)
  }
  if (step.page?.id && !step.status?.id) {
    destination.push(
      <>
        页面:<destination inline inline-margin="0 0 0 4px"> {step.page.name}</destination>
      </>
    )
    if (step.status?.id) {
      destination.push('的')
    }
  }
  if (step.status?.id) {
    destination.push(
      <>
        状态:<destination inline inline-margin="0 0 0 4px">{step.status.name || step.status.id}</destination>
      </>
    )
  }

  const progressStyle = atomComputed(() => {
    let w = 0
    if (focusIndex.frame === i) {
      // TIP: 正在播放当前动作
      w = `${focusIndex.percent * 100}%`
    } else if (focusIndex.frame > i) {
      // TIP: 已经播放结束
      w = '100%'
    }
    return { width: w }
  })

  const activeStyle = atomComputed(() => {
    if (focusIndex.frame === i) {
      return { border: '2px solid #666' }
    }
    return { border: 0 }
  })

  // TIP：当前这个Step是刚刚新增的Step
  const shouldAnimation = i === newStepIndex.value
  const cls = shouldAnimation ? styles['new-step'] : ''

  function animationEnd () {
    newStepIndex.value = -1
  }

  return (
    <stepBox key={step.action.id} className={cls} onAnimationEnd={animationEnd} inline inline-padding="0 12px 0 8px" flex-display flex-align-items-center >
      <active block block-width="100%" block-height="100%" style={activeStyle}></active>
      <progress block block-height="100%" style={progressStyle} ></progress>
      <content block flex-display flex-align-items-center>
        {beforeDestination}
        <step inline inline-margin="0 0 0 8px">
          {destination}
        </step>
        {() => isHover.value && editable.value
          ? (
            <closeBox onClick={debounce(() => onRemove(step))}>
              <CloseOne theme="filled" fill="#f5222d" size="24" unit="px" />
            </closeBox>
            )
          : ''}
      </content>
    </stepBox>
  )
}
TimelineStepRC.Style = (frag) => {
  const ele = frag.root.elements
  ele.stepBox.style((props) => ({
    backgroundColor: props.isHover.value ? '#eee' : '#fff',
    cursor: 'pointer',
    height: '50px',
    position: 'relative'
  }))
  ele.active.style({
    boxSizing: 'border-box',
    position: 'absolute',
    top: 0,
    left: 0
  })
  ele.progress.style(({ editable }) => ({
    backgroundColor: 'red',
    position: 'absolute',
    left: 0,
    top: 0,
    opacity: 0.4,
    display: editable.value ? 'none' : 'block'
  }))
  ele.destination.style({
    textDecoration: 'underline'
  })
  ele.closeBox.style({
    position: 'absolute',
    top: 0,
    right: 0,
    transform: 'translate(0%, 0%)',
    zIndex: 1,
    cursor: 'pointer'
  })
}
const TimelineStep = createComponent(TimelineStepRC)

function RecordTimelineRC ({
  newStepIndex,
  timeline, editable, togglePlay, playing,
  seconds, editStepIndex, displayStepIndex,
  gotoStep
}) {
  const focusIndex = computed(() => {
    if (editable.value) {
      return { frame: editStepIndex.value, percent: 0 }
    }
    return {
      frame: displayStepIndex.frame,
      percent: displayStepIndex.percent
    }
  })

  async function onRemove (step) {
    const removeId = step.action.id
    await Action.remove(removeId)
    const i = timeline.findIndex(s => s.action.id === removeId)
    if (i >= 0) {
      if (i === editStepIndex.value && i === timeline.length - 1) {
        gotoStep(editStepIndex.value - 1)
      }
      timeline.splice(i, 1)
    }
  }

  const displayTime = atomComputed(() => {
    const s = String(Math.floor(seconds.value / 1000 % 60))
    const m = String(Math.floor(seconds.value / 1000 / 60))

    return `${m.padStart(2, '0')}:${s.padStart(2, '0')}`
  })

  const stepsScrollRef = useRef(null)
  const stepsRef = useRef(null)
  const isMounted = atom(false)

  // TIP：timeline当前宽度
  const visualWidth = atomComputed(() => {
    if (isMounted.value && stepsScrollRef.current) {
      return stepsScrollRef.current.getBoundingClientRect()?.width
    }
    return 0
  })
  // TIP：所有step的宽度的总和
  const stepWidths = computed(() => {
    if (isMounted.value && stepsRef.current) {
      // eslint-disable-next-line no-unused-expressions
      timeline.length
      const result = [...stepsRef.current.children].map(dom => {
        return dom.getBoundingClientRect()?.width
      })
      console.log('[timeline] stepWidths: ', result.length, result)
      return result
    }
    return []
  })

  // TIP：随着播放的进度的增加（focusIndex.frame)，timeline应该向左scroll以展现后续的step
  const transLeftStyle = atomComputed(() => {
    let l = 0
    if (visualWidth.value) {
      const alreadyPlayedArr = stepWidths.filter((_, i) => i < focusIndex.frame)
      const len = alreadyPlayedArr.length
      const currentTransLeft = alreadyPlayedArr.slice(0, -1).reduce((p, n) => p + n, 0) + alreadyPlayedArr[len - 1] / 2
      l = currentTransLeft
      console.log('[timeline] visualWidth.value: ', visualWidth.value, currentTransLeft, focusIndex.frame)
    }
    return l
  })

  useViewEffect(() => {
    isMounted.value = true
    watch(() => transLeftStyle.value, () => {
      setTimeout(() => {
        if (stepsScrollRef.current) {
          stepsScrollRef.current.scrollLeft = transLeftStyle.value
        }
      })
    }, true)
  })

  return (
    <recordTimeline
      block block-height="50px"
      flex-display flex-align-items-center
      onMouseUp={e => e.stopPropagation()} >

      {() => !editable.value
        ? (
            <playBox
              onClick={() => togglePlay()}
              inline inline-height="24px" inline-padding="0 12px" inline-margin="0 -1px 0 0"
              style={{ borderRight: '1px solid #999', cursor: 'pointer' }}
              flex-display flex-align-items-center >
              {() => playing.value ? <PauseOne theme="filled" size="24" unit="px"/> : <Play theme="filled" size="24" unit="px"/>}
              <time inline inline-width="48px" inline-margin="0 0 0 12px">{() => displayTime.value}</time>
            </playBox>
          )
        : ''}

      <stepsScroll id="ssl" block block-padding="0 0" flex-grow="1" ref={stepsScrollRef}>
        <steps inline flex-grow="1" flex-display ref={stepsRef} style={transLeftStyle} >
          {() => timeline.map((step, i) => {
            const { Node, isHover } = useHover()
            return (
              <Node key={step.action.id} style={{ zIndex: 1 }} onClick={() => (gotoStep(i))}>
                <TimelineStep
                  focusIndex={focusIndex}
                  step={step}
                  i={i}
                  newStepIndex={newStepIndex}
                  editable={editable}
                  isHover={isHover}
                  onRemove={onRemove} />
              </Node>
            )
          })}
        </steps>
      </stepsScroll>

      {() => !editable.value
        ? (
          <tipBar inline inline-min-width="96px" inline-padding="0 8px 0 8px"
            flex-display flex-align-items-center
            style={{ borderLeft: '1px solid #999', cursor: 'pointer', color: '#999' }} >
            空格
            <pd inline inline-margin="0 8px 0 8px" inline-height="18px">
              <ArrowLeft fill="#999" />
            </pd>
            <pd inline inline-margin="0 8px 0 0px" inline-height="18px">
              <ArrowRight fill="#999"/>
            </pd>
          </tipBar>)
        : ''}
    </recordTimeline>
  )
}

RecordTimelineRC.propTypes = {
  timeline: propTypes.array.default(() => [])
}

RecordTimelineRC.Style = (frag) => {
  const ele = frag.root.elements

  ele.recordTimeline.style({
    backgroundColor: '#fff',
    position: 'fixed',
    left: 200,
    bottom: 0,
    right: 0,
    zIndex: 4,
    border: '1px solid #eee'
  })
  ele.destination.style({
    textDecoration: 'underline'
  })
  ele.stepsScroll.style({
    overflow: 'scroll'
  })
  ele.steps.style({
    whiteSpace: 'nowrap'
  })
}

const RecordTimeline = createComponent(RecordTimelineRC)

// TIP：workbench Layout bug，暂时不启用
// function openCaseEditor (productId, versionId, id) {
//   historyLocation.goto(`/product/${productId}/version/${versionId}/case/${id}?layout=hidden&edit=true`)
//   historyLocation.patchQuery({
//     layout: 'hidden',
//     edit: 'true'
//   })
// }
// function openCasePlay (productId, versionId, id) {
//   historyLocation.goto(`/product/${productId}/version/${versionId}/case/${id}`)
// }

function RecordActionRC ({ id, type, timeline, editable, actionPinEnable }) {
  // const version = useVersion()
  // const versionId = version.value.id
  // const productId = version.value.product.id
  // const caseCallbacks = useCallbackByRouter({
  //   product () {
  //     // TIP：修改的时候进入到工作台修改
  //     openCaseEditor(productId, versionId, id)
  //   },
  //   workbench () {
  //     // openCasePlay(productId, versionId, id)
  //   }
  // })

  function toggle () {
    editable.value = !editable.value
  }

  // 0：左上角，1：右上角
  const LOCAL_KEY = 'UseCase_Action_Position'
  const RightTag = '1'
  const LeftTag = '0'
  const positionRight = atom(localStorage.getItem(LOCAL_KEY) === RightTag)
  const actionStyle = atomComputed(() => {
    if (positionRight.value) {
      localStorage.setItem(LOCAL_KEY, RightTag)
      return {
        right: 16,
        left: 'auto'
      }
    } else {
      localStorage.setItem(LOCAL_KEY, LeftTag)
      return {
        left: 240,
        right: 'auto'
      }
    }
  })

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

  return (
    <recordAction style={actionStyle} block block-height="33px" block-padding="8px 12px" flex-display onMouseUp={e => e.stopPropagation()} >

      <tip inline flex-display flex-align-items="center">
        <text inline inline-margin="0 0 0 0" style={{ color: '#666' }}>鼠标右键:显示操作菜单</text>
      </tip>

      <split0 inline inline-margin="6px 12px 6px 12px" inline-width="1px" inline-height="20px" />

      <actions inline flex-display flex-align-items="center" >
        <text inline inline-margin="0 0 0 0" style={{ color: '#666' }}>动作类型：</text>
        <click inline inline-margin="0 4px 0 0" inline-padding="4px 0px" onClick={() => (type.value = 'click')}>点击</click>
        <hover inline inline-margin="0 0 0 0" inline-padding="4px 0px" onClick={() => (type.value = 'hover')} >Hover</hover>
      </actions>


      {/* <split1 inline inline-margin="6px 12px 6px 12px" inline-width="1px" inline-height="20px" />

      <pinBox inline inline-margin="0 0 0 0">
        <ButtonNew onClick={() => (actionPinEnable.value = !actionPinEnable.value) }>
          {() => actionPinEnable.value ? '交互动作添加中' : '添加交互动作'}
        </ButtonNew>
      </pinBox> */}

      <split1 inline inline-margin="6px 12px 6px 12px" inline-width="1px" inline-height="20px" />

      <status inline flex-display flex-align-items-center onClick={debounce(toggle)}>
        <ButtonNew >{pinButtonText}</ButtonNew>
      </status>

      <split0 inline inline-margin="6px 12px 6px 12px" inline-width="1px" inline-height="20px" />

      <text inline inline-margin="4px 0 0 0" style={{ cursor: 'pointer' }} onMouseDown={() => (positionRight.value = !positionRight.value)}>
        {() => positionRight.value ? <Left size="24" unit="px" /> : <Right size="24" unit="px" />}
      </text>
    </recordAction>
  )
}

RecordActionRC.propTypes = {

}

RecordActionRC.Style = (frag) => {
  const ele = frag.root.elements
  ele.recordAction.style(({ editable }) => ({
    border: '1px solid #eee',
    backgroundColor: '#fff',
    position: 'fixed',
    top: 16,
    zIndex: 10,
    borderRadius: '2px',
    boxShadow: '1px 1px 2px #ccc'
  }))
  ele.split0.style(({ editable }) => ({
    backgroundColor: '#999'
  }))
  ele.split1.style(({ editable }) => ({
    display: editable.value ? 'inline-block' : 'none',
    backgroundColor: '#999'
  }))
  ele.pinBox.style(({ editable }) => ({
    display: editable.value ? 'inline-block' : 'none'
  }))
  ele.actions.style(({ editable }) => ({
    display: editable.value ? 'flex' : 'none'
  }))
  ele.statusRec.style(props => ({
    fontSize: '16px',
    color: '#f5222d',
    fontWeight: 'bold',
    display: props.editable.value ? 'flex' : 'none'
  }))
  ele.statusLive.style(props => ({
    fontSize: '16px',
    color: '#f5222d',
    fontWeight: 'bold',
    display: !props.editable.value ? 'flex' : 'none'
  }))
  ele.dot.style({
    borderRadius: '50%',
    backgroundColor: '#f5222d'
  })
  ele.click.style((p) => ({
    cursor: 'pointer',
    textDecoration: p.type.value === ACTION_TYPE_CLICK ? 'underline' : 'none'
  }))
  ele.hover.style((p) => ({
    cursor: 'pointer',
    textDecoration: p.type.value === ACTION_TYPE_HOVER ? 'underline' : 'none'
  }))
  ele.rect.style((p) => ({
    cursor: 'pointer',
    border: p.shape.value === 'rect' ? '1px solid #999' : ''
  }))
  ele.circle.style((p) => ({
    cursor: 'pointer',
    border: p.shape.value === 'circle' ? '1px solid #999' : ''
  }))
  ele.pin.style((p) => ({
    cursor: 'pointer',
    border: p.shape.value === 'pin' ? '1px solid #999' : ''
  }))
}

const RecordAction = createComponent(RecordActionRC)

export default createComponent(CaseRecord)

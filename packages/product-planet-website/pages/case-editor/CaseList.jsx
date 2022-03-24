/** @jsx createElement */
import {
  createElement,
  Fragment,
  computed,
  createComponent,
  atom,
  useViewEffect,
  propTypes,
  reactive,
  atomComputed,
  useRef
} from 'axii'
import Add from 'axii-icons/Add'
import Play from 'axii-icons/Play'
import List from '../../components/List'
import { useRequest, message } from 'axii-components'
import { historyLocation } from '@/router'
import { UseCase, TaskLink } from '@/models'
import { Dialog } from '../../components/Dialog/Dialog'
import useHideLayout from '@/hooks/useHideLayout'
import { useVersion } from '@/layouts/VersionLayout'
import CreateTaskDialog from '@/pages/task/CreateTaskDialog.jsx'
import debounce from 'lodash/debounce'
import parseSearch from '@/tools/parseSearch'
import DeleteOne from 'axii-icons/DeleteOne'
import Config from 'axii-icons/Config'
import Left from 'axii-icons/Left'
import useHover from '@/hooks/useHover'
import { openFullscreenAnimation } from '@/components/FullscreenAnimation'
import api from '@/services/api'
import { handleTaskInfos } from '@/pages/link-editor/PageDetail.jsx'
import CaseDetail from './CaseDetail.jsx'
import PartialTag from '@/components/PartialTag'
import useNewCaseDialog from './useNewCaseDialog.jsx'

export const CASE_LIST_WIDTH = 200

function CaseList (props) {
  const { versionId, productId, currentId, collapse, minWidth = 0 } = props
  const version = useVersion()
  const showCreateTask = atom(false)
  const currentCase = reactive({
    name: '新建用例'
  })
  const showCaseDetail = atom(false)
  const taskLoading = atom(false)

  if (!version.value) {
    return
  }

  const { visible, refresh, node } = useNewCaseDialog({
    versionId,
    caseItem: currentCase,
    onAdd: debounce((id, startNow) => {
      // TIP：进去编辑态
      if (startNow) {
        if (isHideLayout.value) {
          historyLocation.goto(`/product/${productId}/version/${versionId}/case/${id}?layout=hidden&edit=true`)
        } else {
          openFullscreenAnimation({
            onEnd () {
              historyLocation.goto(`/product/${productId}/version/${versionId}/case/${id}?layout=hidden&edit=true`)
            }
          })
        }
      }
    })
  })

  const { data } = useRequest(async () => {
    // eslint-disable-next-line no-unused-expressions
    refresh.value
    // eslint-disable-next-line no-unused-expressions
    collapse.value
    const r = await api.useCase.getTaskInfosAndUseCase({
      versionId
    })
    if (showCaseDetail.value && taskLoading.value) {
      taskLoading.value = false
      Object.assign(currentCase, r.find(item => currentId.value === item.id))
    }
    return { data: r.filter(obj => obj.name) }
  }, {
    data: atom([])
  })

  const { isHideLayout } = useHideLayout()

  const isPlay = atomComputed(() => {
    const search = parseSearch(historyLocation.search)
    // eslint-disable-next-line no-unused-expressions
    historyLocation.pathname
    return search.play === 'true'
  })

  const listExtra = () => {
    const result = []
    if (!isPlay.value) {
      result.push(
        ...[
          <Add key="add" style={{ cursor: 'pointer', height: '16px', display: 'inline-block', marginLeft: 8 }} onClick={() => {
            Object.assign(currentCase, { id: null, name: '新建用例' })
            visible.value = true
          }}/>,
          <Play key="play" style={{ cursor: 'pointer', height: '16px', display: 'inline-block', marginLeft: 8 }} onClick={debounce(showSlide)}/>
        ]
      )
    }
    return result
  }

  const title = () => {
    let defaults = '功能用例'
    if (isHideLayout.value) {
      defaults = version.value.product.name
    }
    return (
      <caseTitle inline inline-height="22px" flex-display flex-align-items="center">
        {isHideLayout.value
          ? <back inline inline-width="30px" inline-height="24px" inline-margin="0 0 0 -6px " style={{ cursor: 'pointer', lineHeight: 0 }} onClick={debounce(() => {
            historyLocation.goto(`/product/${productId}/version/${versionId}/link`)
          })}>
          <Left style={{ marginTop: '4px' }} size="16" unit="px" />
        </back>
          : ''}

        {defaults}
      </caseTitle>
    )
  }

  const targetCaseUrl = (targetId) => {
    const withId = targetId ? `/${targetId}` : ''
    let url = `/product/${productId}/version/${versionId}/case${withId}?layout=hidden`
    if (isPlay.value) {
      url += '&play=true'
    }
    return url
  }

  const removeVisible = atom(false)
  const removeItem = atom(null)
  const removeLoading = atom(false)
  const removedIndex = atom(0)
  function removeCase (item, i) {
    removeItem.value = item
    removeVisible.value = true
    removedIndex.value = i
  }
  async function confirmRemove () {
    removeLoading.value = true
    await UseCase.remove(removeItem.value.id)
    // TIP：删除后默认指定下一个的显示
    refresh.value++
    // 重置
    removeLoading.value = false
    removeVisible.value = false
    removeItem.value = null

    setTimeout(function () {
      const switchIndex = removedIndex.value < data.value.length - 1 ? removedIndex.value + 1 : removedIndex.value - 1
      const targetId = data.value[switchIndex]?.id
      historyLocation.goto(targetCaseUrl(targetId))
    })
  }

  async function createTaskCb (taskId) {
    TaskLink.create({
      taskId,
      versionId,
      useCaseId: currentCase.id
    })
    await UseCase.update(currentCase.id, {
      taskId: (currentCase.taskId || '').split(',').concat(taskId).filter(a => a).join(',')
    })
    refreshData()
  }

  async function deleteTaskCb (taskId) {
    await UseCase.update(currentCase.id, {
      taskId: (currentCase.taskId || '').split(',').filter(id => id !== taskId).join(',')
    })
    refreshData()
  }

  function handleCaseClick (item, e) {
    e.stopPropagation()
    e.preventDefault()
    if (version.value?.product?.teamProjectId && version.value?.teamSectionId) {
      Object.assign(currentCase, item)
      showCaseDetail.value = true
      return
    }
    message.info('请先创建迭代')
    historyLocation.goto(`/product/${version.value?.product?.id}/version/${version.value?.id}/task`)
  }

  function showSlide () {
    const firstCase = data.value[0]
    if (firstCase) {
      window.open(`/product/${productId}/version/${versionId}/case/${firstCase.id}?layout=hidden&play=true`)
    } else {
      alert('暂无用例无法播放，先去新建一个吧！')
      visible.value = true
    }
  }
  const caseListStyle = atomComputed(() => ({
    minHeight: isHideLayout.value ? '100vh' : 'calc(100vh - 70px)'
  }))

  const refreshData = () => {
    taskLoading.value = true
    refresh.value++
  }

  const opacityPageNodes = []
  const onMouseEnter = (item) => {
    const { actions } = item
    if (!actions?.length) return

    opacityPageNodes.splice(0, opacityPageNodes.length)

    const nodes = document.querySelectorAll('g[data-shape="html"]')

    const map = actions.reduce((acc, x) => (
      x.destinationType === 'page' || x.page_id ? { ...acc, [x.page_id || x.destinationValue]: true } : acc
    ), {})

    nodes.forEach(n => {
      const id = n.getAttribute('data-cell-id')
      if (map[id]) return
      n.style.opacity = 0.2
      opacityPageNodes.push(n)
    })
  }

  const onMouseLeave = () => {
    opacityPageNodes.forEach(n => {
      n.style.opacity = 1
    })
  }

  function showSetting (item) {
    Object.assign(currentCase, item)
    visible.value = true
  }

  return (
    <>
      {() => showCreateTask.value
        ? <CreateTaskDialog
        visible={showCreateTask}
        labelType='case'
        submitCallback={taskId => createTaskCb(taskId)}
      />
        : null}
      {() => showCaseDetail.value
        ? <CaseDetail
            infos={currentCase.infos}
            visible={showCaseDetail}
            showCreateTask={showCreateTask}
            onDeleteTask={deleteTaskCb}
            onRefresh={refreshData}
          />
        : null}
      <caseList block block-width={CASE_LIST_WIDTH} block-min-width={minWidth} style={caseListStyle} onTransitionEnd={() => {
        console.log('end')
      }}>
        {() => !collapse.value || data.value.length
          ? <List
          header={title}
          extra={listExtra}
          dataSource={data}
          renderItem={(item, i) => {
            const focus = atomComputed(() => currentId.value === item.id)
            if (currentId.value !== currentCase.id) {
              showCaseDetail.value = false
            }
            const caseItemStyle = atomComputed(() => {
              const result = {
                borderBottom: 0,
                padding: '0'
              }
              if (focus.value) {
                Object.assign(result, {
                  borderBottom: '1px solid #eee',
                  padding: '0 0 8px 0'
                })
              }
              return result
            })

            const { Node, isHover } = useHover()

            const listItemStyle = atomComputed(() => {
              const result = {
                cursor: 'pointer',
                backgroundColor: '#fff',
                color: '#333'
              }
              if (focus.value) {
                Object.assign(result, {
                  backgroundColor: '#000',
                  color: '#fff'
                })
              } else if (isHover.value) {
                Object.assign(result, {
                  backgroundColor: 'rgba(0,0,0,0.05)'
                })
              }
              return result
            })

            return (
              <Node onMouseEnter={() => onMouseEnter(item)} onMouseLeave={onMouseLeave}>
                <caseItem block block-position="relative" style={caseItemStyle}>
                  <List.Item
                    border={!focus.value}
                    extra={() => focus.value
                      ? <extra block style={{ whiteSpace: 'nowrap' }}>
                          <caseSetting key="setting" style={{ cursor: 'pointer' }} inline inline-margin="0 0 0 4px" onClick={() => showSetting(item)} ><Config fill={listItemStyle.value.color} /></caseSetting>
                        </extra>
                      : ''}
                    focus={focus}
                    onClick={debounce(() => {
                      if (isHideLayout.value) {
                        historyLocation.goto(targetCaseUrl(item.id))
                      } else {
                        openFullscreenAnimation({
                          onEnd () {
                            historyLocation.goto(targetCaseUrl(item.id))
                          }
                        })
                      }
                    })}>
                    {i + 1}. {item.name}
                  </List.Item>
                  <PartialTag partial={item} relationKeys={['actions']} />
                  {() => focus.value && !isPlay.value
                    ? (
                      <operations
                        block flex-display flex-justify-content-space-between block-margin="0 16px" block-padding="8px 0 0 0"
                        style={{ borderTop: '1px solid #eee', fontSize: '14px' }}>
                        <task style={{ cursor: 'pointer', color: '#999' }} onClick={(e) => handleCaseClick(item, e)} key={1}>
                          {() => <span>查看详情</span>}
                        </task>
                        {() => {
                          const infos = handleTaskInfos(item.infos)
                          if (!infos.length) return null
                          let endCount = 0
                          infos.forEach(info => {
                            if (info.statusPhase === 'END') endCount++
                          })
                          return <process style={{ color: '#999' }}>
                            任务进度：{() => `${endCount}/${infos.length}`}
                          </process>
                        }}
                        <remove key="remove" style={{ cursor: 'pointer' }} onClick={() => removeCase(item, i)} ><DeleteOne fill="#666" /></remove>
                      </operations>
                      )
                    : ''}
                </caseItem>
              </Node>
            )
          }} />
          : '' }
          {() => data.value.length === 0
            ? <createTaskTip block onClick={() => (visible.value = true)}><createIcon inline-block>+</createIcon> 创建一个用例</createTaskTip>
            : ''}
      </caseList>

      {node}

      <Dialog
        title="二次确认"
        loading={removeLoading}
        visible={removeVisible}
        onSure={confirmRemove} onCancel={() => (removeVisible.value = false)}
        sureProps={{ danger: true }} >
        <remind style={{ fontSize: '16px' }}>
          是否确认删除用例"{() => removeItem.value?.name}"
        </remind>
      </Dialog>
    </>
  )
}

CaseList.propTypes = {
  collapse: propTypes.bool.default(() => atom(false)),
  currentId: propTypes.number.default(() => -1),
  onAdd: propTypes.function.default(() => () => {}),
  onRemove: propTypes.function.default(() => () => {})
}

CaseList.Style = (frag) => {
  const ele = frag.root.elements
  ele.caseList.style(({ collapse }) => ({
    'box-shadow': '2px 0 8px 0 rgb(29 35 41 / 5%)',
    position: 'relative',
    zIndex: 1,
    backgroundColor: '#fff',
    width: collapse.value ? 0 : CASE_LIST_WIDTH,
    transition: 'all ease 0.1s',
    overflow: 'auto'
  }))
  ele.dialogBox.style({
    position: 'absolute',
    zIndex: 101
  })
  ele.createTaskTip.style({
    color: '#333',
    padding: '16px',
    lineHeight: '16px',
    cursor: 'pointer'
  })
  ele.createIcon.style({
    fontSize: '24px'
  })
}

export default createComponent(CaseList)

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
  atomComputed
} from 'axii'
import Add from 'axii-icons/Add'
import Play from 'axii-icons/Play'
import List from '../../components/List'
import { useRequest, Input, message, Checkbox } from 'axii-components'
import { historyLocation } from '@/router'
import { UseCase, TaskLink } from '@/models'
import { Dialog } from '../../components/Dialog/Dialog'
import useHideLayout from '@/hooks/useHideLayout'
import { useVersion } from '@/layouts/VersionLayout'
import CreateTaskDialog from '@/pages/task/CreateTaskDialog.jsx'
import TaskDetail from '@/pages/task/TaskDetail.jsx'
import debounce from 'lodash/debounce'
import parseSearch from '@/tools/parseSearch'
import DeleteOne from 'axii-icons/DeleteOne'
import Left from 'axii-icons/Left'
import useHover from '@/hooks/useHover'
import { openFullscreenAnimation } from '@/components/FullscreenAnimation'
import api from '@/services/api'
import { handleTaskInfos } from '@/pages/link-editor/PageDetail.jsx'
import CaseDetail from './CaseDetail.jsx'

const DEFAULT_CASE_NAME = '新的用例'

let newCaseCount = 0

export const CASE_LIST_WIDTH = 200

export function useNewCaseDialog ({
  versionId,
  productId,
  onAdd
}) {
  const START_NOW_LOCAL_KEY = 'UseCase_Should_StartNow'
  const Yes = '1'
  const No = '0'
  const startNow = atom(localStorage.getItem(START_NOW_LOCAL_KEY) !== No)

  const refresh = atom(0)

  const visible = atom(false)
  const caseName = atom(DEFAULT_CASE_NAME)
  const createLoading = atom(false)
  async function addNewCase () {
    createLoading.value = true

    const id = await UseCase.create({
      name: caseName.value,
      version: versionId
    })
    refresh.value++
    caseName.value = `${DEFAULT_CASE_NAME}${newCaseCount++ || ''}`
    createLoading.value = false
    visible.value = false

    onAdd(id, startNow.value)
  }

  const sureText = atomComputed(() => {
    if (startNow.value) {
      return '新建并录制用例'
    }
    return '新建用例'
  })

  const dialog = () => (
    <Dialog
      loading={createLoading}
      visible={visible} title="输入用例名称" sureText={sureText} onSure={addNewCase} onCancel={() => (visible.value = false)}>
      <Input layout:block value={caseName} />
      <box block block-margin="24px 0 0 0" style={{ color: '#999' }}>
        <Checkbox value={startNow} onChange={() => {
          setTimeout(() => {
            localStorage.setItem(START_NOW_LOCAL_KEY, startNow.value ? Yes : No)
          })
        }}>是否立即开始录制</Checkbox>
      </box>
    </Dialog>
  )

  return {
    node: dialog,
    visible,
    refresh
  }
}

function CaseList (props) {
  const { versionId, productId, currentId, collapse } = props
  const version = useVersion()
  const showCreateTask = atom(false)
  const currentCase = reactive({})
  const showCaseDetail = atom(false)
  const taskLoading = atom(false)

  if (!version.value) {
    return
  }

  const { visible, refresh, node } = useNewCaseDialog({
    versionId,
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
    const r = await api.useCase.getTaskInfosAndUseCase({
      versionId
    })
    const status = await api.team.getTaskStatus()
    if (showCaseDetail.value && taskLoading.value) {
      taskLoading.value = false
      Object.assign(currentCase, r.find(item => currentCase.id === item.id))
    }
    return { data: r }
  }, {
    data: atom([])
  })

  const { data: status } = useRequest(async () => {
    return { data: await api.team.getTaskStatus() }
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
          <Add key="add" style={{ cursor: 'pointer', height: '16px', display: 'inline-block' }} onClick={() => (visible.value = true) }/>,
          <span key="s" inline inline-width="16px" inline-height="16px"></span>,
          <Play key="play" style={{ cursor: 'pointer', height: '16px', display: 'inline-block' }} onClick={debounce(showSlide)}/>
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
    return `/product/${productId}/version/${versionId}/case${withId}?layout=hidden`
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
    Object.assign(currentCase, item)
    showCaseDetail.value = true
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
      <caseList block block-width={CASE_LIST_WIDTH} style={caseListStyle} onTransitionEnd={() => {
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
              <Node>
                <caseItem block style={caseItemStyle}>
                  <List.Item
                    border={!focus.value}
                    extra={() => focus.value ? <remove style={{ cursor: 'pointer' }} onClick={() => removeCase(item, i)} ><DeleteOne fill={listItemStyle.value.color} /></remove> : ''}
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
                            const res = status.value.find(item => item.name === info.statusName)
                            if (res.phase === 'END') endCount++
                          })
                          return <process style={{ color: '#999' }}>
                            任务进度：{() => `${endCount}/${infos.length}`}
                          </process>
                        }}
                      </operations>
                      )
                    : ''}
                </caseItem>
              </Node>
            )
          }} />
          : '' }
      </caseList>

      {node}

      <Dialog
        title="二次确认"
        loading={removeLoading}
        visible={removeVisible}
        onSure={confirmRemove} onCancel={() => (removeVisible.value = false)}
        sureProps={{ danger: true }} >
        <remind style={{ fontSize: '16px' }}>
          确认删除用例，名称是"{() => removeItem.value?.name}"
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
}

export default createComponent(CaseList)

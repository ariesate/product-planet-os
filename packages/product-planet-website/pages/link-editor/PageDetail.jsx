/** @jsx createElement */
import {
  createElement,
  createComponent,
  useViewEffect,
  useRef,
  reactive,
  atom
} from 'axii'
import { message, Select } from 'axii-components'
// import Drawer from '@/components/Drawer'
import * as logMessage from '@/services/logMessage'
import * as product from '@/services/product'
import styles from './PageDetail.module.less'
import ButtonNew from '@/components/Button.new'
import { LogMessage, UserPage, TaskLink, projectActionCode } from '@/models'
import Delete from 'axii-icons/Delete'
import {
  getSearch,
  addMemberToPage
} from '@/services/member'
import CreateTaskDialog from '@/pages/task/CreateTaskDialog.jsx'
import TaskDetail from '@/pages/task/TaskDetail.jsx'
import { useVersion } from '@/layouts/VersionLayout/index.js'
import { historyLocation } from '@/router.jsx'
import Add from 'axii-icons/Add'
import api from '@/services/api'

export const monitorToday = (pageId) => {
  const stDate = new Date()
  stDate.setHours(0)
  stDate.setMinutes(0)
  stDate.setSeconds(0)

  const dateRange = reactive([
    stDate.getTime() / 1000,
    new Date().getTime() / 1000
  ])

  return logMessage.readMonitor({
    pageId: pageId,
    action: 'error',
    format: 'acc',
    date: dateRange
  }).then(r => {
    return r.counts || 0
  })
}

export const pvToday = (pageId) => {
  const stDate = new Date()
  stDate.setHours(0)
  stDate.setMinutes(0)
  stDate.setSeconds(0)

  const dateRange = reactive([
    stDate.getTime() / 1000,
    new Date().getTime() / 1000
  ])

  return logMessage.readLog({
    pageId: pageId,
    action: 'pv',
    format: 'acc',
    date: dateRange
  }).then(pv => {
    return pv.counts || 0
  })
}

const roleCodeAndName = () => [
  {
    name: '设计',
    code: projectActionCode.design
  },
  {
    name: '前端',
    code: projectActionCode.fe
  },
  {
    name: '后端',
    code: projectActionCode.be
  },
  {
    name: '产品',
    code: projectActionCode.pd
  },
  {
    name: '订阅者',
    code: projectActionCode.any
  }
]

const AddPageMember = createComponent((() => {
  const SelectHighIndex = Select.extend((frag) => {
    frag.root.elements.portal.style({
      zIndex: 13
    })
  })

  function AddPageMember (props) {
    console.log('[AddPageMember] props: ', props)
    const options = reactive([])
    const roleOptions = reactive(roleCodeAndName().map(o => ({
      ...o,
      id: o.code
    })))
    const input = atom({ name: '' })
    const roleInput = atom(roleOptions[0])
    const ref = useRef()

    const handleInputChange = async (a, b, c, e) => {
      if (e?.type === 'input') {
        // 输入
        const value = e.target?.value
        input.value = value
        const users = (await getSearch(value)) || []
        options.splice(0, options.length, ...users)
      }
    }

    const handleAddMember = async () => {
      const { id } = input.value
      if (id) {
        try {
          props.onAddMember({
            userName: id,
            role: roleInput.value.code
          })
        } catch (e) {
          const msg = typeof e === 'object' ? e.message : e
          console.error(msg)
        }
      }
    }

    useViewEffect(() => {
      if (ref.current) {
        ref.current.querySelectorAll('input')[0].style.width = '80px'
        ref.current.querySelectorAll('input')[1].style.width = '64px'
      }
    })

    return (
      <div ref={ref} className={styles.add}>
        <selectBox inline inline-width="112px">
          <SelectHighIndex
            options={options}
            value={input}
            onChange={handleInputChange}
            renderOption={(option) => `${option.name} (${option.id})`}
            recommendMode
          />
        </selectBox>
        <selectBox inline inline-width="96px" >
          <SelectHighIndex
            options={roleOptions}
            value={roleInput}
          />
        </selectBox>
        <operation inline inline-margin-left='16px'><Add onClick={handleAddMember} /></operation>
        {/* <ButtonNew primary onClick={handleAddMember}>
          添加成员
        </ButtonNew> */}
      </div>
    )
  }
  AddPageMember.Style = (frag) => {
    const el = frag.root.elements
    el.operation.style({
      cursor: 'pointer'
    })
  }

  return createComponent(AddPageMember)
})())

function TaskListCom (props) {
  const { tasks, onDeleteTask, onRefresh } = props
  const showTaskDetail = atom(false)
  const taskId = atom('')

  const handleTaskClick = (task) => {
    taskId.value = task.taskId
    showTaskDetail.value = true
  }

  return (
    <container>
      {() => showTaskDetail.value ? <TaskDetail visible={showTaskDetail} taskId={taskId} deleteTask={onDeleteTask} refreshCb={onRefresh} /> : null}
      <block>
        <taskName>任务名</taskName>
        <span>状态</span>
        <span>执行人</span>
      </block>
      {() => tasks.map(task => {
        return (
          <block>
            <taskName onClick={() => handleTaskClick(task)}>{task.title}</taskName>
            <span>{task.status}</span>
            <span>{task.assignee}</span>
          </block>
        )
      })}
    </container>
  )
}

TaskListCom.Style = (frag) => {
  const el = frag.root.elements
  el.container.style({
    padding: '16px 0 0 24px'
  })
  el.block.style({
    borderBottom: '1px solid #eee',
    display: 'flex',
    padding: '0 0 8px 24px',
    margin: '0 0 8px',
    justifyContent: 'space-between'
  })
  const common = {
    display: 'inline-flex',
    alignItems: 'center',
    width: 200
  }
  el.span.style(common)
  el.taskName.style({
    ...common,
    cursor: 'pointer',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginRight: 10
  })
}

export const TaskList = createComponent(TaskListCom)

const PageDetail = createComponent((() => {
  function PageDetail (props) {
    const {
      page,
      onDeleteTask,
      onCreateTask,
      onRefresh
    } = props
    const version = useVersion()
    const showCreateTask = atom(false)

    const handleCreateTask = () => {
      showCreateTask.value = true
    }

    return (
      <pageDetail block>
        <contentRow block>
          <rowTitle block flex-display>
            <titleValue block flex-grow="1">成员信息</titleValue>
            <AddPageMember pageId={page.id} onAddMember={props.onAddMember}/>
          </rowTitle>
          <blocks block style={{ color: '#666' }}>
            {() => page.members && page.members.map((member, i, arr) => {
              return createElement('blockProcess', { key: member.id, block: true, 'flex-display': true, 'flex-align-items': 'center', 'block-padding': '16px 0  0 24px' }, [
                <processPre key="pre" >{member.user.displayName} ({member.user.name})</processPre>,
                <processStatus key="s1" >{member.roleDesc}</processStatus>,
                <processStatus key="s2" onClick={() => props.onRemovePageUser(member)} style={{ cursor: 'pointer' }}
                  inline inline-margin-left="8px" inline-height="16px"><Delete fill="#ff4d4f" /></processStatus>
              ])
            })}
          </blocks>
        </contentRow>

        <contentRow block>
          <rowTitle block flex-display >
            <titleValue block flex-grow="1">任务</titleValue>
            <ButtonNew onClick={handleCreateTask}>创建任务</ButtonNew>
          </rowTitle>
          <blocks block style={{ color: '#666' }}>
            <CreateTaskDialog
              visible={showCreateTask}
              labelType='page'
              submitCallback={onCreateTask}
            />
            {() => page.taskInfos.length ? <TaskList tasks={page.taskInfos} onDeleteTask={onDeleteTask} onRefresh={onRefresh} /> : null}
          </blocks>
        </contentRow>

        <contentRow block>
          <rowTitle block flex-display >
            <titleValue block flex-grow="1">页面进展</titleValue>
          </rowTitle>
          <blocks block style={{ color: '#666' }}>
            <blockProcess block>
              <processPre>设计</processPre>
              <processStatus>
              {() => page.processStatus[projectActionCode.design] ? <done style={{ color: '#52c41a' }}>已完成</done> : '未开始'}
              </processStatus>
            </blockProcess>
            <blockProcess block >
              <processPre>前端</processPre>
              <processStatus>
              {() => page.processStatus[projectActionCode.fe] ? <done style={{ color: '#52c41a' }}>已完成</done> : '未开始'}
              </processStatus>
            </blockProcess>
            <blockProcess block flex-display >
              <processPre>后端</processPre>
              <processStatus>
                {() => page.processStatus[projectActionCode.be] ? <done style={{ color: '#52c41a' }}>已完成</done> : '未开始'}
              </processStatus>
            </blockProcess>
          </blocks>
        </contentRow>
      </pageDetail>
    )
  }

  PageDetail.Style = (frag) => {
    const el = frag.root.elements

    el.blockProcess.style({
      padding: '16px 0 0 24px',
      display: 'flex'
    })
    el.processPre.style({
      flex: 1,
      fontSize: '16px'
    })
    el.processStatus.style({
      color: '#999',
      fontSize: '14px'
    })

    el.titleSub.style({
      color: '#999'
    })
    el.titleExtra.style({
      color: '#1890ff',
      textDecoration: 'underline',
      cursor: 'pointer'
    })
    const rowStyle = (s = {}) => ({
      marginBottom: '30px',
      ...s
    })
    const titleStyle = (s = {}) => ({
      ...s
    })
    el.contentRow.style(rowStyle())
    el.rowTitle.style(titleStyle())
  }

  return PageDetail
})())

export function handleTaskInfos(infos = {}) {
  const data = []
  Object.keys(infos).forEach(key => {
    data.push(infos[key])
  })
  return data
}

export function PageDetailBox (props) {
  const {
    pageId,
    data
  } = props

  const version = useVersion()

  const page = reactive({
    id: pageId,
    name: '',
    members: [],
    processStatus: {},
    tasks: '',
    taskInfos: handleTaskInfos(data.taskInfos)
  })
  const pageName = atom('')

  function fetchPageDetail () {
    product.getPageDetail(pageId).then(r => {
      if (r.page[0]) {
        pageName.value = r.page[0].name
        page.tasks = r.page[0].tasks || ''
        fetchTaskList()
      }
    })
  }

  useViewEffect(() => {
    fetchPageDetail()

    LogMessage.getPageProcess({ pageId }).then(r => {
      page.processStatus = r
    })

    getPageMember()
  })
  async function getPageMember () {
    const members = await UserPage.find({
      where: {
        page: pageId
      },
      fields: ['id', 'role', 'user']
    })
    const roleCodeMap = roleCodeAndName().reduce((p, n) => Object.assign(p, {
      [n.code]: n.name
    }), {})

    members.forEach(m => {
      m.roleDesc = roleCodeMap[m.role]
    })

    page.members = members
  }

  async function fetchTaskList () {
    const infos = await api.team.getTaskInfos({
      taskIds: page.tasks.split(','),
    })
    page.taskInfos = handleTaskInfos(infos)
  }

  async function removePageUser (member) {
    await UserPage.remove(member.id)
    getPageMember()
  }

  async function addMember ({ userName, role }) {
    await addMemberToPage({
      userName,
      role,
      pageId
    })
    getPageMember()
  }

  async function createTask (taskId) {
    TaskLink.create({
      taskId,
      versionId: version.value.id,
      pageId
    })
    await Page.update(pageId, { tasks: page.tasks.split(',').concat(taskId).filter(a => a).join(',') })
    fetchPageDetail()
  }

  async function deleteTask (taskId) {
    await Page.update(pageId, { tasks: page.tasks.split(',').filter(id => id !== taskId).join(',') })
    fetchPageDetail()
  }

  return (
    <PageDetail
      page={page}
      onRemovePageUser={removePageUser}
      onAddMember={addMember}
      onCreateTask={createTask}
      onDeleteTask={deleteTask}
      onRefresh={fetchPageDetail}
    />
  )
}

export function DataMonitor (props) {
  const { pageId } = props
  const page = reactive({
    id: pageId,
    pv: 0,
    error: 0,
    warning: 0
  })

  const stDate = new Date()
  stDate.setHours(0)
  stDate.setMinutes(0)
  stDate.setSeconds(0)

  const dateRange = reactive([
    stDate.getTime(),
    new Date().getTime()
  ])

  useViewEffect(() => {
    pvToday(pageId).then(pv => {
      page.pv = pv || 0
    })
    monitorToday(pageId).then(counts => {
      page.error = counts
    })
    logMessage.readMonitor({
      pageId,
      action: 'warning',
      format: 'acc',
      date: dateRange
    }).then(r => {
      page.warning = r.counts || 0
    })
  })

  return (
    <dataMonitor>
      <contentRow block block-margin-bottom='30px'>
          <rowTitle block flex-display >
            <titleValue block flex-grow="1" >流量</titleValue>
            <titleSub>时间：00:00 ~ {new Date().getHours()}:{String(new Date().getMinutes()).padStart(2, '0')}</titleSub>
          </rowTitle>
          <blocks block flex-display >
            <leftBlock block flex-grow="1" block-margin="16px" flex-display flex-direction-column>
              <blockLittleTitle
                block block-margin-bottom="8px"
                flex-grow="1"
                flex-align-content="center"
                style={{ textAlign: 'center', color: '#999' }}>pv</blockLittleTitle>
              <blockValue
                block
                style={{ textAlign: 'center', fontSize: '30px' }}>{() => page.pv}</blockValue>

            </leftBlock>
          </blocks>
        </contentRow>
        <contentRow block>
          <rowTitle block flex-display >
            <titleValue block flex-grow="1" >监控</titleValue>
            {/* 演示用，监控 */}
            <a href="https://radar-plus.corp.kuaishou.com/project/62605a1760/dashboard?env=h5" target="_blank" rel="noreferrer">地址</a>
          </rowTitle>
          <blocks block flex-display >
            <leftBlock block flex-grow="1" block-margin="16px" flex-display flex-direction-column>
              <blockLittleTitle
                block block-margin-bottom="8px"
                flex-grow="1"
                flex-align-content="center"
                style={{ textAlign: 'center', color: '#999' }}>error</blockLittleTitle>
              <blockValue
                block
                style={{ textAlign: 'center', fontSize: '30px' }}>{() => {
                  if (page.error > 0) {
                    return <span style={{ color: 'red' }} >{page.error}</span>
                  }
                  return page.error
                }}</blockValue>
            </leftBlock>
            <rightBlock
              block flex-grow="1" block-margin="16px" flex-display flex-direction-column style={{ borderLeft: '1px solid #eee' }}>
              <blockLittleTitle
                block block-margin-bottom="8px"
                flex-grow="1"
                flex-align-content="center"
                style={{ textAlign: 'center', color: '#999' }}>warning</blockLittleTitle>
              <blockValue
                block
                style={{ textAlign: 'center', fontSize: '30px' }}>{() => {
                  if (page.warning > 0) {
                    return <span style={{ color: '#faad14' }} >{page.warning}</span>
                  }
                  return page.warning
                }}</blockValue>
            </rightBlock>
          </blocks>
        </contentRow>
    </dataMonitor>
  )
}

import { reactive, useViewEffect, createElement, render, atom } from 'axii'
import { useRequest } from 'axii-components'
import {
  getGroupTasks
} from '@/services/team'
import TaskDetail from './TaskDetail.jsx'
import ButtonNew from '@/components/Button.new'
import CreateTaskDialog from './CreateTaskDialog'
import { useVersion } from '@/layouts/VersionLayout'
import BindGroupBlock from './BindGroupBlock'
import Spin from '@/components/Spin'

import styles from './style.module.less'

export default function TaskList () {
  const version = useVersion()

  const taskId = atom('')
  const showTaskDetail = atom(false)
  const visible = atom(false)

  const { data, run, loading } = useRequest(async () => {
    if (version.value?.product?.teamProjectId && version.value?.teamSectionId) {
      const data = await getGroupTasks({ projectId: version.value.product?.teamProjectId, groupKeys: [version.value.teamSectionId], pageNo: '1' })
      if (Array.isArray(data) && data.length > 0) {
        return {
          data: data[0].externalTaskModelPageInfo.list
        }
      }
    }
    return {
      data: []
    }
  })

  const handleCreate = async () => {
    visible.value = true
  }

  const handleTaskClick = async (id) => {
    taskId.value = id
    showTaskDetail.value = true
  }

  const renderList = () => {
    return (
      <div className={styles.list}>
        <div>
          <span className={styles.taskName}>任务名</span>
          <span>任务状态</span>
          <span>
            执行人
          </span>
          <span>任务分类</span>
          <span>截止时间</span>
          <span>标签</span>
        </div>
        <Spin show={loading}>
          {() => {
            if ((data.value || []).length > 0) {
              return <span>
                {() => data.value.map(task => <div className={styles.item}>
                  <span className={styles.taskName} onClick={() => handleTaskClick(task.taskId)}>{task.taskName}</span>
                  <span>{task.statusName}</span>
                  <span>
                <img src={task.assignee.avatar} alt='' />
                <span>{task.assignee.name}</span>
              </span>
                  <span>{task.taskClassName}</span>
                  <span>-</span>
                  <span>{() => (task.labelModels || []).length ? task.labelModels.map(tag => {
                    return <span className={styles.tag} style={{ background: tag.color }}>{tag.name}</span>
                  }) : '-'}</span>
                </div>)}
              </span>
            }
            return <div block block-height-200px block-line-height-200px className={styles.empty} >{() => loading.value ? null : '暂无数据'}</div>
          }}
        </Spin>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {
        () => version.value?.teamSectionId
          ? <div>
          <ButtonNew primary onClick={handleCreate}>创建任务</ButtonNew>
          {renderList()}
          {() => showTaskDetail.value ? <TaskDetail visible={showTaskDetail} taskId={taskId} deleteTask={run} refreshCb={run} /> : null}
          <CreateTaskDialog
            visible={visible}
            submitCallback={run}
          />
        </div>
          : <BindGroupBlock callBack={run} />
      }
    </div>
  )
}

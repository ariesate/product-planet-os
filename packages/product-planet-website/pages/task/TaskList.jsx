import { createElement, atom } from 'axii'
import { useRequest } from 'axii-components'
import TaskDetail from './TaskDetail.jsx'
import ButtonNew from '@/components/Button.new'
import CreateTaskDialog from './CreateTaskDialog'
import { useVersion } from '@/layouts/VersionLayout'
import Spin from '@/components/Spin'

import styles from './style.module.less'
import { Task } from '@/models'

export default function TaskList () {
  const version = useVersion()

  const taskId = atom('')
  const showTaskDetail = atom(false)
  const visible = atom(false)

  const { data, run, loading } = useRequest(async () => {
    const versionId = version.value?.id
    const productId = version.value?.product?.id
    if (productId && versionId) {
      const data = await Task.find({
        where: { productId, versionId },
        fields: [
          'id',
          'taskName',
          'statusName',
          'priorityName',
          'taskClassName',
          'labelModels',
          'assignee'
        ],
        orders: [['id', 'desc']]
      })
      return {
        data: data || []
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
          <span className={styles.assignee}>执行人</span>
          <span>任务分类</span>
          <span>标签</span>
        </div>
        <Spin show={loading}>
          {() => {
            if ((data.value || []).length > 0) {
              return (
                <span>
                  {() =>
                    data.value.map((task) => (
                      <div className={styles.item} key={task.id}>
                        <span
                          className={styles.taskName}
                          onClick={() => handleTaskClick(task.id)}>
                          {task.taskName}
                        </span>
                        <span>{task.statusName}</span>
                        <span className={styles.assignee}>
                          <img
                            src={
                              task.assignee.avatar ||
                              'https://avatars.githubusercontent.com/u/37143265?v=4'
                            }
                            alt=""
                          />
                          <span>{task.assignee.email}</span>
                        </span>
                        <span>{task.taskClassName}</span>
                        <span>
                          {() =>
                            (task.labelModels || []).length
                              ? task.labelModels.map((tag) => {
                                return (
                                    <span
                                      key={tag.name}
                                      className={styles.tag}
                                      style={{ background: tag.color }}>
                                      {tag.name}
                                    </span>
                                )
                              })
                              : '-'
                          }
                        </span>
                      </div>
                    ))
                  }
                </span>
              )
            }
            return (
              <div
                block
                block-height-200px
                block-line-height-200px
                className={styles.empty}>
                {() => (loading.value ? null : '暂无数据')}
              </div>
            )
          }}
        </Spin>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {() => (
        <div>
          <ButtonNew primary onClick={handleCreate}>
            创建任务
          </ButtonNew>
          {renderList()}
          {() =>
            showTaskDetail.value
              ? (
              <TaskDetail
                visible={showTaskDetail}
                taskId={taskId}
                deleteTask={run}
                refreshCb={run}
              />
                )
              : null
          }
          <CreateTaskDialog visible={visible} submitCallback={run} />
        </div>
      )}
    </div>
  )
}

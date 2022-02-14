/** @jsx createElement */
import {
  createElement,
  Fragment,
  createComponent,
  propTypes,
  reactive,
  atom
} from 'axii'
import { useRequest, message } from 'axii-components'
import Drawer from '@/components/Drawer'
import { UseCase, Page, TaskLink } from '@/models'
import TextButton from '@/components/TextButton'
import { historyLocation } from '@/router'
import { useVersion } from '@/layouts/VersionLayout'
import Spin from '@/components/Spin'
import api from '@/services/api'
import ButtonNew from '@/components/Button/index.jsx'
import { Dialog } from '@/components/Dialog/Dialog.jsx'
import EditTaskDialog from './EditTaskDialog'

function Detail({ detail = {}, relate }) {
  const version = useVersion()
  const productId = version.value.product.id

  const handleRelate = (relate) => {
    const path =
      relate.type === 'page'
        ? `/product/${productId}/version/${relate.versionId}/link`
        : `/product/${productId}/version/${relate.versionId}/case/${relate.useCaseId}?layout=hidden`
    historyLocation.goto(path)
  }

  return (
    <detail block>
      <name block block-margin-bottom-30px>
        {() => detail.title}
      </name>
      <status block block-margin-bottom-30px>
        <statusName>{() => detail.statusName}</statusName>
        <priority>{() => detail.priorityName}</priority>
      </status>
      <description block block-margin-bottom-30px>
        描述：
        <div inline>{() => detail.description || '无'}</div>
      </description>
      <createInfo block flex-display block-margin-bottom-30px>
        创建人：
        {() => (
          <span inline flex-display flex-align-items-center>
            <img src={detail.creator?.avatar} alt="" />
            <assignName>{detail.creator?.name || ''}</assignName>
          </span>
        )}
      </createInfo>
      <time block block-margin-bottom-30px>
        创建时间：{() => detail.createTime}
      </time>
      <assign block flex-display block-margin-bottom-30px>
        执行人：
        {() => (
          <span inline flex-display flex-align-items-center>
            <img src={detail.assignee?.avatar} alt="" />
            <assignName>{detail.assignee?.name || ''}</assignName>
          </span>
        )}
      </assign>
      <tags block flex-display block-margin-bottom-30px>
        标签：
        {() =>
          (detail.labelModels || []).length
            ? detail.labelModels.map((tag) => {
                return <tag style={{ background: tag.color }}>{tag.name}</tag>
              })
            : '无'
        }
      </tags>
      <relate block flex-display block-margin-bottom-30px>
        关联
        {() => (
          <span>
            {relate.type === 'page'
              ? '页面'
              : relate.type === 'case'
              ? '用例'
              : ''}
          </span>
        )}
        ：
        {() => {
          return Object.keys(relate).length ? (
            <TextButton primary onClick={() => handleRelate(relate)}>
              {relate.name}
            </TextButton>
          ) : (
            '无'
          )
        }}
      </relate>
    </detail>
  )
}

Detail.propTypes = {
  detail: propTypes.object.default(() => reactive({}))
}

Detail.Style = (fragments) => {
  const el = fragments.root.elements
  el.detail.style({
    padding: 20,
    width: '100%',
    boxSizing: 'border-box',
    wordBreak: 'break-all'
  })
  el.name.style({
    fontSize: 24,
    fontWeight: 500
  })
  el.statusName.style({
    borderRadius: 4,
    backgroundColor: 'rgba(41,122,204, .15)',
    color: '#0C63FA',
    marginRight: 10,
    padding: '4px 8px',
    fontSize: 14
  })
  el.priority.style({
    borderRadius: 4,
    backgroundColor: '#FCCA26',
    color: '#fff',
    padding: '4px 8px',
    fontSize: 14
  })
  el.textarea.style({
    width: '100%'
  })
  el.img.style({
    height: 24,
    width: 24,
    borderRadius: '50%',
    marginRight: 10
  })
  el.assignName.style({
    width: '100%'
  })
  el.tag.style({
    borderRadius: 12,
    padding: '2px 8px',
    color: '#fff',
    marginRight: 8,
    fontSize: 12
  })
}

const DetailComponent = createComponent(Detail)

const TaskDetail = (props) => {
  const { taskId, visible, deleteTask, refreshCb } = props

  const removeVisible = atom(false)
  const removeLoading = atom(false)
  const showEdit = atom(false)

  const { data, loading, run } = useRequest(async () => {
    const data = await api.team.getTaskInfo({ taskId: taskId.value })
    const relate = {}
    const links = await TaskLink.find({
      where: {
        taskId: taskId.value
      }
    })
    if (links.length > 0) {
      const link = links[0]
      if (link.useCaseId) {
        const useCase = await UseCase.find({
          where: { id: link.useCaseId }
        })
        if (Array.isArray(useCase) && useCase.length > 0) {
          Object.assign(relate, {
            ...link,
            type: 'case',
            name: useCase[0].name,
            id: useCase[0].id
          })
        }
      } else if (link.pageId) {
        const page = await Page.find({
          where: { id: link.pageId }
        })
        if (Array.isArray(page) && page.length > 0) {
          Object.assign(relate, {
            ...link,
            type: 'page',
            name: page[0].name,
            id: page[0].id
          })
        }
      }
    }
    return {
      data: {
        detail: data,
        relate
      }
    }
  })

  const handleDeleteTask = async () => {
    removeLoading.value = true
    await api.team.deleteTask({
      taskId: taskId.value
    })
    // Team 删除完任务后马上请求接口的话拿不到结果，得等会
    setTimeout(() => {
      deleteTask(taskId.value)
      removeLoading.value = false
      visible.value = false
    }, 1000)
  }

  const refresh = () => {
    refreshCb()
    run()
  }

  return (
    <Drawer
      visible={visible}
      maskCloseable
      extra={atom([
        <ButtonNew
          inline
          inline-margin-right-8px
          onClick={() => (showEdit.value = true)}>
          编辑任务
        </ButtonNew>,
        <ButtonNew danger onClick={() => (removeVisible.value = true)}>
          删除任务
        </ButtonNew>
      ])}>
      <Spin show={loading}>
        {() =>
          data.value ? (
            <>
              <DetailComponent
                detail={data.value?.detail}
                relate={data.value?.relate}
              />
              <EditTaskDialog
                visible={showEdit}
                data={data.value?.detail}
                submitCallback={refresh}
              />
            </>
          ) : null
        }
      </Spin>
      <Dialog
        title="二次确认"
        width="50%"
        loading={removeLoading}
        visible={removeVisible}
        onSure={handleDeleteTask}
        onCancel={() => (removeVisible.value = false)}
        sureProps={{ danger: true }}>
        <remind style={{ fontSize: '16px' }}>是否删除该任务</remind>
      </Dialog>
    </Drawer>
  )
}

TaskDetail.propTypes = {
  taskId: propTypes.string.default(() => atom('')),
  visible: propTypes.bool.default(() => atom(false)),
  deleteTask: propTypes.function.default(() => () => {})
}

export default createComponent(TaskDetail)

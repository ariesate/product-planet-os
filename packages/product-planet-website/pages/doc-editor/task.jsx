import { Task } from '@/models'
import { Task as Plugin } from 'doc-editor'

const task = ({ version }) => ({
  shortcut: 'CMD+SHIFT+K',
  class: Plugin,
  config: {
    preload: true,
    placeholder: '请输入任务名称或ID',
    fetchList: async (text) => {
      text = text.replace(/[\\%_]/g, '\\$&')
      const res = await Task.find({
        where: [
          {
            method: 'where',
            children: [
              ['taskName', 'like', `%${text}%`],
              ['versionId', '=', version.value.id]
            ]
          },
          {
            method: 'orWhere',
            children: [
              ['id', 'like', `%${text}%`],
              ['versionId', '=', version.value.id]
            ]
          }
        ],
        fields: ['id', 'taskName', 'createdAt'],
        limit: 5,
        orders: [['createdAt', 'desc']]
      })
      return res.map((e) => ({
        id: e.id,
        name: e.taskName,
        createdAt: e.createdAt
      }))
    },
    fetchItem: async (id) => {
      const item = await Task.findOne({
        where: {
          id
        },
        fields: {
          id: true,
          taskName: true,
          statusName: true,
          taskClassName: true,
          description: true,
          assignee: {
            name: true,
            avatar: true
          },
          creator: {
            name: true,
            avatar: true
          },
          priorityName: true,
          createdAt: true
        }
      })
      if (!item) {
        return null
      }
      return {
        id: item.id,
        name: item.taskName,
        status: item.statusName,
        type: item.taskClassName,
        assignee: item.assignee,
        description: item.description,
        createdAt: item.createdAt,
        creator: item.creator,
        priority: item.priorityName
      }
    },
    action: (item) => {
      console.log(item)
      window.open(
        `/product/${version.value.product.id}/version/${version.value.id}/task/${item.id}?layout=hidden`,
        '__blank'
      )
    }
  }
})

export default task

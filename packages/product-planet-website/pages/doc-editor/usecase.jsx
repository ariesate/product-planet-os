import { UseCase as Plugin } from 'doc-editor'
import { Action, Page, UseCase } from '@/models'

const usecase = ({ version }) => ({
  shortcut: 'CMD+SHIFT+U',
  class: Plugin,
  config: {
    preload: true,
    placeholder: '请输入用例名称或ID',
    fetchList: async (text) => {
      text = text.replace(/[\\%_]/g, '\\$&')
      return UseCase.find({
        where: [
          {
            method: 'where',
            children: [
              ['name', 'like', `%${text}%`],
              ['version', '=', version.value.id]
            ]
          },
          {
            method: 'orWhere',
            children: [
              ['id', 'like', `%${text}%`],
              ['version', '=', version.value.id]
            ]
          }
        ],
        fields: ['id', 'name', 'createdAt'],
        limit: 5,
        orders: [['createdAt', 'desc']]
      })
    },
    fetchItem: async (id) => {
      const item = await UseCase.findOne({
        where: {
          id
        },
        fields: ['id', 'name', 'createdAt']
      })
      if (!item) {
        return {}
      }
      const props = {
        id: item.id,
        name: item.name,
        createdAt: new Date(item.createdAt * 1000).toLocaleString()
      }
      const action = await Action.findOne({
        where: {
          useCase: item.id,
          destinationType: 'page'
        },
        fields: ['destinationValue']
      })
      if (!action?.destinationValue) {
        return props
      }
      const page = await Page.findOne({
        where: {
          id: action.destinationValue
        },
        fields: {
          baseStatus: {
            proto: true
          }
        }
      })
      if (!page?.baseStatus?.proto) {
        return props
      }
      return {
        ...props,
        image: page.baseStatus.proto
      }
    },
    action: (item) => {
      console.log(item)
      window.open(
        `/product/${version.value.product.id}/version/${version.value.id}/case/${item.id}?layout=hidden`,
        '__blank'
      )
    }
  }
})

export default usecase

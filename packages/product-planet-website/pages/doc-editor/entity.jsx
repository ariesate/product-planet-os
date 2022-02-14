import { Entity as Plugin } from 'doc-editor'
import { Entity } from '@/models'

const usecase = ({ version }) => ({
  shortcut: 'CMD+SHIFT+E',
  class: Plugin,
  config: {
    placeholder: '请输入用例名称或ID',
    fetchList: async (text) => {
      text = text.replace(/[\\%_]/g, '\\$&')
      return Entity.find({
        where: [
          {
            method: 'where',
            children: [
              ['name', 'like', `%${text}%`],
              ['product', '=', version.value.product.id]
            ]
          },
          {
            method: 'orWhere',
            children: [
              ['id', 'like', `%${text}%`],
              ['product', '=', version.value.product.id]
            ]
          }
        ],
        fields: ['id', 'name', 'createdAt'],
        limit: 5,
        orders: [['createdAt', 'desc']]
      })
    },
    fetchItem: async (id) => {
      const item = await Entity.findOne({
        where: {
          id
        },
        fields: {
          id: true,
          name: true,
          fields: {
            id: true,
            name: true,
            type: true
          }
        }
      })
      return item || {}
    },
    action: (item) => {
      console.log(item)
    }
  }
})

export default usecase

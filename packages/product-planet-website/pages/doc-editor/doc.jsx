import { Doc as Plugin } from 'doc-editor'
import { Document } from '@/models'

const doc = ({ version }) => ({
  class: Plugin,
  config: {
    preload: true,
    placeholder: '请输入文档名称或ID',
    fetchList: async (text) => {
      text = text.replace(/[\\%_]/g, '\\$&')
      return Document.find({
        where: text
          ? [
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
            ]
          : { product: version.value.product.id },
        fields: ['id', 'name', 'createdAt'],
        limit: 5,
        orders: [['createdAt', 'desc']]
      })
    },
    fetchItem: async (id) => {
      const item = await Document.findOne({
        where: {
          id
        },
        fields: {
          id: true,
          name: true,
          createdAt: true,
          creator: {
            avatar: true,
            displayName: true
          }
        }
      })
      if (!item) {
        return {}
      }
      const props = {
        id: item.id,
        name: item.name,
        creator: item.creator,
        createdAt: new Date(item.createdAt * 1000).toLocaleString()
      }
      return {
        ...props
      }
    },
    action: (item) => {
      window.open(
        `/product/${version.value.product.id}/version/${version.value.id}/doc/${item.id}`,
        '_blank'
      )
    }
  }
})

export default doc

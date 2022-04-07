import { createElement } from 'axii'
import { createCardTool } from 'doc-editor'
import { LocalMeta } from '@/models'
import JsonEditor from '@/components/JsonEditor'

const meta = ({ version }) =>
  createCardTool({
    title: 'Metadata',
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.3333 3.99998C13.3333 2.55465 10.8913 1.33331 8 1.33331C5.10867 1.33331 2.66667 2.55465 2.66667 3.99998V5.33331C2.66667 6.77865 5.10867 7.99998 8 7.99998C10.8913 7.99998 13.3333 6.77865 13.3333 5.33331V3.99998ZM8 12.6666C5.10867 12.6666 2.66667 11.4453 2.66667 9.99998V12C2.66667 13.4453 5.10867 14.6666 8 14.6666C10.8913 14.6666 13.3333 13.4453 13.3333 12V9.99998C13.3333 11.4453 10.8913 12.6666 8 12.6666Z"/>
    <path d="M13.3333 6.66669C13.3333 8.11202 10.8913 9.33335 8 9.33335C5.10867 9.33335 2.66667 8.11202 2.66667 6.66669V8.66669C2.66667 10.112 5.10867 11.3334 8 11.3334C10.8913 11.3334 13.3333 10.112 13.3333 8.66669V6.66669Z"/>
    </svg>
    `,
    preload: true,
    placeholder: '请输入元数据名称或ID',
    style: { border: 'none', boxShadow: 'none' },
    fetchList: async (text) => {
      text = text.replace(/[\\%_]/g, '\\$&')
      return LocalMeta.find({
        where: text
          ? [
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
            ]
          : { version: version.value.id },
        fields: ['id', 'name', 'type', 'createdAt'],
        limit: 5,
        orders: [['createdAt', 'desc']]
      })
    },
    fetchItem: async (id) => {
      const item = await LocalMeta.findOne({
        where: {
          id
        },
        fields: ['id', 'name', 'type', 'content', 'editor']
      })
      return item || {}
    },
    renderListItem: (item) => {
      return item.name
    },
    renderDetail: (item) => {
      if (item == null) {
        return null
      }
      return (
        <container>
          {() => {
            if (item.type === 'map') {
              return (
                <div block block-width-650px block-padding="0 0 10px 0" style={{ overflowX: 'scroll' }}>
                  <JsonEditor
                    json={item.content ? JSON.parse(item.content) : {}}
                  />
                </div>
              )
            }
            return (
              <iframe
                onLoad={(e) => {
                  e.target.contentWindow.postMessage(
                    { type: 'setup', content: item.content },
                    window.location.origin
                  )
                }}
                style={{ border: 'none' }}
                width="650"
                height="320"
                src={`/editor.html?id=${item.id}&type=${item.type}&name=${item.name}&editor=${item.editor}`}
              />
            )
          }}
          <div
            block
            block-font-size-12px
            block-line-height-20px
            style={{ color: '#c4c4c4', textAlign: 'right' }}>
            元数据：{item.name}
          </div>
        </container>
      )
    }
  })

export default meta

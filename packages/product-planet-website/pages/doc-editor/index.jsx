import { createElement, createComponent, atom, atomComputed } from 'axii'
import { useRequest } from 'axii-components'
import { historyLocation } from '@/router'
import { Document } from '@/models'
import Editor from './Editor'
import Spin from '@/components/Spin'
import NotFound from './NotFound'
import { useVersion } from '@/layouts/VersionLayout'
import useStore from '@/hooks/useStore'

const EmptyData = {}

/**
 * @type {import('axii').FC}
 */
function DocEditor () {
  // NOTE: `window.history.back()`不会触发更新
  const docId = atomComputed(() => historyLocation.pathname.split('/').pop())
  const doc = atom(null)
  const version = useVersion()
  const userId = useStore((state) => state.UserInfo.id)
  const editing = atomComputed(() => docId.value === 'new')

  const fetchDoc = (id) => {
    return Document.findOne({
      where: {
        id
      },
      fields: ['id', 'name', 'content']
    })
  }

  const { loading } = useRequest(
    async () => {
      if (!docId.value || docId.value === 'new') {
        return new Document({
          name: '新建文档',
          content: JSON.stringify({
            blocks: [{ type: 'paragraph', data: { text: '请输入文档内容...' } }]
          })
        })
      }
      const res = await fetchDoc(docId.value)
      // NOTE: useRequest issue
      return res || EmptyData
    },
    {
      data: doc,
      processResponse: ({ data }, res) => {
        if (res === EmptyData) {
          data.value = null
        } else {
          data.value = res
        }
      }
    }
  )

  const handleCancel = () => {
    if (!doc.value?.id) {
      window.history.back()
    }
  }

  const handleSave = async (name, content) => {
    if (!doc.value.id) {
      const id = await Document.create({
        name,
        content,
        product: version.value.product.id,
        creator: userId.value
      })
      // NOTE: replace
      window.history.replaceState(
        undefined,
        undefined,
        `/product/${version.value.product.id}/version/${version.value.id}/doc/${id}`
      )
    } else {
      await Document.update(doc.value.id, { name, content })
      // NOTE: 此处若重新获取doc会造成渲染问题
    }
  }

  return (
    <container block>
      {() =>
        loading.value
          ? (
          <div block block-margin="40px 20px 80px">
            <Spin>加载中</Spin>
          </div>
            )
          : doc.value
            ? (
          <Editor
            doc={doc.value}
            onSave={handleSave}
            onCancel={handleCancel}
            editing={editing}
          />
              )
            : (
          <NotFound />
              )
      }
    </container>
  )
}

DocEditor.Style = (frag) => {}

export default createComponent(DocEditor)

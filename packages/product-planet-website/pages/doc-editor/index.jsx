import 'doc-editor/style.css'
import {
  createElement,
  createComponent,
  atom,
  atomComputed,
  useRef
} from 'axii'
import { useRequest } from 'axii-components'
import { historyLocation } from '@/router'
import { Document } from '@/models'
import Editor from './Editor'
import Spin from '@/components/Spin'
import NotFound from './NotFound'
import { useVersion } from '@/layouts/VersionLayout'
import useStore from '@/hooks/useStore'
import Button from '@/components/Button'

const EmptyData = {}

/**
 * @type {import('axii').FC}
 */
function DocEditor () {
  // NOTE: `window.history.back()`不会触发更新
  const docId = atomComputed(
    () => historyLocation.pathname.split('/')[6] || null
  )
  const doc = atom(null)
  const version = useVersion()
  const userId = useStore((state) => state.UserInfo.id)
  const editing = atomComputed(() => docId.value === 'new')
  const editor = useRef()

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
      if (docId.value == null) {
        return EmptyData
      }
      if (docId.value === 'new') {
        return new Document({
          name: '新建文档',
          content: JSON.stringify({
            blocks: [{ type: 'paragraph', data: { text: '' } }]
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
      // window.history.back()
      historyLocation.goto(
        `/product/${version.value.product.id}/version/${version.value.id}/doc`
      )
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
      // window.history.replaceState(
      //   undefined,
      //   undefined,
      //   `/product/${version.value.product.id}/version/${version.value.id}/doc/${id}`
      // )
      historyLocation.goto(
        `/product/${version.value.product.id}/version/${version.value.id}/doc/${id}`
      )
    } else {
      await Document.update(doc.value.id, { name, content })
      // NOTE: 此处若重新获取doc会造成渲染问题
    }
  }

  return (
    <container
      block
      block-width="100%"
      block-height="100%"
      block-min-width-1120px>
      <toolBar
        block
        block-with="100%"
        block-height="60px"
        block-padding="0 180px"
        flex-display
        flex-justify-content-flex-end
        flex-align-items-center>
        <Button
          block
          block-display-none={editing}
          onClick={() => {
            editing.value = true
          }}>
          编辑
        </Button>
        <Button
          block
          block-display-none={atomComputed(() => !editing.value)}
          onClick={async () => {
            await editor.current.refresh()
            handleCancel()
            editing.value = false
          }}>
          取消
        </Button>
        <Button
          primary
          block
          block-display-none={atomComputed(() => !editing.value)}
          block-margin-left-16px
          onClick={async () => {
            const { title, data } = await editor.current.save()
            await handleSave(title, data)
            editing.value = false
          }}>
          保存
        </Button>
      </toolBar>
      {() =>
        loading.value
          ? (
          <div
            block
            block-height="100%"
            flex-display
            flex-justify-content-center
            flex-align-items-center>
            <Spin />
          </div>
            )
          : doc.value
            ? (
          <Editor doc={doc.value} editing={editing} ref={editor} />
              )
            : (
          <NotFound />
              )
      }
    </container>
  )
}

DocEditor.Style = (frag) => {
  frag.root.elements.container.style({
    overflowY: 'hidden'
  })
  frag.root.elements.toolBar.style({
    borderBottom: '1px solid #e5e5e5'
  })
}

export default createComponent(DocEditor)

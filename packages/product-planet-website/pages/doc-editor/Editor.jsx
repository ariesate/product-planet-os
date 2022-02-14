import 'doc-editor/style.css'
import {
  createElement,
  createComponent,
  atom,
  atomComputed,
  propTypes,
  useRef,
  computed
} from 'axii'
import RichEditor from 'doc-editor'
import Button from '@/components/Button'
import { useVersion } from '@/layouts/VersionLayout'
import usecase from './usecase'
import entity from './entity'
import api from '@/services/api'

/**
 * @type {import('axii').FC}
 */
function Editor ({ doc, editing, onSave, onCancel }) {
  const editor = useRef()
  const version = useVersion()
  const context = { version }

  const data = computed(() => JSON.parse(doc.content))
  const name = atomComputed(() => doc.name)

  const handleSave = async () => {
    await editor.current.save()
    console.log(data)
    onSave?.(name.value, JSON.stringify(data))
    editing.value = false
  }

  return (
    <container
      block
      block-margin="40px 20px 80px"
      flex-display
      flex-align-items-center
      flex-direction-column>
      <toolbar
        block
        block-width-960px
        block-margin-bottom-16px
        block-position-relative
        flex-display
        flex-align-items-center
        flex-justify-content-space-between>
        <back
          block
          block-font-size-16px
          block-line-height-16px
          onClick={() => {
            window.history.back()
          }}>
          返回
        </back>
        {() => (
          <input
            block
            readOnly={!editing.value}
            block-position-absolute
            block-left="50%"
            value={name}
            placeholder="请输入文档名称"
            onChange={(e) => {
              name.value = e.target.value
            }}
          />
        )}
        <div block flex-display flex-justify-content-flex-end>
          <Button
            onClick={async () => {
              if (editing.value) {
                await editor.current.refresh()
              }
              if (!editing.value) {
                onCancel?.()
              }
              editing.value = !editing.value
            }}>
            {() => (editing.value ? '取消' : '编辑')}
          </Button>
          {() =>
            !editing.value
              ? null
              : (
              <Button primary block block-margin-left-16px onClick={handleSave}>
                保存
              </Button>
                )
          }
        </div>
      </toolbar>
      <content
        block
        block-padding="70px 50px"
        block-min-height-1123px
        block-width-960px
        block-font-size-16px>
        <RichEditor
          ref={editor}
          placeholder="请输入文档内容..."
          readOnly={atomComputed(() => !editing.value)}
          data={data}
          extraTools={{
            usecase: usecase(context),
            entity: entity(context)
          }}
          tools={{
            image: {
              config: {
                uploader: {
                  uploadByFile: async (data) => {
                    const formData = new FormData()
                    formData.append('file', data)
                    try {
                      const file = await api.docs.uploadByFile(formData)
                      return {
                        success: 1,
                        file
                      }
                    } catch (error) {
                      return {
                        success: 0
                      }
                    }
                  },
                  uploadByUrl: async (url) => {
                    return {
                      success: 1,
                      file: {
                        url
                      }
                    }
                  }
                }
              }
            }
          }}
        />
      </content>
    </container>
  )
}

Editor.Style = (frag) => {
  frag.root.elements.content.style({
    background: '#fff',
    boxSizing: 'border-box'
  })
  frag.root.elements.input.style({
    fontSize: '24px',
    fontWeight: '500',
    transform: 'translateX(-50%)',
    border: 'none',
    outline: 'none',
    background: 'none',
    textAlign: 'center'
  })
  frag.root.elements.toolbar.style({
    boxSizing: 'border-box'
  })
  frag.root.elements.back.style(({ editing }) => ({
    textDecoration: 'underline',
    cursor: 'pointer',
    visibility: editing.value ? 'hidden' : 'visible'
  }))
}

Editor.propTypes = {
  editing: propTypes.bool.default(() => atom(false)),
  doc: propTypes.object.isRequired
}

export default createComponent(Editor)

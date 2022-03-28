import 'doc-editor/style.css'
import {
  createElement,
  createComponent,
  atom,
  atomComputed,
  propTypes,
  computed,
  useImperativeHandle,
  useRef
} from 'axii'
import RichEditor from 'doc-editor'
import { useVersion } from '@/layouts/VersionLayout'
import api from '@/services/api'
import usecase from './usecase'
import entity from './entity'
import task from './task'
import meta from './meta'
import markup from './markup'
import docPlugin from './doc'

/**
 * @type {import('axii').FC}
 */
function Editor ({ doc, editing, ref, onChange }) {
  const version = useVersion()
  // NOTE: team无搜索任务接口，先做前端搜索分页保持交互统一
  const tasks = atom(null)
  const context = { version, tasks }
  const editor = useRef()

  const data = computed(() => JSON.parse(doc.content))
  const name = atomComputed(() => doc.name)

  if (ref) {
    useImperativeHandle(ref, () => ({
      save: async () => {
        await editor.current.save()
        return {
          title: name.value,
          data: JSON.stringify(data)
        }
      },
      refresh: async () => {
        await editor.current.refresh()
      }
    }))
  }

  const handleChange =
    !onChange
      ? undefined
      : async (api) => {
        const res = await api.saver.save()
        onChange(
          JSON.stringify({
            blocks: res.blocks,
            time: res.time,
            version: res.version
          })
        )
      }

  return (
    <container
      block
      block-position-relative
      block-height="100%"
      flex-display
      flex-direction-column
      flex-align-items-center>
      <content
        block
        block-margin="10px 40px 80px"
        block-padding="70px 50px"
        block-width-860px
        block-font-size-16px>
        <div
          block
          block-margin-bottom-16px
          flex-display
          flex-align-items-center
          flex-justify-content-center>
          <input
            block
            readOnly={atomComputed(() => !editing.value)}
            value={name}
            placeholder="请输入文档名称"
            onChange={(e) => {
              name.value = e.target.value
            }}
          />
        </div>
        <RichEditor
          ref={editor}
          placeholder="请输入文档内容..."
          readOnly={atomComputed(() => !editing.value)}
          data={data}
          onChange={handleChange}
          extraTools={{
            usecase: usecase(context),
            entity: entity(context),
            task: task(context),
            meta: meta(context),
            markup: markup(context),
            doc: docPlugin(context)
          }}
          tools={{
            link: {
              config: {
                endpoint: '/api/link/getLinkInfo'
              }
            },
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
  frag.root.elements.container.style({
    overflowY: 'auto',
    boxSizing: 'border-box'
  })
  frag.root.elements.content.style({
    background: '#fff',
    flexBasis: '1120px',
    flexGrow: 1,
    flexShrink: 0
  })
  frag.root.elements.input.style({
    fontSize: '24px',
    fontWeight: '500',
    border: 'none',
    outline: 'none',
    background: 'none',
    textAlign: 'center'
  })
}

Editor.propTypes = {
  editing: propTypes.bool.default(() => atom(false)),
  doc: propTypes.object.isRequired,
  onChange: propTypes.function
}

Editor.forwardRef = true

export default createComponent(Editor)

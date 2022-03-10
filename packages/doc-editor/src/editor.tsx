import {
  atom,
  batchOperation,
  createComponent,
  createElement,
  FC,
  propTypes,
  reactive,
  Ref,
  useImperativeHandle,
  useRef,
  useViewEffect,
  watch
} from 'axii'
import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import Table from '@editorjs/table'
import Marker from '@editorjs/marker'
import List from '@editorjs/nested-list'
import Checklist from '@editorjs/checklist'
import Link from '@editorjs/link'
import Underline from '@editorjs/underline'
import Image from '@editorjs/image'
import { EditorConfig, EditorPlugins } from './config'
import Figma from './plugins/figma'
import IFrame from './plugins/iframe'
import Strike from './plugins/strike'

export interface EditorProps extends EditorConfig {
  tools?: EditorPlugins
  extraTools: Record<string, any>
  autosave?: boolean
}
export interface EditorInstance {
  save(): Promise<void>
}
interface EditorPropsWidthRef extends EditorProps {
  ref?: Ref<EditorInstance>
}
const Editor: FC<EditorPropsWidthRef> = ({
  autosave,
  autofocus,
  placeholder,
  hideToolbar,
  minHeight,
  logLevel,
  readOnly,
  data,
  tools = {},
  extraTools = {},
  ref,
  onReady,
  onChange
}) => {
  const root = useRef<HTMLDivElement>()
  const editor = useRef<EditorJS>()

  if (ref) {
    useImperativeHandle(ref, () => ({
      save: async () => {
        const res = await editor.current?.save()
        batchOperation(data, (data) => {
          data.blocks = res.blocks as any
          if (!data.blocks.length) {
            // NOTE: https://github.com/codex-team/editor.js/pull/1741
            data.blocks = [{ type: 'paragraph', data: { text: '空文档' } }]
          }
          data.time = res.time
          data.version = res.version
        })
      },
      refresh: async () => {
        await editor.current?.render(data)
      },
      focus: (atend?: boolean) => {
        return editor.current?.focus(atend)
      },
      clear: () => {
        editor.current?.clear()
      }
    }))
  }

  watch(
    () => readOnly.value,
    () => {
      editor.current?.readOnly.toggle(readOnly.value)
    }
  )

  useViewEffect(() => {
    // NOTE: 此组件rerender会造成ref丢失而editorjs无法重新实例化
    editor.current = new EditorJS({
      holder: root.current,
      autofocus: autofocus.value,
      placeholder: placeholder.value,
      hideToolbar: hideToolbar.value,
      minHeight: minHeight.value,
      logLevel: logLevel.value as any,
      readOnly: readOnly.value,
      data,
      tools: {
        header: {
          class: Header,
          ...tools.header
        },
        checklist: Checklist,
        link: {
          class: Link,
          ...tools.link
        },
        marker: Marker,
        strike: Strike,
        table: {
          class: Table,
          ...tools.table
        },
        list: List,
        underline: Underline,
        image: {
          class: Image,
          ...tools.image
        },
        iframe: IFrame,
        figma: Figma,
        ...extraTools
      },
      onChange: (api) => {
        if (autosave.value) {
          api.saver.save().then((res) => {
            batchOperation(data, (data) => {
              data.blocks = res.blocks as any
              data.time = res.time
              data.version = res.version
            })
          })
        }
        onChange?.()
      },
      onReady
    })
    return () => {
      typeof editor.current?.destroy === 'function' && editor.current.destroy()
      editor.current = null
    }
  })
  return <div ref={root} />
}

Editor.forwardRef = true

Editor.propTypes = {
  data: propTypes.object.default(() => reactive({})),
  autosave: propTypes.bool.default(() => atom(false)),
  readOnly: propTypes.bool.default(() => atom(false)),
  autofocus: propTypes.bool.default(() => atom(false)),
  placeholder: propTypes.string.default(() => atom(undefined)),
  hideToolbar: propTypes.bool.default(() => atom(false)),
  minHeight: propTypes.number.default(() => atom(undefined)),
  logLevel: propTypes.string.default(() => atom(undefined)),
  onReady: propTypes.function,
  onChange: propTypes.function
}

export default createComponent<EditorProps>(Editor)

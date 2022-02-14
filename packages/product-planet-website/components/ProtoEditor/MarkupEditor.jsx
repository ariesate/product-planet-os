/** @jsx createElement */
import { createElement, atomComputed, useRef, createComponent } from 'axii'
import { Button, Input } from 'axii-components'
import ListPlugin from '@editorjs/nested-list'
import Editor from '@/components/editorjs/index.js'
import StatusPlugin from './StatusPlugin'

export const EDITOR_ID = 'markup-editor'

const MarkupEditor = ({ pin, onSave, onCancel, onStatusAdd, defaultName }) => {
  const name = atomComputed(() => {
    const name = pin.value?.markup?.name
    return name || defaultName.value
  })
  const content = atomComputed(() => {
    const content = pin.value?.markup?.content
    return content ? JSON.parse(content) : { blocks: [{ type: 'paragraph', data: { text: '' } }] }
  })
  const editorRef = useRef()

  const save = async (needClose) => {
    const content = await editorRef.current?.save()
    const data = pin.value
    const markup = data.markup || {}
    const newMarkup = {
      ...markup,
      name: name.value,
      content: JSON.stringify(content),
    }

    onSave(newMarkup, data, needClose)
  }

  // const resourceDataById = {}

  // const collectResource = (id, data) => {
  //   resourceDataById[id] = data
  // }

  StatusPlugin.onWrap = (statusName) => {
    save(false)
      .then(() => onStatusAdd(statusName))
  }
  const tools = {
    table: {
      class: Editor.TablePlugin
    },
    status: StatusPlugin,
    list: {
      class: ListPlugin,
      inlineToolbar: true
    }
    // image: {
    //   class: Editorjs.ImageEditorPlugin,
    //   config: {
    //     collectResource
    //   }
    // }
  }

  return <layer block block-width-300px block-padding-24px block-position-absolute id={EDITOR_ID} onClick={e => {
    e.stopPropagation()
  }}>
    <name block block-margin-bottom-16px flex-display flex-align-items-center>
      {/* <label>标注名：</label> */}
      <Input layout:flex-grow-1 value={name} />
    </name>
    <editor block block-padding-8px>
      <Editor ref={editorRef} data={content} tools={tools} placeholder="添加标注" />
    </editor>
    <actions block block-margin-top-16px flex-display flex-align-items-center flex-justify-content-flex-end>
      <Button layout:block-margin-right-8px onClick={onCancel}>取消</Button>
      <Button primary onClick={() => save(true)}>保存</Button>
    </actions>
  </layer>
}

MarkupEditor.Style = (frag) => {
  const ele = frag.root.elements
  ele.layer.style(({ isVisible, status, pin, scale }) => {
    const style = {
      boxShadow: '0 3px 10px 0 rgb(46 47 48 / 15%)',
      borderRadius: 4,
      background: 'white',
      zIndex: 6
    }
    const pinVal = pin.value
    const stautsVal = status.value
    // eslint-disable-next-line multiline-ternary
    const position = !pinVal ? {} : {
      left: ((stautsVal.x || 0) + pinVal.x + pinVal.width + 24) * scale.value.id,
      top: ((stautsVal.y || 0) + pinVal.y) * scale.value.id
    }
    const display = isVisible.value ? { display: 'block' } : { display: 'none' }

    return { ...style, ...position, ...display }
  })
  ele.label.style({
    color: '#666'
  })
  ele.editor.style({
    border: '1px solid #dcddde'
  })
}

export default createComponent(MarkupEditor)

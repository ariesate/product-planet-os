import { createElement } from 'axii'
import parseSearch from './tools/parseSearch'

const coolEditors = ['code', 'sheet', 'image', 'doc']

const sendMessage = (data) => {
  window.parent.postMessage(data, '*')
}

// TODO: 容错
async function setup() {
  const { editor: customEditor, type, name, id } = parseSearch()
  const content = window.localStorage.getItem('pp-meta-data')

  const editor = coolEditors.includes(type) ? `https:/unpkg.com/@myeditorcool/${type}editor@latest/dist/${type}editor.es.js` : customEditor

  const loading = document.getElementById('loading')
  loading.innerText = `加载编辑器: ${editor}`

  const { emptyContent, setup, render } = await import(editor)

  loading.innerText = render ? '' : '加载失败，请重试'
  const props = setup
    ? await setup(content || emptyContent, '', {})
    : { content }

  const onChange = () => { }

  // 暂时先搞个 js 编辑器吧
  const title = type === 'code' ? `${name}.js` : name
  props.content = props.content || ''

  const onSave = (data, options) => {
    let content = data
    if (options?.encoding === 'base64') {
      content = `data:image/png;base64,${content}`
    }
    sendMessage({ id, content })
  }

  render(
    { ...props, title, onSave, onChange },
    document.getElementById('root')
  )
}

setup()

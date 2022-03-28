import parseSearch from './tools/parseSearch'

const coolEditors = ['code', 'sheet', 'image', 'doc']

const sendMessage = (data) => {
  window.parent.postMessage(data, window.location.origin)
}

window.addEventListener('message', ({ data }) => {
  if (data.type === 'setup') {
    setup(data.content)
  }
})

// TODO: 容错
async function setup (content) {
  const { editor: customEditor, type, name, id, lang } = parseSearch()
  const editor = coolEditors.includes(type)
    ? `https:/unpkg.com/@myeditorcool/${type}editor@latest/dist/${type}editor.es.js`
    : customEditor

  const loading = document.getElementById('loading')
  loading.innerText = `加载编辑器: ${editor}`

  const { emptyContent, setup, render } = await import(editor)

  loading.innerText = render ? '' : '加载失败，请重试'
  const props = setup
    ? await setup(content || emptyContent, '', {})
    : { content }

  const onChange = () => {}

  const title = type === 'code' ? `${name}.${lang || 'js'}` : name
  props.content = props.content || ''

  const onSave = (data, options) => {
    let content = data
    if (options?.encoding === 'base64') {
      content = `data:image/png;base64,${content}`
    }
    sendMessage({ type: 'save', id, content })
  }

  window.addEventListener('message', ({ data }) => {
    if (data.type === 'save') {
      // NOTE: 编辑器没有保存的handler，只能通过快捷键触发
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 's',
          code: 'KeyS',
          metaKey: true,
          keyCode: 83
        })
      )
    }
  })

  render({ ...props, title, onSave, onChange }, document.getElementById('root'))
}

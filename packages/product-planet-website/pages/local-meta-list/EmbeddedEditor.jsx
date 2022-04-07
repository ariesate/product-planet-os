import {
  createElement,
  createComponent,
  atomComputed,
  useViewEffect,
  useRef,
  useImperativeHandle
} from 'axii'

/**
 * @type {import('axii').FC}
 */
function EmbeddedEditor ({ item, editing, onUpdate, ref }) {
  const url = atomComputed(
    () =>
      `/editor.html?id=${item.id}&type=${item.type}&name=${item.name}&editor=${item.editor}`
  )
  const node = useRef()

  if (ref) {
    useImperativeHandle(ref, () => ({
      save: () => {
        node.current?.postMessage(
          { type: 'save' },
          window.location.origin
        )
      }
    }))
  }

  useViewEffect(() => {
    const type = 'message'
    const handler = async ({ data }) => {
      // eslint-disable-next-line eqeqeq
      if (data.id != item.id) {
        return
      }
      if (data.type === 'save' && editing.value) {
        await onUpdate({ content: data.content })
      }
    }
    window.addEventListener(type, handler)
    return () => window.removeEventListener(type, handler)
  })

  return (
    <iframe
      src={url}
      onLoad={(e) => {
        node.current = e.target.contentWindow
        e.target.contentWindow.postMessage(
          { type: 'setup', content: item.content },
          window.location.origin
        )
      }}
      width="100%"
      height="400"
      frameBorder="0"
    />
  )
}

EmbeddedEditor.forwardRef = true

export default createComponent(EmbeddedEditor)

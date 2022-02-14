import { atom, createElement, Fragment, reactive } from 'axii'
import Drawer from '.'

const DrawerExample = () => {
  const visible = atom(false)
  const title = atom('title')
  const extra = reactive([
    <button key={'close'}>close</button>,
    <button key={'anyway'}>anyway</button>
  ])
  return (
    <>
      <button onClick={() => { visible.value = true }}>open drawer</button>

      <Drawer
        title={title}
        visible={visible}
        extra={atom(extra)}
        width={atom(800)}
      >
        123
      </Drawer>
    </>
  )
}

export default DrawerExample

import {
  createComponent,
  createElement, atomComputed, Fragment, propTypes, atom
} from 'axii'
import { useLayer } from 'axii-components'

function Mask ({ dismissible, visible, children }) {
  console.log('[Mask] visible: ', visible.value)
  const style = atomComputed(() => ({
    left: 0,
    top: 0,
    height: '100vh',
    width: '100vw',
    display: visible.value ? 'flex' : 'none',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'rgba(0,0,0, .2)'
  }))

  const handleClose = (e) => {
    if (!dismissible.value) {
      return
    }
    e.stopPropagation()
    visible.value = false
  }

  const { node } = useLayer(
    <>
      <div style={style} onClick={handleClose}></div>
      <maskChildren >{() => (visible.value ? children : null)}</maskChildren>
    </>,
    {
      visible: atom(true),
      getContainerRect () {
        return { zIndex: 11 } // @TODO：要比顶部(100)和左侧栏(10)大
      }
    }
  )
  return node
}

Mask.Style = (frag) => {
  const el = frag.root.elements
  const style2 = {
    position: 'absolute',
    width: 'auto',
    height: 'auto',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)'
  }
  el.maskChildren.style(style2)
}

Mask.propTypes = {
  dismissible: propTypes.bool.default(() => atom(true)),
  visible: propTypes.bool.default(() => atom(false)),
  children: propTypes.arrayOf(propTypes.element())
}

export default createComponent(Mask)

/** @jsx createElement */
import {
  createElement,
  useRef,
  createComponent,
  atom,
  useViewEffect,
  propTypes,
  reactive,
  computed,
  atomComputed
} from 'axii'

import Mask from '../Mask'
import DrawerWrapper from './DrawerWrapper'
import CloseIcon from 'axii-icons/Close'

const DrawerMask = Mask.extend(frag => {
  frag.root.elements.maskChildren.style({
    position: 'absolute',
    width: 'auto',
    height: 'auto',
    left: 'auto',
    right: '0',
    top: '0',
    transform: 'translate(-100%, 0)'
  })
})
/**
 * 抽屉组件
 */
const Drawer = (props) => {
  const {
    visible,

    title,
    extra,
    width: rawWidth = 600,
    maskCloseable,
    closeable,
    children
  } = props

  const width = atomComputed(() => {
    if (typeof rawWidth.value === 'number') {
      return `${rawWidth.value}px`
    }
    return rawWidth.value
  })

  return (
    <DrawerMask visible={visible} dismissible={maskCloseable}>
      <container>
        <DrawerWrapper width={width}>
          <title-container
            block
            flex-display
            flex-justify-content-space-between
            flex-align-items-center
            block-padding-20px
            style={{ borderBottom: '1px solid #f0f0f0', gap: 10, background: '#fff' }}
          >
            {closeable.value && <CloseIcon onClick={() => { visible.value = false }}/>}
            <drawerTitle block flex-grow-1>{title}</drawerTitle>
            <extra-container>
              {() => extra.value.map((item) => item)}
            </extra-container>
          </title-container>
          <content>{children}</content>
        </DrawerWrapper>
      </container>
    </DrawerMask>
  )
}

Drawer.propTypes = {
  visible: propTypes.bool.default(() => atom(false)),

  title: propTypes.string.default(() => atom('')),
  width: propTypes.number.default(() => atom(600)),
  extra: propTypes.array.default(() => reactive([])),

  maskCloseable: propTypes.bool.default(() => atom(false)),
  closeable: propTypes.bool.default(() => atom(true)),
  children: propTypes.arrayOf(propTypes.element())
}

export default createComponent(Drawer)

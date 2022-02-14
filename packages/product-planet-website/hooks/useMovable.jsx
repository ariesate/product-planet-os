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
  watch,
  atomComputed
} from 'axii'

export default ({
  onDone = () => {},
  onMove = () => {}
}) => {
  const disabled = atom(false)

  const startMove = atom(false)

  const boardProps = {
    onMouseDown: (e) => {
      console.log('e: ', e)
      startMove.value = true
    },
    onMouseMove: (e) => {
      if (startMove.value) {
        onMove(e)
      }
    },
    onMouseUp: (e) => {
      startMove.value = false
    },
    style: {
      position: 'relative'
    }
  }
  return {
    boardProps,
    disabled
  }
}

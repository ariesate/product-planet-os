import styles from './style.module.less'

let isOpening = false

export function openFullscreenAnimation (args = {}) {
  const {
    onEnd = () => {}
  } = args

  if (isOpening) {
    return
  }
  isOpening = true
  const mountDOM = document.createElement('div')
  document.body.appendChild(mountDOM)
  mountDOM.className = styles['fullscreen-rect']
  requestAnimationFrame(() => {
    Object.assign(mountDOM.style, {
      transform: 'scale3d(1, 1, 1)'
    })
  })
  setTimeout(() => {
    mountDOM.style.className += ` ${styles['force-end']}`
    transitionEnd()
  }, 450)

  function transitionEnd () {
    if (!isOpening) {
      return
    }
    isOpening = false
    onEnd()
    setTimeout(() => {
      mountDOM.remove && mountDOM.remove()
    })
  }

  mountDOM.ontransitionend = () => {
    transitionEnd()
  }
}
// window.openFullScreenAnimation = openFullscreenAnimation.bind(null, { onEnd () { console.log('animation end') } })

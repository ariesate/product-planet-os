import {
  createElement,
  render,
  Fragment,
  createComponent,
  propTypes,
  atom
} from 'axii'
import CloseIcon from 'axii-icons/Close'

function createContainer () {
  const portalRoot = document.createElement('div')
  document.body.appendChild(portalRoot)
  return portalRoot
}

function createImageViewer () {
  const imageURL = atom('')
  const show = atom(false)

  render(
    <>
      {() =>
        show.value
          ? createElement(createComponent(ImageViewer), { imageURL, show })
          : null
      }
    </>,
    createContainer()
  )

  return {
    show: (url) => {
      imageURL.value = url
      show.value = true
    },
    hide: () => {
      show.value = false
    }
  }
}

ImageViewer.propTypes = {
  imageURL: propTypes.string.default(() => atom('')),
  show: propTypes.bool.default(() => atom(false))
}

function ImageViewer ({ imageURL, show }) {
  return (
    <image-viewer-container
      block
      flex-display
      flex-justify-content-center
      flex-align-items-flex-start
      block-position-absolute
      block-top={0}
      block-right={0}
      block-width={'100vw'}
      block-height={'100vh'}>
      <image-container
        block
        flex-display
        block-position-relative
        block-margin={'100px'}>
        <close-button
          block
          flex-display
          flex-justify-content-center
          flex-align-items-center
          block-position-absolute
          block-top={-22}
          block-right={-24}
          onClick={() => {
            show.value = false
          }}>
          <CloseIcon layout:block layout:block-position-relative layout:block-top-1px/>
        </close-button>
        {() => <img src={imageURL.value} />}
      </image-container>
    </image-viewer-container>
  )
}

ImageViewer.Style = (fragments) => {
  const el = fragments.root.elements
  el['image-viewer-container'].style((show) => {
    return {
      zIndex: 100,
      backgroundColor: 'rgba(0,0,0,0.45)',
      overflow: 'auto'
    }
  })
  el['image-container'].style({
    border: '10px solid white',
    borderRadius: '5px',
    height: 'auto',
    maxWidth: '100%'
  })
  el['img'].style({
    maxWidth: '100%'
  })
  el['close-button'].style({
    width: '30px',
    height: '30px',
    borderRadius: '100%',
    backgroundColor: 'white',
    boxShadow: '0 2px 10px 0 rgb(155 165 163 / 90%)',
    cursor: 'pointer'
  })
}

export default createImageViewer()

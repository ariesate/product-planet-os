import {
  createElement,
  createComponent,
  propTypes,
  atom,
  atomComputed,
  render
} from 'axii'
import Close from 'axii-icons/Close'
import Button from '../Button'

/**
 * @type {import('axii').FC}
 */
function ModalFC ({
  visible,
  title,
  okText,
  cancelText,
  footer,
  onOk,
  onCancel,
  loading,
  children
}) {
  return (
    <container
      block
      block-position-fixed
      block-top-0
      block-left-0
      block-width-100vw
      block-height-100vh
      block-display-none={atomComputed(() => !visible.value)}>
      <content
        block
        block-position-absolute
        block-left={'50%'}
        block-top-100px
        block-min-width-416px
        block-max-width="calc(100vw - 32px)">
        <content-header
          block
          block-padding-24px
          block-font-size-16px
          block-line-height-22px>
          {title}
        </content-header>
        <content-body block block-padding="0 24px" block-font-size-14px>
          {children}
        </content-body>
        <content-footer block block-padding-24px>
          {() => {
            if (footer === undefined) {
              return (
                <div>
                  {() =>
                    cancelText.value == null
                      ? null
                      : (
                      <Button onClick={onCancel?.bind(undefined, visible)}>
                        {cancelText}
                      </Button>
                        )
                  }
                  <Button
                    layout:inline
                    layout:inline-margin-left-8px
                    primary
                    loading={loading}
                    onClick={onOk?.bind(undefined, visible)}>
                    {okText}
                  </Button>
                </div>
              )
            }
            if (typeof footer === 'function') {
              return footer({ onCancel, onOk })
            }
            return footer
          }}
        </content-footer>
        <close
          block
          block-position-absolute
          block-right-0
          block-top-0
          block-width-56px
          block-height-56px
          block-font-size-16px
          block-line-height-56px
          onClick={onCancel?.bind(undefined, visible)}>
          <Close size="16" unit="px" fill="#8c8c8c" />
        </close>
      </content>
    </container>
  )
}

ModalFC.Style = (frag) => {
  frag.root.elements.container.style({
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 1000,
    pointerEvents: 'none'
  })
  frag.root.elements.content.style({
    backgroundColor: '#fff',
    transform: 'translateX(-50%)',
    borderRadius: '4px',
    boxShadow:
      '0 3px 6px -4px #0000001f, 0 6px 16px #00000014, 0 9px 28px 8px #0000000d',
    overflow: 'hidden',
    pointerEvents: 'auto'
  })
  frag.root.elements['content-header'].style({
    color: '#1f1f1f',
    fontWeight: '500',
    wordWrap: 'break-word',
    borderRadius: '4px 4px 0 0'
  })
  frag.root.elements['content-footer'].style({
    borderRadius: '0 0 4px 4px',
    textAlign: 'right'
  })
  frag.root.elements.close.style({
    textAlign: 'center',
    cursor: 'pointer'
  })
}

ModalFC.propTypes = {
  visible: propTypes.bool.default(() => atom(false)),
  loading: propTypes.bool.default(() => atom(false)),
  title: propTypes.string.default(() => atom('')),
  okText: propTypes.string.default(() => atom('确认')),
  cancelText: propTypes.string.default(() => atom('取消')),
  children: propTypes.arrayOf(propTypes.element()),
  footer: propTypes.element(),
  onOk: propTypes.function.default(() => (visible) => {
    visible.value = false
  }),
  onCancel: propTypes.function.default(() => (visible) => {
    visible.value = false
  })
}

const Modal = createComponent(ModalFC)

function createContainer () {
  const portalRoot = document.createElement('div')
  document.body.appendChild(portalRoot)
  return portalRoot
}

function createModal () {
  const visible = atom(false)
  const title = atom('')
  const okText = atom('确认')
  const cancelText = atom('取消')
  const content = atom(null)
  const handleDismiss = (cb) => {
    return (...args) => {
      cb?.apply(undefined, args)
      visible.value = false
      title.value = ''
      content.value = null
      okText.value = '确认'
      cancelText.value = '取消'
      onOk.value = handleDismiss()
      onCancel.value = handleDismiss()
    }
  }
  const onOk = atom(handleDismiss())
  const onCancel = atom(handleDismiss())

  render(
    createElement(
      Modal,
      {
        visible,
        title,
        okText,
        cancelText,
        onOk: (...args) => {
          onOk?.value?.apply(undefined, args)
        },
        onCancel: (...args) => {
          onCancel?.value?.apply(undefined, args)
        }
      },
      content
    ),
    createContainer()
  )

  return (options) => {
    title.value = options.title || null
    content.value = options.content || null
    okText.value = options.okText || '确认'
    cancelText.value =
      options.cancelText === null ? null : options.cancelText || '取消'
    onOk.value = handleDismiss(options.onOk)
    onCancel.value = handleDismiss(options.onCancel)
    visible.value = true
  }
}

Modal.confirm = createModal()
Modal.titleIcon = (icon, fill) =>
  createElement(icon, {
    size: '16',
    unit: 'px',
    fill,
    inline: true,
    'inline-margin-right': '8px',
    style: {
      verticalAlign: 'middle',
      lineHeight: '22px'
    }
  })

export default Modal

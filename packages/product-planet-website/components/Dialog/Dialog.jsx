import {
  watch,
  useViewEffect,
  propTypes,
  createElement,
  atom,
  createComponent,
  atomComputed,
  isAtom
} from 'axii'

import styles from './style.module.less'
import ButtonNew from '../Button.new'
import shortcut from '@/tools/shortcut'

export function Dialog ({
  children,
  title,
  hasMask,
  hasHeader,
  visible,
  onSure,
  sureText,
  sureProps = {},
  onCancel,
  width,
  loading,
  extraButtons,
  hasFooter,
  maskClosable,
  shortcutScope = 'Dialog',
  hasCancelBtn
}) {
  useViewEffect(() => {
    shortcut.init()
    watch(() => visible.value, () => {
      const shortcutScope = title?.value ? title.value : title
      if (visible.value) {
        const prevent = () => false
        shortcut.enter(shortcutScope)
        shortcut.bind('Enter', shortcutScope, onSure, prevent)
        shortcut.bind('Escape', shortcutScope, onCancel, prevent)
      } else {
        shortcut.leave(shortcutScope)
      }
    }, true)

    return () => {
      shortcut.leave(shortcutScope)
    }
  })

  return (
    <div
      className={styles.container}
      style={atomComputed(() =>
        visible.value ? { display: 'block' } : { display: 'none' }
      )}
    >
      {hasMask ? <div className={styles.mask} onClick={() => maskClosable.value && onCancel()}></div> : null}
      <div className={styles.content} style={{ width }}>
        {() =>
          hasHeader.value
            ? (
            <div className={styles.header}>
              <div>{title}</div>
            </div>
              )
            : null
        }

        <div className={styles.body}>{children}</div>
        {() => hasFooter.value
          ? <div className={styles.footer}>
              {() => hasCancelBtn.value
                ? (<ButtonNew onClick={onCancel} disabled={loading}>取消</ButtonNew>)
                : null}
              <ButtonNew primary onClick={onSure} loading={loading} {...sureProps} >
                {sureText}
              </ButtonNew>
              {extraButtons || null}
            </div>
          : null}
      </div>
    </div>
  )
}

Dialog.propTypes = {
  onSure: propTypes.function.default(() => {}),
  onCancel: propTypes.function.default(() => {}),
  sureText: propTypes.string.default(() => atom('确认')),
  loading: propTypes.bool.default(() => atom(false)),
  hasMask: propTypes.bool.default(() => atom(true)),
  hasHeader: propTypes.bool.default(() => atom(true)),
  visible: propTypes.bool.default(() => atom(false)),
  title: propTypes.string.default(() => atom('')),
  children: propTypes.arrayOf(propTypes.element()),
  hasFooter: propTypes.bool.default(() => atom(true)),
  maskClosable: propTypes.bool.default(() => atom(false)),
  hasCancelBtn: propTypes.bool.default(() => atom(true))
}

export default createComponent(Dialog)

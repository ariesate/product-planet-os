import {
  propTypes,
  createElement,
  atom,
  createComponent,
  atomComputed
} from 'axii'

import styles from './style.module.less'
import ButtonNew from '../Button.new'

export function Dialog ({
  children,
  title,
  hasMask,
  visible,
  onSure,
  sureText,
  sureProps = {},
  onCancel,
  width,
  loading,
  extraButtons,
  hasFooter,
  maskClosable
}) {
  return (
    <div
      className={styles.container}
      style={atomComputed(() =>
        visible.value ? { display: 'block' } : { display: 'none' }
      )}
    >
      {hasMask ? <div className={styles.mask} onClick={() => maskClosable.value && onCancel()}></div> : null}
      <div className={styles.content} style={{ width }}>
        <div className={styles.header}>
          <div>{title}</div>
        </div>
        <div className={styles.body}>{children}</div>
        {() => hasFooter.value
          ? <div className={styles.footer}>
              <ButtonNew onClick={onCancel} disabled={loading}>取消</ButtonNew>
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
  visible: propTypes.bool.default(() => atom(false)),
  title: propTypes.string.default(() => atom('')),
  children: propTypes.arrayOf(propTypes.element()),
  hasFooter: propTypes.bool.default(() => atom(true)),
  maskClosable: propTypes.bool.default(() => atom(false))
}

export default createComponent(Dialog)

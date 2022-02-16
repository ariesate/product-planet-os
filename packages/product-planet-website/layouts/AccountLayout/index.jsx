import { createElement, createComponent } from 'axii'
import styles from './style.module.less'

/**
 * @type {import('axii').FC}
 */
function AccountLayout ({ children }) {
  return (
    <div className={styles.container}>
      <div className={styles.feature}></div>
      <div className={styles.content}>{children}</div>
    </div>
  )
}

export default createComponent(AccountLayout)

import { createElement, Fragment } from 'axii'
import classNames from 'classnames'

import styles from './style.module.less'

function TextButton ({
  children,
  primary = false,
  danger = false,
  key,
  ...buttonProps
}) {
  return (
    <button
      {...buttonProps}
      className={classNames([
        styles['text-button'],
        primary && styles['primary'],
        danger && styles['danger'],
        buttonProps.disabled && styles['disabled']
      ])}
    >
      {children}
    </button>
  )
}

export default TextButton

import { createElement, createComponent, atom } from 'axii'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import styles from './style.module.less'

/**
 * @type {import('axii').FC}
 */
function Login () {
  const mode = atom('login')
  return (
    <div className={styles.container}>
      <div className={styles.feature}></div>
      <div className={styles.content}>
        {() => {
          if (mode.value === 'login') {
            return <LoginForm mode={mode} />
          }
          if (mode.value === 'register') {
            return <RegisterForm mode={mode} />
          }
          return null
        }}
      </div>
    </div>
  )
}

export default createComponent(Login)

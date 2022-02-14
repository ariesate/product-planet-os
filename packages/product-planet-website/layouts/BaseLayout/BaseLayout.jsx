import { createComponent, createElement, propTypes, useViewEffect } from 'axii'

import Header from './Header'

import styles from './style.module.less'
import useHideLayout from '@/hooks/useHideLayout'
import useStore from '@/hooks/useStore'
import { getUserInfo } from '@/store/UserInfo'

function BaseLayout (props) {
  const { children } = props
  const { isHideLayout } = useHideLayout()
  const user = useStore(root => root.UserInfo)

  useViewEffect(() => {
    getUserInfo()
  })

  return (
    <div className={styles['base-layout']}>
      {() => !isHideLayout.value ? <Header/> : ''}
      <div className={styles['main-layout']}>
        <main className={styles['main-wrapper']}>
          {() => user.value?.id
            ? <view>{children}</view>
            : null}
        </main>
      </div>
    </div>
  )
}

BaseLayout.propTypes = {
  children: propTypes.arrayOf(propTypes.element())
}

export default createComponent(BaseLayout)

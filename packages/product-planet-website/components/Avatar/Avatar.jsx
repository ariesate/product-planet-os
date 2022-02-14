import { createElement, Fragment, computed, useViewEffect } from 'axii'

import useStore from '@/hooks/useStore'
import { getUserInfo } from '@/store/UserInfo'

import styles from './style.module.less'

function Avatar () {
  const userInfo = useStore((root) => root.UserInfo)
  const avatar = computed(() => userInfo.value?.avatar || 'https://avatars.githubusercontent.com/u/37143265?v=4')

  return (
    <div className={styles['container']}>
      {() => userInfo.value?.displayName || '-'}
      <img
        className={styles['avatar']}
        src={avatar}
      />
    </div>
  )
}

export default Avatar

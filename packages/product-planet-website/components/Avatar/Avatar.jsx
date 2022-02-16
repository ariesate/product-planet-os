import { createElement, computed } from 'axii'

import useStore from '@/hooks/useStore'

import styles from './style.module.less'

function Avatar () {
  const userInfo = useStore((root) => root.UserInfo)
  const avatar = computed(() => userInfo.value?.avatar || 'https://avatars.githubusercontent.com/u/37143265?v=4')

  return (
    <div className={styles['container']}>
      {() => userInfo.value?.org?.name || null}
      <img
        className={styles['avatar']}
        src={avatar}
      />
    </div>
  )
}

export default Avatar

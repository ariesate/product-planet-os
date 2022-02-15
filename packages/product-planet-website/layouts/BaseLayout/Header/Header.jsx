import { atomComputed, createComponent, createElement } from 'axii'

import Avatar from '@/components/Avatar'
import DropdownMenu from '@/components/DropdownMenu'
import fullLogo from '@/svgs/fullLogo.svg?raw'

import { historyLocation } from '@/router'
import { logout } from '@/store/UserInfo'

import styles from './style.module.less'
import SaveButton from '@/layouts/VersionLayout/SaveButton'
import QuickVisitOtherProduct from '../QuickVisitOtherProduct'

function Header () {
  const isProductDetail = atomComputed(
    () =>
      !!historyLocation.pathname.match(/^\/product\/[0-9]+\/version\/[0-9]+/)
  )
  return (
    <div className={styles['header']}>
      <header-left
        block
        flex-display
        flex-align-items-center
        style={{ gap: 10 }}>
        <span
          dangerouslySetInnerHTML={{ __html: fullLogo }}
          className={styles['logo']}
          onClick={() => historyLocation.goto('/')}
        />
        {() =>
          isProductDetail.value
            ? (
            <title-extra
              block
              flex-display
              flex-align-items-center
              style={{ gap: 10 }}>
              <separator>/</separator>
              <QuickVisitOtherProduct />
              <SaveButton />
            </title-extra>
              )
            : null
        }
      </header-left>
      <DropdownMenu
        trigger="hover"
        align="right"
        offsetY="0"
        options={[
          {
            title: '退出登录',
            onClick: () => {
              logout()
            }
          }
        ]}>
        <Avatar />
      </DropdownMenu>
    </div>
  )
}

export default createComponent(Header)

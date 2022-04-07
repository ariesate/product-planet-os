import { atomComputed, createComponent, createElement } from 'axii'

import Avatar from '@/components/Avatar'
import DropdownMenu from '@/components/DropdownMenu'
import fullLogo from '@/svgs/fullLogo.svg?raw'

import { historyLocation } from '@/router'
import { logout } from '@/store/UserInfo'

import styles from './style.module.less'
import SaveButton from '@/layouts/VersionLayout/SaveButton'
import QuickVisitOtherProduct from '../QuickVisitOtherProduct'

import ButtonNew from '@/components/Button.new'
import Home from 'axii-icons/Home'
import { useVersion } from '@/layouts/VersionLayout'
import { mapStatusText, versionStatusMap } from '@/pages/version-partial/util'
import Dialog from '@/components/Dialog'
import { useLocalBool } from '@/hooks/useLocalAtom'

function ProductHeader (props) {
  const version = useVersion()
  const productId = atomComputed(() => version.value?.product.id || '')
  const versionName = atomComputed(() => version.value?.name)
  const currentGroup = atomComputed(() => {
    const queryGroup = parseInt(historyLocation.query.group)
    if (version.value) {
      const groups = version.value.groups
      const g = groups.find(g => g.id === queryGroup)
      if (g) {
        return g
      }
    }
    return { id: undefined, name: '全部' }
  })

  function gotoVersion (vid, blank) {
    historyLocation.goto(`/product/${productId.value}/version/${vid}/partial`)
  }

  const versionStatus = atomComputed(() => version.value?.currentStatus ? mapStatusText(version.value.currentStatus, true) : '')

  const isArchiveVersion = atomComputed(() => version.value?.currentStatus === versionStatusMap.ARCHIVE)
  const undoneVersionId = atomComputed(() => version.value?.undoneVersion?.id)

  const sureHistoryRemind = useLocalBool('REMIND_IN_HISTORY_VERSION', true, true)
  const showHistoryDialog = atomComputed(() => {
    return !sureHistoryRemind.value && isArchiveVersion.value
  })

  return (
    <productHeader block flex-display flex-align-items-center
      style={{ gap: 10 }} >
      <homeIconBox inline inline-height="18px" style={{ cursor: 'pointer' }} onClick={() => {
        historyLocation.goto('/products/mine')
      }} >
        <Home size={18} unit="px" />
      </homeIconBox>
      <myProductName style={{
        fontWeight: 'bold'
      }}>
        <QuickVisitOtherProduct />
      </myProductName>
      <separator>/</separator>
      <currentVersion style={{ fontSize: '18px', cursor: 'pointer' }} onClick={() => gotoVersion(version.value.id)} >
        {() => versionName.value || ''}
        <status style={{ fontSize: '14px' }}>{() => versionStatus.value ? `（${versionStatus.value}）` : ''}</status>
      </currentVersion>
      {() => currentGroup.value.id
        ? (
        <group key={currentGroup.value.id} style={{ gap: 10 }} block flex-display flex-align-items-center>
          <separator>/</separator>
          <currentGroup block block-position="relative" style={{ fontSize: '16px', cursor: 'pointer' }} >
              {currentGroup.value.name}
          </currentGroup>
        </group>
          )
        : <noneGroup key="none"></noneGroup>}
      <currentAction block style={{ fontSize: '16px', cursor: 'pointer' }} >
        <ButtonNew onClick={() => gotoVersion(version.value.id)} size="small" >查看</ButtonNew>
      </currentAction>
      {() => isArchiveVersion.value
        ? <currentAction2 block style={{ fontSize: '16px', cursor: 'pointer' }} >
            <ButtonNew onClick={() => gotoVersion(undoneVersionId.value, true)} size="small" >
              回到现在
            </ButtonNew>
          </currentAction2>
        : ''}
      {() => isArchiveVersion.value
        ? <archiveVersionTip style={{ color: '#fa8c16' }}>
          注意：当前迭代已经归档，仅用于查看
         </archiveVersionTip>
        : ''}
      <Dialog hasMask visible={showHistoryDialog} sureText="我知道了" title="注意"
        onCancel={() => (sureHistoryRemind.value = true)}
        onSure={() => (sureHistoryRemind.value = true)} >
        <historyTip block style={{ fontSize: 16 }}>
          当前迭代已经
          <red style={{ color: 'red' }}>归档</red>，仅用于查看
        </historyTip>
        <historyTip block block-margin="16px 0 0" style={{ fontSize: 16 }}>
          相关操作可能不会生效，不要在此页面保存数据
        </historyTip>
      </Dialog>
    </productHeader>
  )
}

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
        {() => isProductDetail.value
          ? <ProductHeader />
          : <span
              dangerouslySetInnerHTML={{ __html: fullLogo }}
              className={styles['logo']}
              onClick={() => historyLocation.goto('/')}
            />
        }
      </header-left>
      <heder-right block flex-display flex-direction-row flex-align-items-center>
        <SaveButton />
        <DropdownMenu
        trigger="hover"
        align="right"
        offsetY="0"
        options={[
          {
            title: '个人信息',
            onClick: () => historyLocation.goto('/profile')
          },
          {
            title: '我的组织',
            onClick: () => historyLocation.goto('/org-management')
          },
          {
            title: '退出登录',
            onClick: () => {
              logout()
            }
          }
        ]}>
        <Avatar />
      </DropdownMenu>
      </heder-right>
    </div>
  )
}

export default createComponent(Header)

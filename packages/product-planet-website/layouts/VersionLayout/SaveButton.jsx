import {
  createElement,
  createComponent,
  atomComputed,
  atom,
  useViewEffect,
  Fragment,
  watch
} from 'axii'
import {
  Codebase,
  Rule,
  Navigation,
  Page,
  Link,
  Entity,
  Field,
  RelationPort
} from '@/models'
import { message } from 'axii-components'
import CodeDownloadIcon from 'axii-icons/CodeDownload'
import FolderCodeIcon from 'axii-icons/FolderCode'
import { useVersion } from '@/layouts/VersionLayout'
import { Dialog } from '@/components/Dialog/Dialog'
import { historyLocation } from '@/router'
import useStore from '@/hooks/useStore'
import { setSaveButton } from '@/store/SaveButton'
import Modal from '@/components/Modal'
import Spin from '@/components/Spin'
import { getEnv } from '@/utils/util'
import { githubConfig } from '@/utils/const'

const conf = githubConfig[getEnv()]

function SaveButton () {
  const version = useVersion()
  const merged = atom(true)
  const visible = atom(false)
  const codebaseUrl = atom('')
  const loading = atom(false)
  const saved = useStore((root) => root.SaveButton)
  const authUrl = `${conf.authUrl}?client_id=${conf.clientId}&redirect_uri=${conf.backPage}?&state=${Math.random().toString()}&scope=user,repo`

  useViewEffect(() => {
    const entities = [Rule, Navigation, Page, Link, Entity, Field, RelationPort]
    entities.forEach((entity) => {
      entity.addHook('change', () => {
        if (saved.value?.saved === true) {
          setSaveButton(false)
        }
      })
    })
  })

  const handleToBindGit = () => {
    visible.value = false
    historyLocation.goto(
      `/product/${version.value.id}/version/${version.value.product?.id}/info`
    )
  }

  const handleClick = async () => {
    const {
      id: versionId,
      product: { id: productId, name: productName }
    } = version.value
    if (!productId) return
    // 授权
    const github = JSON.parse(localStorage.getItem('github') || '{}')
    const token = github.access_token
    if (!token) {
      Modal.confirm({
        title: (
          <span>
            {'确定用github账号授权？'}
          </span>
        ),
        onOk: () => {
          localStorage.setItem('githubCallBackUrl', window.location.href)
          location.href = authUrl
        }
      })
      return
    }

    const codebase = await Codebase.findOne({
      where: { product: version.value.product?.id }
    })
    if (!codebase?.id) {
      visible.value = true
      return
    }
    if (saved.value?.saved === false) {
      Modal.confirm({
        title: (
          <span>
            {`确定将改动同步到git项目${codebase.projectName}的${codebase.targetBranch || 'master'}分支？`}
          </span>
        ),
        onOk: async () => {
          loading.value = true
          const res = await handleSave({ versionId, productId, productName, token }, codebase)
          if (res.result?.mr?.html_url) {
            codebaseUrl.value = res.result.mr?.html_url
          }
          merged.value = false
          loading.value = false
        }
      })
    } else {
      const defultUrl = codebase.projectUrl
      window.open(codebaseUrl.value || defultUrl, '_blank')
      merged.value = true
      codebaseUrl.value = defultUrl
    }
  }

  const handleSave = async (
    product,
    codebase
  ) => {
    try {
      const res = await Codebase.updateCodebase(product, codebase)
      const errors = res?.result?.e?.description
      if (errors) {
        const errorStr = Array.isArray(errors) ? errors.join('\n') : errors
        message.error(errorStr)
        return
      }
      setSaveButton(true)
      message.success('同步成功')
      return res
    } catch (e) {
      const msg = typeof e === 'object' ? e.message : e
      message.error(msg)
    }
  }

  return (
    <>
      <div onClick={handleClick} style={{ fontSize: '20px', color: '#1f2329', cursor: 'pointer', marginRight: '20px' }}>
        {() => loading.value ? <Spin show={true} /> : (saved.value?.saved === false ? <CodeDownloadIcon layout:block-margin-top-6px /> : <FolderCodeIcon layout:block-margin-top-6px />)}
      </div>
      <Dialog
        visible={visible}
        title="未绑定代码库"
        onCancel={() => {
          visible.value = false
        }}
        onSure={handleToBindGit}>
        概览 -{'>'} 关联平台 -{'>'} gitlab -{'>'} 设置
      </Dialog>
    </>
  )
}

export default createComponent(SaveButton)

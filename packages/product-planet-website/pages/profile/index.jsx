import Button from '@/components/Button'
import ImageUpload from '@/components/ImageUpload'
import Input from '@/components/Input'
import useStore from '@/hooks/useStore'
import api from '@/services/api'
import { getUserInfo } from '@/store/UserInfo'
import {
  createElement,
  createComponent,
  atomComputed,
  reactive,
  useViewEffect,
  atom
} from 'axii'
import { Select, message } from 'axii-components'
import Field from './Field'

/**
 * @type {import('axii').FC}
 */
function Profile () {
  const profile = useStore((root) => root.UserInfo)
  const orgs = reactive([])
  const displayName = atomComputed(() => profile.value.displayName)
  const avatar = atomComputed(() => profile.value.avatar)
  const file = atom(null)
  const loading = atom(false)

  const fetchOrgs = async () => {
    const res = await api.orgs.getOrgs()
    orgs.splice(0, orgs.length, ...res)
  }

  const handleSave = async () => {
    loading.value = true
    try {
      if (file.value) {
        const ext = file.value.name.slice(file.value.name.lastIndexOf('.'))
        avatar.value = await api.$upload(file.value, 'avatar' + ext)
        file.value = null
      }
      await api.user.setCurrentUserInfo({
        avatar: avatar.value,
        displayName: displayName.value
      })
    } catch (error) {
      console.error(error)
      message.error('保存失败')
      return
    } finally {
      loading.value = false
    }
    message.success('保存成功')
    getUserInfo()
  }

  useViewEffect(() => {
    fetchOrgs()
  })

  return (
    <container block block-width-100vw block-height="100%">
      <content
        inline
        inline-flex
        inline-padding-left-56px
        flex-direction-column>
        <h3 block>个人信息</h3>
        <form block flex-display flex-direction-column>
          <Field label="用户名">
            <Input
              layout:block-min-width-200px
              value={atomComputed(() => profile.value.name)}
              disabled
            />
          </Field>
          <Field label="邮箱">
            <Input
              layout:block-min-width-200px
              value={atomComputed(() => profile.value.email)}
              disabled
            />
          </Field>
          <Field label="姓名">
            <Input layout:block-min-width-200px value={displayName} />
          </Field>
          <Field label="头像">
            <ImageUpload
              value={avatar}
              width="128px"
              height="128px"
              onChange={(e) => {
                file.value = e
              }}
            />
          </Field>
          <Field label="当前组织">
            <Select
              layout:block-width-200px
              options={orgs}
              value={atomComputed(() => profile.value.org)}
              renderOption={(option) => option.name}
            />
          </Field>
          <Button
            primary
            disabled={loading}
            loading={loading}
            onClick={handleSave}>
            保存
          </Button>
        </form>
      </content>
    </container>
  )
}

Profile.Style = (frag) => {
  frag.root.elements.container.style({
    backgroundColor: '#fff'
  })
  frag.root.elements.form.style({
    gap: '10px'
  })
}

export default createComponent(Profile)

import Button from '@/components/Button'
import Input from '@/components/Input'
import useStore from '@/hooks/useStore'
import api from '@/services/api'
import {
  createElement,
  createComponent,
  atomComputed,
  reactive,
  useViewEffect
} from 'axii'
import { Select } from 'axii-components'
import Field from './Field'

/**
 * @type {import('axii').FC}
 */
function Profile () {
  const profile = useStore((root) => root.UserInfo)
  const orgs = reactive([])

  const fetchOrgs = async () => {
    const res = await api.orgs.getOrgs()
    orgs.splice(0, orgs.length, ...res)
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
            <Input
              layout:block-min-width-200px
              value={atomComputed(() => profile.value.displayName)}
            />
          </Field>
          <Field label="头像">
            <Input
              layout:block-min-width-200px
              value={atomComputed(() => profile.value.avatar)}
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
          <Button primary>保存</Button>
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

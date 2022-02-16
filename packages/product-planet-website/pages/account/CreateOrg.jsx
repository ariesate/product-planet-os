import {
  createElement,
  createComponent,
  propTypes,
  atom,
  reactive,
  atomComputed,
  delegateLeaf
} from 'axii'
import { message } from 'axii-components'
import Button from '@/components/Button'
import Input from '@/components/Input'
import api from '@/services/api'

/**
 * @type {import('axii').FC}
 */
function CreateOrg () {
  const loading = atom(false)
  const name = atom('')
  const errors = reactive({
    name: ''
  })
  const hasError = atomComputed(() => !!errors.name)
  const validate = () => {
    if (!name.value) {
      errors.name = '请输入名称'
    } else if (name.value.length < 3) {
      errors.name = '名称长度不能小于3位'
    }
  }

  const handleSubmit = async () => {
    validate()
    if (hasError.value) {
      return
    }
    try {
      loading.value = true
      await api.orgs.createOrg(name.value)
      const search = new URLSearchParams(window.location.search)
      if (search.get('redirect')) {
        window.location.href = search.get('redirect')
      } else {
        window.location.href = '/'
      }
    } catch (error) {
      message.error(error.response.data || error.message)
    } finally {
      loading.value = false
    }
  }

  return (
    <container block block-width-480px block-margin-top-180px>
      <name block block-font-size-38px block-line-height-46px>
        创建组织
      </name>
      <content
        block
        block-margin-top-40px
        block-font-size-14px
        block-line-height-22px>
        <field block block-margin-bottom-24px>
          <label block block-margin-bottom-8px>
            组织名称
          </label>
          <Input
            layout:block
            layout:block-width-480px
            layout:block-padding="4px 0"
            placeholder="请输入组织名称"
            value={name}
            error={delegateLeaf(errors).name}
          />
        </field>
        <Button
          primary
          block
          block-width="100%"
          size="large"
          onClick={handleSubmit}>
          创建
        </Button>
        <hint
          block
          block-margin-top-8px
          flex-display
          flex-justify-content-flex-end>
          <span>您可联系组织管理员添加您为成员</span>
        </hint>
      </content>
    </container>
  )
}

CreateOrg.Style = (frag) => {
  frag.root.elements.hotlink.style({
    color: '#333333',
    fontWeight: '500',
    textDecoration: 'underline',
    cursor: 'pointer'
  })
}

CreateOrg.propTypes = {
  mode: propTypes.string
}

export default createComponent(CreateOrg)

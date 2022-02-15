import {
  createElement,
  createComponent,
  propTypes,
  atom,
  reactive,
  delegateLeaf,
  atomComputed
} from 'axii'
import { message } from 'axii-components'
import Button from '@/components/Button'
import Input from './FormInput'
import axios from 'axios'

/**
 * @type {import('axii').FC}
 */
function LoginForm ({ mode }) {
  const loading = atom(false)
  const email = atom('')
  const password = atom('')
  const errors = reactive({
    email: '',
    password: ''
  })
  const hasError = atomComputed(() => !!errors.email || !!errors.password)
  const validate = () => {
    if (!email.value) {
      errors.email = '请输入邮箱'
    } else if (!/^\S+@\S+\.\S+$/.test(email.value)) {
      errors.email = '请输入正确的邮箱'
    }
    if (!password.value) {
      errors.password = '请输入密码'
    }
  }

  const handleSubmit = async () => {
    validate()
    if (hasError.value) {
      return
    }
    try {
      loading.value = true
      await axios.post(
        '/api/login',
        {
          email: email.value,
          password: password.value
        },
        { withCredentials: false }
      )
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
        登录
      </name>
      <content
        block
        block-margin-top-40px
        block-font-size-14px
        block-line-height-22px>
        <field block block-margin-bottom-24px>
          <label block block-margin-bottom-8px>
            邮箱
          </label>
          <Input
            layout:block
            layout:block-width-480px
            layout:block-padding="4px 0"
            placeholder="请输入邮箱地址"
            value={email}
            error={delegateLeaf(errors).email}
          />
        </field>
        <field block block-margin-bottom-24px>
          <label block block-margin-bottom-8px>
            密码
          </label>
          <Input
            layout:block
            layout:block-width-480px
            layout:block-padding="4px 0"
            placeholder="请输入密码"
            type="password"
            value={password}
            error={delegateLeaf(errors).password}
          />
          <hint
            block
            block-margin-top-8px
            flex-display
            flex-justify-content-flex-end>
            <hotlink>忘记密码？</hotlink>
          </hint>
        </field>
        <Button
          primary
          block
          block-width="100%"
          size="large"
          disabled={loading}
          onClick={handleSubmit}>
          登录
        </Button>
        <hint
          block
          block-margin-top-8px
          flex-display
          flex-justify-content-flex-end>
          <span>还没有账号？</span>
          <hotlink
            onClick={() => {
              mode.value = 'register'
            }}>
            立即注册
          </hotlink>
        </hint>
      </content>
    </container>
  )
}

LoginForm.Style = (frag) => {
  frag.root.elements.hotlink.style({
    color: '#333333',
    fontWeight: '500',
    textDecoration: 'underline',
    cursor: 'pointer'
  })
}

LoginForm.propTypes = {
  mode: propTypes.string
}

export default createComponent(LoginForm)

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
import axios from 'axios'

/**
 * @type {import('axii').FC}
 */
function RegisterForm ({ mode }) {
  const loading = atom(false)
  const email = atom('')
  const password = atom('')
  const repeatPassword = atom('')
  const errors = reactive({
    email: '',
    password: '',
    repeatPassword: ''
  })
  const hasError = atomComputed(
    () => !!errors.email || !!errors.password || !!errors.repeatPassword
  )
  const validate = () => {
    if (!email.value) {
      errors.email = '请输入邮箱'
    } else if (!/^\S+@\S+\.\S+$/.test(email.value)) {
      errors.email = '请输入正确的邮箱'
    }
    if (!password.value) {
      errors.password = '请输入密码'
    } else if (password.value.length < 6) {
      errors.password = '密码长度不能小于6位'
    }
    if (!repeatPassword.value) {
      errors.repeatPassword = '请确认密码'
    } else if (password.value !== repeatPassword.value) {
      errors.repeatPassword = '两次密码不一致'
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
        '/api/register',
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
        注册
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
        </field>
        <field block block-margin-bottom-24px>
          <label block block-margin-bottom-8px>
            确认密码
          </label>
          <Input
            layout:block
            layout:block-width-480px
            layout:block-padding="4px 0"
            placeholder="请输入密码"
            type="password"
            value={repeatPassword}
            error={delegateLeaf(errors).repeatPassword}
          />
        </field>
        <Button
          primary
          block
          block-width="100%"
          size="large"
          onClick={handleSubmit}>
          登录
        </Button>
        <hint
          block
          block-margin-top-8px
          flex-display
          flex-justify-content-flex-end>
          <span>已有账号？</span>
          <hotlink
            onClick={() => {
              mode.value = 'login'
            }}>
            去登录
          </hotlink>
        </hint>
      </content>
    </container>
  )
}

RegisterForm.Style = (frag) => {
  frag.root.elements.hotlink.style({
    color: '#333333',
    fontWeight: '500',
    textDecoration: 'underline',
    cursor: 'pointer'
  })
}

RegisterForm.propTypes = {
  mode: propTypes.string
}

export default createComponent(RegisterForm)

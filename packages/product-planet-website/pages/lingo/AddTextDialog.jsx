import {
  createElement,
  Fragment,
  atomComputed,
  atom,
  computed,
  createComponent,
  reactive,
  propTypes,
  createRef,
  watch
} from 'axii'
import { Input, Radios, message } from 'axii-components'
import { Dialog } from '@/components/Dialog/Dialog'
import ButtonNew from '@/components/Button.new'

AddTextDialog.propTypes = {
  visible: propTypes.string.default(() => atom(false)),
  callBack: propTypes.function.default(() => () => {})
}
function AddTextDialog ({
  visible,
  callBack
}) {
  const formRef = createRef()

  const handleCancel = () => {
    visible.value = false
  }

  const inputItems = [
    {
      label: '中文',
      placeholder: '必填',
      key: 'zh'
    },
    {
      label: '英文',
      key: 'en',
      required: false
    },
    {
      label: '描述',
      key: 'desc',
      required: false
    }
  ]

  const handleSure = async () => {
    const resData = {}
    const formData = new FormData(formRef.current)
    for (const [key, value] of formData) {
      const conf = inputItems.find(item => item.key === key)
      if (!value && conf && conf.required !== false) {
        message.error('信息不完整')
        return
      }
      resData[key] = value
    }
    // submit
    callBack(resData)
    visible.value = false
    formRef.current?.reset()
  }

  const handleTrans = () => {

  }

  return (
      <Dialog
        visible={visible}
        title="新增文案"
        onCancel={handleCancel}
        onSure={handleSure}>
            <form
              name="upload"
              onSubmit={(e) => e.preventDefault}
              ref={formRef}>
              {inputItems.map((item) => (
                <form-item
                  key={item.key}
                  block
                  block-margin-bottom-10px
                  flex-display
                  flex-align-items-center>
                  <div style={{ width: '50px', textAlign: 'left' }}>
                    {item.label}
                  </div>
                  <Input
                    name={item.key}
                    type="text"
                    maxLength="500"
                    placeholder={item.placeholder}
                    layout:flex-grow-1></Input>
                    {
                      () => item.key === 'en' ? <ButtonNew onClick={handleTrans}>机翻</ButtonNew> : null
                    }
                </form-item>
              ))}
            </form>
      </Dialog>
  )
}

export default createComponent(AddTextDialog)

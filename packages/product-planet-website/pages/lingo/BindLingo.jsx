import {
  reactive,
  useViewEffect,
  createElement,
  render,
  atom,
  computed,
  createRef,
  createComponent,
  propTypes
} from 'axii'
import { message, Input } from 'axii-components'
import ButtonNew from '@/components/Button.new'
import { useVersion } from '@/layouts/VersionLayout'
import { updateProductVersion } from '@/utils/util'
import { Dialog } from '@/components/Dialog/Dialog'

BindLingo.propTypes = {
  callBack: propTypes.function.default(() => () => {})
}

function BindLingo ({ callBack }) {
  const version = useVersion()

  const lingoData = reactive({
    lingoProjectId: version.value?.product?.lingoProjectId
  })

  const visible = atom(false)
  const opt = atom('') // create|bind
  const title = computed(
    () => `${opt.value === 'create' ? '新建' : '绑定'}Lingo项目`
  )

  const formRef = createRef()
  const formItems = [
    {
      label: '项目id',
      key: 'lingoProjectId',
      placeholder: '现有Lingo项目id'
    }
  ]

  const openDialog = (type) => {
    opt.value = type
    visible.value = true
  }

  const handleSure = async () => {
    const optType = opt.value
    const { id: productId } = version.value?.product || {}
    const data = {}
    const formData = new FormData(formRef.current)
    for (const [key, value] of formData) {
      if (!value) {
        message.error('信息不完整')
        return
      }
      data[key] = value
    }
    if (optType === 'bind') {
      // 更新Lingo项目id
      if (productId && optType === 'bind') {
        // await Product.update(productId, { lingoProjectId: data.lingoProjectId })
      }
      // 更新当前数据
      lingoData.lingoProjectId = data.lingoProjectId
    }
    if (optType === 'create') {
      //
    }
    // 重置当前product
    await updateProductVersion(version)
    message.success('成功')
    visible.value = false
    callBack()
  }

  return (
    <container
      block
      flex-display
      flex-direction-column
      flex-align-items-center
      block-padding-top-100px>
      <tip block block-margin-bottom-20px>
        当前迭代未绑定Lingo项目
      </tip>
      <actions>
        <ButtonNew
          inline
          block-margin-right-12px
          onClick={openDialog.bind(this, 'bind')}>
          绑定项目
        </ButtonNew>
        <ButtonNew onClick={openDialog.bind(this, 'create')}>
          新建项目
        </ButtonNew>
      </actions>
      <Dialog
        visible={visible}
        title={title}
        onCancel={() => {
          visible.value = false
        }}
        onSure={handleSure}>
        {() =>
          opt.value === 'bind'
            ? (
            <form onSubmit={(e) => e.preventDefault} ref={formRef}>
              {() =>
                formItems
                  .filter((item) => !item.opt || item.opt === opt.value)
                  .map((item) => {
                    return (
                      <form-item
                        key={item.key}
                        block
                        block-margin-bottom-30px
                        flex-display
                        flex-align-items-center>
                        <div block block-width-120px>
                          {item.label}
                        </div>
                        <Input
                          name={item.key}
                          type="text"
                          maxLength="500"
                          placeholder={item.placeholder}
                          block
                          layout:block-width="240px"
                        />
                      </form-item>
                    )
                  })
              }
            </form>
              )
            : (
            <div>新建Lingo项目？</div>
              )
        }
      </Dialog>
    </container>
  )
}

export default createComponent(BindLingo)

import {
  createElement,
  Fragment,
  atomComputed,
  atom,
  computed,
  createComponent,
  reactive,
  propTypes,
  createRef
} from 'axii'
import ButtonNew from '@/components/Button.new'
import { Page, Product, ProductVersion } from '@/models'
import { useVersion } from '@/layouts/VersionLayout'
import { updateProductVersion } from '@/utils/util'
import WriteIcon from 'axii-icons/Write'
import { Input, message } from 'axii-components'
import { Dialog } from '@/components/Dialog/Dialog'
import { useLcpConfig } from './config'
import { setSaveButton } from '@/store/SaveButton'

LcdpPanel.propTypes = {
  entity: propTypes.object.default(() => reactive({})),
  pageId: propTypes.number.default(() => atom(''))
}

function LcdpPanel ({ entity, pageId }) {
  const version = useVersion()

  const loading = atom(false)

  const opt = atom('') // create|bind|edit
  const visible = atom(false)
  const titleConfig = {
    create: '新建',
    bind: '绑定现有',
    edit: '编辑'
  }
  const title = computed(() => `${titleConfig[opt.value]}千象页面`)
  const formRef = createRef()
  const formItems = [
    {
      label: 'appId',
      key: 'lcdpAppId'
    },
    {
      label: 'pageId',
      key: 'lcdpId'
    },
    {
      label: 'dollyId',
      key: 'dollyId'
    }
  ]

  // 千象
  const { lcdpUrl } = useLcpConfig()

  const createLcdp = async (versionId, pageId) => {
    const { result } = await Page.createLcdp({
      versionId,
      pageId
    })
    if (result?.page && typeof result.page === 'object') {
      entity.lcdpId = result.page.pageId
      entity.dollyId = result.page.dollyId
    }
  }

  const openDialog = async (type) => {
    visible.value = true
    opt.value = type
  }

  const handleSure = async () => {
    loading.value = true
    const optType = opt.value
    const { id: productId, lcdpAppId } = version.value.product || {}
    const data = {}
    if (optType === 'edit' || optType === 'bind') {
      const formData = new FormData(formRef.current)
      for (const [key, value] of formData) {
        if (!value) {
          message.error('信息不完整')
          return
        }
        data[key] = value
      }
      // 更新千象项目id
      if (productId && !lcdpAppId && optType === 'bind') {
        await Product.update(productId, { lcdpAppId: data.lcdpAppId })
      }
      // 更新页面
      await Page.update(pageId.value, { lcdpId: data.lcdpId, dollyId: data.dollyId })
      // 更新当前实例
      entity.lcdpId = data.lcdpId
      entity.dollyId = data.dollyId
    }
    if (optType === 'create') {
      await createLcdp(version.value.id, pageId.value)
      setSaveButton(false)
    }
    // 重置product version
    if (!lcdpAppId) {
      await updateProductVersion(version)
    }
    message.success('成功')
    loading.value = false
    visible.value = false
  }

  return (
    <>
      <panelBlock
        block
        block-margin-bottom-30px
        flex-display
        flex-justify-content-space-between
        flex-align-items-center>
        <label inline inline-w>
          千象页面
        </label>
        <div block block-width="132px" flex-display>
          {() =>
            entity.lcdpId
              ? (
              <a
                href={`${lcdpUrl}/ide?appId=${version.value.product?.lcdpAppId}&pageId=${entity.lcdpId}`}
                target="_blank"
                rel="noreferrer">
                地址
              </a>
                )
              : null
          }
          {() =>
            entity.lcdpId
              ? (
              <action block block-margin-left-12px onClick={openDialog.bind(this, 'edit')} style={{ cursor: 'pointer' }}>
                <WriteIcon />
              </action>
                )
              : (
              <div>
                <ButtonNew
                  inline
                  block-margin-right-12px
                  onClick={openDialog.bind(this, 'bind')}>
                  绑定
                </ButtonNew>
                <ButtonNew onClick={openDialog.bind(this, 'create')}>
                  新建
                </ButtonNew>
              </div>
                )
          }
        </div>
      </panelBlock>
      <Dialog
        visible={visible}
        title={title}
        loading={loading}
        onCancel={() => {
          visible.value = false
        }}
        onSure={handleSure}>
        {
          () =>
            // eslint-disable-next-line multiline-ternary
            opt.value !== 'create' ? (
              <div>
                <form
                  onSubmit={(e) => e.preventDefault}
                  ref={formRef}>
                  {() =>
                    formItems.map((item) => {
                      return (
                        <form-item
                          key={item.key}
                          block
                          block-margin-bottom-30px
                          flex-display
                          flex-align-items-center>
                          <div block block-width-70px>{item.label}</div>
                          <Input
                            name={item.key}
                            type="text"
                            maxLength="15"
                            value={
                              (item.key === 'lcdpAppId' &&
                                version.value.product?.lcdpAppId) || entity[item.key] || ''
                            }
                            disabled={
                              item.key === 'lcdpAppId' &&
                              version.value.product?.lcdpAppId
                            }
                            block
                            layout:block-width="240px"
                          />
                        </form-item>
                      )
                    })
                  }
                </form>
                {
                  () => version.value.product?.lcdpAppId ? <a target="_blank" href={`${lcdpUrl}/app/view/${version.value.product?.lcdpAppId}`} rel="noreferrer">查看项目{version.value.product?.lcdpAppId}</a> : null
                }
              </div>
            ) : (version.value.product?.lcdpAppId
              ? (
              <div>
                在<a target="_blank" href={`${lcdpUrl}/app/view/${version.value.product?.lcdpAppId}`} rel="noreferrer">现有项目{version.value.product?.lcdpAppId}</a>
                中新建千象项目和页面？
              </div>
                )
              : (<div>新建千象项目和页面？</div>))
        }
      </Dialog>
    </>
  )
}

export default createComponent(LcdpPanel)

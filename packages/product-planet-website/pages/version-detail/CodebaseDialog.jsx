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

CodebaseDialog.propTypes = {
  fileType: propTypes.string.default(() => atom('doc')),
  opt: propTypes.string.default(() => atom('create')),
  data: propTypes.string.default(() => reactive({})),
  visible: propTypes.string.default(() => atom(false)),
  handleSubmit: propTypes.function.default(() => () => {}),
  handleNewGit: propTypes.function.default(() => () => {})
}
function CodebaseDialog ({
  fileType,
  data,
  opt,
  visible,
  handleSubmit
}) {
  const loading = atom(false)
  const radioValue = atom('bind')
  const radioOptions = ['bind', 'new']

  const pageTypeOptions = ['tsx', 'jsx']

  const title = computed(
    () => `${opt.value === 'create' ? '添加' : '编辑'}代码仓库`
  )

  const uploadFormRef = createRef()

  const handleCancel = () => {
    visible.value = false
  }

  const inputItems = [
    {
      label: '仓库名称',
      placeholder: 'git仓库名称',
      key: 'projectName'
    },
    {
      label: '仓库ID',
      placeholder: 'git仓库ID',
      key: 'projectId'
    },
    {
      label: '仓库URL',
      placeholder: 'git仓库地址',
      key: 'projectUrl'
    },
    {
      label: '目标分支',
      placeholder: '平台输出代码merge的目标分支，默认master',
      key: 'targetBranch'
    },
    {
      label: '元数据输出路径',
      placeholder: '比如：src/',
      key: 'metadataPath'
    },
    {
      label: '页面输出路径',
      placeholder: '比如：src/pages/',
      key: 'pagePath'
    }
  ]

  const handleSure = async () => {
    loading.value = true
    const resData = {}
    if (opt.value === 'edit' || radioValue.value === 'bind') {
      const formData = new FormData(uploadFormRef.current)
      for (const [key, value] of formData) {
        if (!value) {
          message.error('信息不完整')
          return
        }
        resData[key] = value
      }
    }
    // type: edit|new|bind
    const type = opt.value === 'edit' ? 'edit' : radioValue.value
    await handleSubmit(type, resData)
    loading.value = false
    visible.value = false
  }

  return (
    <Dialog
      visible={visible}
      title={title}
      loading={loading}
      onCancel={handleCancel}
      onSure={handleSure}>
      {() =>
        opt.value === 'create'
          ? (
          <div block block-margin-bottom-40px>
            <Radios
              value={radioValue}
              onChange={(option) => {
                radioValue.value = option
              }}
              renderOption={(option) =>
                option === 'new' ? '新建git项目' : '绑定已有git项目'
              }
              options={radioOptions}
            />
          </div>
            )
          : null
      }
      {() =>
        radioValue.value === 'bind' || opt.value === 'edit'
          ? (
          <form
            name="upload"
            onSubmit={(e) => e.preventDefault}
            ref={uploadFormRef}>
            {inputItems.map((item) => (
              <form-item
                key={item.key}
                block
                block-margin-bottom-10px
                flex-display
                flex-align-items-center>
                <div style={{ width: '100px', textAlign: 'left' }}>
                  {item.label}
                </div>
                <Input
                  name={item.key}
                  type="text"
                  maxLength="500"
                  placeholder={item.placeholder}
                  value={data[item.key] || ''}
                  layout:flex-grow-1></Input>
              </form-item>
            ))}
            <form-item block block-margin-bottom-10px flex-display>
              <div style={{ width: '100px', textAlign: 'left' }}>页面类型</div>
              {
                () => pageTypeOptions.map(item => {
                  return <><input type="radio" name="pageType" value={item} key={item} defaultChecked={item === data.pageType} />{item}</>
                })
              }
            </form-item>
          </form>
            )
          : (
          <div>
            用「产品星球」默认代码模板新建代码仓库？
            <a
              target="_blank"
              href="https://git.corp.kuaishou.com/product-planet-codebase/templates/template-react"
              rel="noreferrer">
              查看模板
            </a>
          </div>
            )
      }
    </Dialog>
  )
}

export default createComponent(CodebaseDialog)

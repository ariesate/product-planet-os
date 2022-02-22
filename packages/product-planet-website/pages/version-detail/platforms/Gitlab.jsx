import {
  createElement,
  Fragment,
  atomComputed,
  atom,
  computed,
  createComponent,
  useRef,
  reactive,
  propTypes,
  createRef,
  watch,
  useViewEffect
} from 'axii'
import { Input, Tabs, message } from 'axii-components'
import { Dialog } from '@/components/Dialog/Dialog'
import { useVersion } from '@/layouts/VersionLayout'
import { Codebase } from '@/models'
import Card from './Card'
import { updateProductVersion } from '@/utils/util'

// Github.propTypes = {
//   fileType:
// }
function Github () {
  const version = useVersion()
  const visible = atom(false)
  const loading = atom(false)

  const activeKey = atom('bind')
  const title = '绑定Github项目'
  const data = reactive({})

  const pageTypeOptions = ['tsx', 'jsx']

  useViewEffect(() => {
    getData()
  })

  const getData = async () => {
    const codebase =
      (await Codebase.findOne({
        where: { product: version.value.product?.id }
      })) || {}
    Object.assign(data, codebase, {})
  }

  const uploadFormRef = createRef()

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

  // -----------------------Codebase操作-----------------------------
  const handleSubmit = async (params = {}) => {
    if (activeKey.value === 'create') {
      if (data.id) {
        message.success('项目已存在')
        return
      }
      await Codebase.createGitProject(version.value.product)
      message.success('创建成功')
    } else if (!data.id && activeKey.value === 'bind') {
      await Codebase.create({
        ...params,
        product: version.value.product?.id
      })
      message.success('绑定成功')
    } else {
      Codebase.update({ id: data.id }, params)
      message.success('更新成功')
    }
    getData()
    updateProductVersion(version)
  }

  const handleSure = async () => {
    loading.value = true
    const resData = {}
    if (activeKey.value === 'bind') {
      const formData = new FormData(uploadFormRef.current)
      for (const [key, value] of formData) {
        if (!value) {
          message.error('信息不完整')
          loading.value = false
          return
        }
        resData[key] = value
      }
    }
    await handleSubmit(resData)
    loading.value = false
    visible.value = false
  }

  const name = atom('Gitlab')
  const desc = atomComputed(() => {
    return data.projectName
      ? `${data.projectName}`
      : '暂未绑定代码仓库'
  })

  return (
    <div>
      <Card
        name={name}
        desc={desc}
        onSet={() => {
          visible.value = true
        }}
        onDetail={() => {
          data.projectUrl && window.open(data.projectUrl)
        }}
      />
      <Dialog
        visible={visible}
        title={title}
        hasHeader={false}
        loading={loading}
        onCancel={() => {
          visible.value = false
        }}
        onSure={handleSure}>
            <content
                block
                block-min-height-100px
                block-margin-top-24px
                flex-display
                flex-direction-column
                flex-justify-content-space-around>
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
                    <div style={{ width: '100px', textAlign: 'left' }}>
                      页面类型
                    </div>
                    {() =>
                      pageTypeOptions.map((item) => {
                        return (
                          <>
                            <input
                              type="radio"
                              name="pageType"
                              value={item}
                              key={item}
                              defaultChecked={item === data.pageType}
                            />
                            {item}
                          </>
                        )
                      })
                    }
                  </form-item>
                </form>
              </content>
      </Dialog>
    </div>
  )
}

Github.Style = (fragments) => {
  const el = fragments.root.elements
  el.card.style({
    border: '1px solid #f0f0f0',
    borderRadius: '8px'
  })
  el.platform.style({
    fontSize: '16px'
  })
  el.name.style({
    fontSize: '14px',
    color: '#8c8c8c'
  })
  el.action.style({
    borderTop: '1px solid #f0f0f0'
  })
  el.opt.style({
    color: 'rgba(0,0,0,.45)',
    cursor: 'pointer'
  })
}

export default createComponent(Github)

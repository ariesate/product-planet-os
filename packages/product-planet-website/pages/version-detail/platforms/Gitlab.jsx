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
import { Input, Tabs, message, Select } from 'axii-components'
import { Dialog } from '@/components/Dialog/Dialog'
import { useVersion } from '@/layouts/VersionLayout'
import { Codebase } from '@/models'
import Card from './Card'
import { updateProductVersion, getEnv } from '@/utils/util'
import Modal from '@/components/Modal'
import { githubConfig } from '@/utils/const'
import api from '@/services/api'

const conf = githubConfig[getEnv()]

function Github () {
  const version = useVersion()
  const visible = atom(false)
  const loading = atom(false)

  const title = '绑定Github项目'
  const data = reactive({})
  const repoList = reactive([])
  const currRepo = atomComputed(() => {
    return {
      id: data.projectId || '',
      name: data.projectName || ''
    }
  })

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

  const getRepoList = async (token) => {
    if (token) {
      const list = (await api.codebase.listGithubRepos({ token })).map(
        (item) => {
          item.name = item.full_name
          return item
        }
      )
      repoList.splice(0, repoList.length, ...list)
    }
  }

  const uploadFormRef = createRef()

  const inputItems = [
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
    if (!data.id) {
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
    const formData = new FormData(uploadFormRef.current)
    const { name: projectName, id: projectId } = currRepo.value
    const resData = { projectName, projectId }
    if (!projectName) {
      message.error('请选择项目')
      loading.value = false
      return
    }
    for (const [key, value] of formData) {
      if (!value) {
        message.error('信息不完整')
        loading.value = false
        return
      }
      resData[key] = value
    }
    await handleSubmit(resData)
    loading.value = false
    visible.value = false
  }

  const name = atom('Gitlab')
  const desc = atomComputed(() => {
    return data.projectName ? `${data.projectName}` : '暂未绑定代码仓库'
  })

  const handleSet = () => {
    if (!version.value?.product?.id) return
    // 检查授权
    const github = JSON.parse(localStorage.getItem('github') || '{}')
    const token = github.access_token
    if (!token) {
      const authUrl = `${conf.authUrl}?client_id=${
        conf.clientId
      }&redirect_uri=${
        conf.backPage
      }?&state=${Math.random().toString()}&scope=user,repo`
      Modal.confirm({
        title: <span>{'确定用github账号授权？'}</span>,
        onOk: () => {
          localStorage.setItem('githubCallBackUrl', window.location.href)
          location.href = authUrl
        }
      })
      return
    }
    getRepoList(token)
    visible.value = true
  }

  return (
    <div>
      <Card
        name={name}
        desc={desc}
        onSet={handleSet}
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
        {() => (
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
              <form-item
                block
                block-margin-bottom-10px
                flex-display
                flex-align-items-center>
                <div style={{ width: '100px', textAlign: 'left' }}>
                  仓库名称：
                </div>
                <Select
                  layout:block
                  layout:flex-grow-1
                  options={repoList}
                  value={currRepo}
                  onChange={(option, { value, optionToValue }) => {
                    if (!optionToValue) return
                    const obj = optionToValue(option) || {}
                    Object.assign(data, {
                      projectId: obj.id,
                      projectName: obj.name,
                      projectUrl: obj.html_url
                    })
                  }}
                />
              </form-item>
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
                    disabled={!!item.disabled}
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
        )}
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

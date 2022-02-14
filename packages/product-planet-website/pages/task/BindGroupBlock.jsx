import { reactive, useViewEffect, createElement, render, atom, computed, createRef, createComponent, propTypes } from 'axii'
import { message, Input, Select } from 'axii-components'
import ButtonNew from '@/components/Button.new'
import { useVersion } from '@/layouts/VersionLayout'
import { ProductVersion, Product } from '@/models'
import { updateProductVersion } from '@/utils/util'
import { Dialog } from '@/components/Dialog/Dialog'
import api from '@/services/api'

BindGroupBlock.propTypes = {
  callBack: propTypes.function.default(() => () => {})
}

function BindGroupBlock ({ callBack }) {
  const version = useVersion()
  const pId = version.value?.product?.teamProjectId

  const projects = reactive([])
  const projectDetail = reactive({})
  const teamData = reactive({})

  const visible = atom(false)
  const opt = atom('') // create|bind
  const title = computed(
    () => `${opt.value === 'create' ? '新建' : '绑定'}迭代`
  )

  const formRef = createRef()
  const formItems = [
    {
      label: 'Team 项目',
      key: 'teamProjectId',
      required: !pId,
      render: () => {
        if (projects.length > 0) {
          return <Select
            layout:inline-width-240px
            options={projects}
            onChange={((option, { value }) => {
              teamData.teamProjectId = value.value.id;
            })}
          />
        } else {
          return <span block>{() => projectDetail.projectName}</span>
        }
      }
    },
    {
      label: '迭代名称',
      key: 'teamSectionName',
      required: true,
      render: () => <Input
        name='teamSectionName'
        type="text"
        maxLength="500"
        placeholder='自定义迭代名称'
        onChange={(_, __, e) => teamData.teamSectionName = e.target.value}
        block
        layout:block-width="240px"
      />
    }
  ]

  useViewEffect(() => {
    fetchData()
  })

  const fetchData = async () => {
    if (!pId) {
      const data = await api.team.getProjects() || []
      projects.push(...data.map(item => ({
        name: item.projectName,
        id: item.projectId
      })))
    } else {
      const data = await api.team.getMembersOfProjects({
        projectId: pId
      })
      if (Array.isArray(data) && data.length > 0) {
        Object.assign(projectDetail, data[0])
      }
    }
  }

  const openDialog = (type) => {
    opt.value = type
    visible.value = true
  }

  const handleSure = async () => {
    const { id: productId } = version.value?.product || {}
    if (formItems.filter(item => item.required).length !== Object.keys(teamData).length) {
      message.error('信息不完整')
      return
    }
    if (pId) {
      teamData.teamProjectId = pId
    }
    await ProductVersion.createTeamGroup({ versionId: version.value?.id, productId, ...teamData })
    await updateProductVersion(version)
    message.success('创建迭代成功')
    visible.value = false
    callBack()
  }

  return (
      <container block flex-display flex-direction-column flex-align-items-center block-padding-top-100px>
        <tip block block-margin-bottom-20px>当前未创建迭代</tip>
        <actions>
          <ButtonNew onClick={openDialog.bind(this, 'create')}>创建迭代</ButtonNew>
        </actions>
        <Dialog
        visible={visible}
        title={title}
        onCancel={() => {
          visible.value = false
        }}
        onSure={handleSure}>
              <div>
                <form
                  onSubmit={(e) => e.preventDefault}
                  ref={formRef}>
                  {() =>
                    formItems.filter(item => (!item.opt || item.opt === opt.value)).map((item) => {
                      return (
                        <form-item
                          key={item.key}
                          block
                          block-margin-bottom-30px
                          flex-display
                          flex-align-items-center>
                          <div block block-width-100px>{item.label}</div>
                          {item.render()}
                        </form-item>
                      )
                    })
                  }
                </form>
              </div>
      </Dialog>
      </container>
  )
}

export default createComponent(BindGroupBlock)

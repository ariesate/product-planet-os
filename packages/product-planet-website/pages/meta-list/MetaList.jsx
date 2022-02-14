/* eslint-disable multiline-ternary */
import { Accordion } from '@/components/Accordion'
import Button from '@/components/Button'
import DropdownMenu from '@/components/DropdownMenu'
import { Meta, MetaGroup } from '@/models'
import {
  createElement,
  createComponent,
  reactive,
  atom,
  useViewEffect,
  atomComputed
} from 'axii'
import { Select, useRequest, message } from 'axii-components'
import GroupIcon from 'axii-icons/Group'
import DataIcon from 'axii-icons/Data'
import ShareIcon from 'axii-icons/ShareOne'
import UploadIcon from 'axii-icons/Upload'
import DeleteIcon from 'axii-icons/Delete'
import CautionIcon from 'axii-icons/Caution'
import MetaListItem from './MetaListItem'
import MetaModal from './MetaModal'
import MetaGroupModal from './MetaGroupModal'
import api from '@/services/api'
import { useVersion } from '@/layouts/VersionLayout'
import IconButton from '@/components/IconButton'
import Modal from '@/components/Modal'

/**
 * @type {import('axii').FC}
 */
function MetaList () {
  const groups = reactive([])
  const items = atom([])
  const selectedGroup = atom()
  const showMetaModal = atom(false)
  const showMetaGroupModal = atom(false)
  const version = useVersion()

  useRequest(
    () => {
      if (!selectedGroup.value) {
        return []
      }
      return Meta.find({
        where: {
          group: selectedGroup.value.id
        }
      })
    },
    {
      data: items,
      processResponse: ({ data }, res) => {
        data.value = res
      }
    }
  )

  const fetchGroups = async (selectId) => {
    const res = await MetaGroup.find({
      where: {
        product: version.value.product.id
      }
    })
    groups.splice(0, groups.length, ...res)
    if (res.length) {
      selectedGroup.value =
        (selectId && res.find((e) => e.id === selectId)) || res[0]
    } else {
      selectedGroup.value = undefined
    }
  }

  const fetchItems = async () => {
    const res = await Meta.find({
      where: {
        group: selectedGroup.value.id
      }
    })
    items.value = res
  }

  const handlePublish = async () => {
    const group = groups.find((e) => e.id === selectedGroup.value.id)
    const sourceList = items.value.map((e) => ({
      sourceId: e.sourceId,
      key: e.name
    }))
    if (!sourceList.length) {
      message.warning('无可发布的数据')
      return
    }
    try {
      if (!group.publishId) {
        const { product } = version.value
        const { publishId } = await api.firefly.createPublish({
          publishName: `产品星球-${group.name}`,
          publishEnName: `product-planet-generated-${group.id}`,
          projectId: product.fireflyId,
          sourceList
        })
        await group.update({
          publishId
        })
        selectedGroup.value = group
      } else {
        const { publishOrder, sourceRelations, publishName } = await api.firefly.getPublish(
          group.publishId
        )
        sourceList.forEach((source) => {
          const relation = sourceRelations.find(
            (e) => e.sourceId === source.sourceId
          )
          if (relation) {
            source.relationId = relation.relationId
          }
        })
        await api.firefly.updatePublish({
          publishId: group.publishId,
          sourceList,
          publishOrder,
          publishName
        })
      }
    } catch (error) {
      message.error(error.message)
      return
    }
    message.success('发布成功')
  }

  const fetchGroupLink = async () => {
    if (!selectedGroup.value.publishId) {
      message.warning('当前分组未发布')
      return
    }
    let link
    try {
      const publish = await api.firefly.getPublish(selectedGroup.value.publishId)
      link = publish.storageKey
    } catch (error) {
      message.error(error.message)
      return
    }
    await navigator.clipboard?.writeText(link)
    console.log(link)
    message.success('已复制到剪贴板')
  }

  useViewEffect(() => {
    fetchGroups()
  })

  return (
    <container block block-padding-15px>
      {() =>
        !groups.length ? (
          <empty
            block
            block-margin-top-100px
            flex-display
            flex-direction-column
            flex-align-items-center>
            <p>当前项目无数据分组</p>
            <Button
              onClick={() => {
                showMetaGroupModal.value = true
              }}>
              添加分组
            </Button>
          </empty>
        ) : (
          <div block block-width="100%">
            <div
              block
              flex-display
              flex-align-items-center
              block-margin-bottom-24px>
              <span inline inline-margin-right-8px>
                分组
              </span>
              <Select
                layout:block-margin-right-16px
                options={groups}
                value={selectedGroup}
                renderOption={(option) => option.name}
              />
              <DropdownMenu
                layout:block-margin-right-auto
                options={[
                  {
                    title: '数据',
                    icon: DataIcon,
                    onClick: () => {
                      showMetaModal.value = true
                    }
                  },
                  {
                    title: '分组',
                    icon: GroupIcon,
                    onClick: () => {
                      showMetaGroupModal.value = true
                    }
                  }
                ]}>
                <Button primary>添加</Button>
              </DropdownMenu>
              <IconTextButton
                layout:block
                layout:block-margin-right-10px
                disabled={atomComputed(() => !items.value?.length)}
                icon={UploadIcon}
                onClick={handlePublish}>
                发布
              </IconTextButton>
              <IconTextButton
                layout:block
                layout:block-margin-right-10px
                disabled={atomComputed(() => !selectedGroup.value?.publishId)}
                icon={ShareIcon}
                onClick={fetchGroupLink}>
                获取链接
              </IconTextButton>
              <IconButton
                icon={DeleteIcon}
                iconFill="#ff3d3d"
                fill="none"
                onClick={async () => {
                  Modal.confirm({
                    title: (
                      <span>
                        {Modal.titleIcon(CautionIcon, '#FBBD1B')}
                        确认删除当前分组？
                      </span>
                    ),
                    onOk: async () => {
                      await MetaGroup.remove(selectedGroup.value.id)
                      await fetchGroups()
                    }
                  })
                }}
              />
            </div>
            <list>
              {() => {
                if (!items.value?.length) {
                  return (
                    <div
                      block
                      block-margin-top-100px
                      flex-display
                      flex-direction-column
                      flex-align-items-center>
                      <p>当前分组无数据</p>
                      <Button
                        onClick={() => {
                          showMetaModal.value = true
                        }}>
                        添加数据
                      </Button>
                    </div>
                  )
                }
                return (
                  <Accordion strict={false}>
                    {items.value.map((item) => (
                      <MetaListItem
                        key={item.id}
                        item={item}
                        onRemoved={fetchItems}
                      />
                    ))}
                  </Accordion>
                )
              }}
            </list>
          </div>
        )
      }
      <MetaModal
        visible={showMetaModal}
        group={selectedGroup}
        onCreated={fetchItems}
      />
      <MetaGroupModal
        visible={showMetaGroupModal}
        onCreated={async (id) => {
          await fetchGroups(id)
        }}
      />
    </container>
  )
}

function IconTextButton ({ children, icon, ...props }) {
  return (
    <Button {...props}>
      <div inline flex-display flex-align-items-center inline-font-size-0>
        {createElement(icon, {
          size: '14',
          unit: 'px',
          inline: true,
          'inline-margin-right': '4px'
        })}
        <span inline inline-font-size-14px inline-line-height-14px>
          {children}
        </span>
      </div>
    </Button>
  )
}

export default createComponent(MetaList)

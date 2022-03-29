/** @jsx createElement */
import {
  createElement,
  createComponent,
  reactive,
  atom,
  useContext,
  computed
} from 'axii'
import { Select } from 'axii-components'
import { Entity, ModelGroup } from '@/models'
import { k6 } from 'axii-x6'

const { ShareContext } = k6

export default createComponent((() => {
  const ModelConfigPanel = (props) => {
    const { data, node } = props
    const isMultiSelect = computed(() => Array.isArray(node))
    const shareContext = useContext(ShareContext)
    console.log('shareContext', shareContext)
    const modelGroups = reactive([{ name: '不分组', id: -1 }])
    const groupValue = atom({ name: '', id: '' })

    const initGroup = () => {
      ModelGroup.find({
        where: {
          version: shareContext.versionId
        }
      }).then((res) => {
        if (res && res.length > 0) {
          modelGroups.push(...res)
          // const groupId = data.value.groupId
          const groupId = computed(() => {
            if (isMultiSelect.value) {
              if (!data.value?.length || data.value.length < 1) return null
              const hasEqualGroupId = data.value.every(item => item.groupId === data.value[0].groupId)
              return hasEqualGroupId ? data.value[0].groupId : null
            }
            return data.value?.groupId
          })
          if (groupId.value) {
            groupValue.value = modelGroups.find(item => item.id === groupId.value) || { name: '', id: '' }
          }
        }
      })
    }
    initGroup()

    const changeModelGroup = (item) => {
      if (isMultiSelect.value) {
        node.forEach(n => {
          shareContext.onChangeNode(n.id, { data: { groupId: item.id } })
          Entity.update({ id: n.id }, { groupId: item.id })
        })
      } else {
        shareContext.onChangeNode(node.id, { data: { groupId: item.id } })
        Entity.update({ id: node.id }, { groupId: item.id })
      }
    }

    const getPanelStyle = computed(() => {
      if (isMultiSelect.value) {
        return {
          width: '368px',
          backgroundColor: '#fff',
          border: '1px solid #aaa',
          padding: '16px'
        }
      }
      return {
        width: '368px',
        backgroundColor: '#fff',
        border: '1px solid #aaa',
        borderBottom: '0px solid',
        padding: '16px 16px 0px 16px'
      }
    })

    return (
        <modelConfigPanel block style={getPanelStyle}>
          <panelBlock>
            <label>{isMultiSelect.value ? '批量分组' : '所属组'}</label>
            <operation block>
              <Select
                value={groupValue}
                options={modelGroups}
                onChange={changeModelGroup}
              ></Select>
            </operation>
          </panelBlock>
        </modelConfigPanel>
    )
  }

  ModelConfigPanel.Style = (frag) => {
    const el = frag.root.elements
  }

  return ModelConfigPanel
})())

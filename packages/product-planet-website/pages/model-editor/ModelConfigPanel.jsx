/** @jsx createElement */
import {
  createElement,
  createComponent,
  reactive,
  atom,
  useContext
} from 'axii'
import { Select } from 'axii-components'
import { Entity, ModelGroup } from '@/models'
import { k6 } from 'axii-x6'

const { ShareContext } = k6

export default createComponent((() => {
  const ModelConfigPanel = (props) => {
    const { data, node } = props
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
          const groupId = node.data.groupId
          if (groupId) {
            groupValue.value = modelGroups.find(item => item.id === groupId) || { name: '', id: '' }
          }
        }
      })
    }
    initGroup()

    const changeModelGroup = (item) => {
      shareContext.onChangeNode(node.id, { data: { groupId: item.id } })
      Entity.update({ id: node.id }, { groupId: item.id })
    }

    return (
          <modelConfigPanel block>
            <panelBlock>
              <label>所属组</label>
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
    el.modelConfigPanel.style({
      width: '400px',
      backgroundColor: '#fff',
      border: '1px solid #aaa',
      borderBottom: '0px solid',
      padding: '16px 16px 0px 16px'
    })
  }

  return ModelConfigPanel
})())

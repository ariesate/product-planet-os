import {
  createElement,
  createComponent,
  propTypes,
  atom,
  useViewEffect,
  reactive
} from 'axii'
import { ModelGroup } from '@/models'
import { useVersion } from '@/layouts/VersionLayout'
import ButtonNew from '@/components/Button.new'
import Dialog from '@/components/Dialog'
import { Select } from 'axii-components'
import Setting from 'axii-icons/SettingTwo'

GroupSettingCpt.propTypes = {
  visible: propTypes.bool.default(() => atom(false)),
  onChangeGroupList: propTypes.function.default(() => {}),
  versionId: propTypes.number.isRequired,
  groupList: propTypes.array.default(() => atom([]))
}

function GroupSettingCpt ({ visible, onChangeGroupList, groupList, versionId }) {
  const isAdd = atom(false)

  const itemList = reactive([...groupList.value])
  const addGroupName = atom('')
  const editGroupName = atom('')

  const handleSubmit = () => {
    if (isAdd.value) {
      isAdd.value = false
    }
    visible.value = false
  }

  const onChangeAddItem = (e) => {
    addGroupName.value = e.target.value
  }
  const onChangeEditItem = (e) => {
    editGroupName.value = e.target.value
  }
  const onAddItem = async () => {
    const id = await ModelGroup.create({ name: addGroupName.value, version: versionId.value })
    itemList.push({ id: id, name: addGroupName.value, version: versionId.value })
    onChangeGroupList(itemList)
    isAdd.value = false
  }
  const onDeleteItem = (id, index) => {
    ModelGroup.remove(id)
    itemList.splice(index, 1)
    onChangeGroupList(itemList)
  }
  const onEditItem = (item, index) => {
    ModelGroup.update(item.id, { name: editGroupName.value })
    itemList[index].name = editGroupName.value
    onChangeGroupList(itemList)
  }

  function ListItem ({ item, index }) {
    const isEdit = atom(false)
    const onConfirmEdit = (item, index) => {
      onEditItem(item, index)
      isEdit.value = false
    }
    return (
        <item block block-margin-bottom={'7px'}>
          {() => !isEdit.value
            ? (
            <showItem>
              <itemName inline inline-margin-right={'10px'} style={{ width: '147px' }}>{item.name}</itemName>
              <ButtonNew size="small" style={{ marginRight: '10px' }} onClick={() => onDeleteItem(item.id, index)}>??????</ButtonNew>
              <ButtonNew size="small" onClick={() => { isEdit.value = true }} primary>??????</ButtonNew>
            </showItem>
              )
            : (
            <editItem>
              <input value={item.name} style={{ marginRight: '10px' }} placeholder="?????????????????????" onBlur={onChangeEditItem}></input>
              <ButtonNew size="small" onClick={() => { isEdit.value = false }} style={{ marginRight: '10px' }}>??????</ButtonNew>
              <ButtonNew size="small" primary onClick={() => onConfirmEdit(item, index)}>??????</ButtonNew>
            </editItem>
              )
          }
        </item>
    )
  }
  return (
        <Dialog
          title="????????????"
          visible={visible}
          onSure={handleSubmit}
          hasCancelBtn={false}
          width="600px">
          <container
            block
            flex-display
            flex-direction-column
            flex-align-items-center>
              {() => itemList.map((item, i) => (<ListItem key={i} item={item} index={i}/>))}
              {() => isAdd.value
                ? (
              <editItem block block-margin-bottom={'7px'}>
                <input onBlur={onChangeAddItem} style={{ marginRight: '10px' }} placeholder="?????????????????????"></input>
                <ButtonNew size="small" onClick={() => { isAdd.value = false }} style={{ marginRight: '10px' }}>??????</ButtonNew>
                <ButtonNew size="small" primary onClick={onAddItem}>??????</ButtonNew>
              </editItem>
                  )
                : null}
            <ButtonNew style={{ width: '255px' }} size='small' onClick={() => { isAdd.value = true }}>????????????</ButtonNew>
          </container>
      </Dialog>
  )
}
GroupSettingCpt.Style = (frag) => {

}
export const GroupSetting = createComponent(GroupSettingCpt)

GroupEditor.propTypes = {
  onChangeSelectedGroup: propTypes.function.default(() => {}),
  onChangeGroups: propTypes.function.default(() => {})
}

function GroupEditor ({ onChangeSelectedGroup, onChangeGroups }) {
  const version = useVersion()
  const versionId = version.value.id
  const groupList = atom(null)
  const visible = atom(false)

  const selectedGroup = atom({ name: '', id: '' })
  const emptyGroupOption = { name: '???', id: '-1' }
  const groupOptions = atom([emptyGroupOption])

  useViewEffect(() => {
    ModelGroup.find({
      where: {
        version: versionId
      }
    }).then((res) => {
      groupList.value = res
      groupOptions.value = [emptyGroupOption, ...res]
      onChangeGroups(res)
    })
  })

  const openSetting = () => {
    visible.value = true
  }

  const onChangeGroupList = (list) => {
    groupOptions.value = [emptyGroupOption, ...list]
    onChangeGroups(list)
  }

  return (
        <editor>
          <groupLabel>??????</groupLabel>
          {() => (
            <Select
              layout:inline-height='24px'
              layout:inline-width="120px"
              layout:inline-margin-left="8px"
              value={selectedGroup}
              options={groupOptions.value}
              onChange={onChangeSelectedGroup}
            ></Select>
          )}
          <icon inline-block onClick={openSetting}>
              <Setting size='18' unit='px' style={{ position: 'relative', top: '50%', transform: 'translateY(-50%)' }}/>
          </icon>
          {() => groupList.value ? (<GroupSetting visible={visible} onChangeGroupList={onChangeGroupList} groupList={groupList} versionId={versionId} />) : null}
        </editor>
  )
}

GroupEditor.Style = (frag) => {
  const el = frag.root.elements
  el.groupLabel.style({
    color: '#000'
  })
  el.icon.style({
    cursor: 'pointer',
    marginLeft: '5px'
  })
}

export default createComponent(GroupEditor)

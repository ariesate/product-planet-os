import { Dialog } from '@/components/Dialog/Dialog'
import {
  createElement,
  useViewEffect,
  atom,
  reactive,
  createComponent,
  watch,
  traverse,
  atomComputed
} from 'axii'
import { message } from 'axii-components'
import { useVersion } from '@/layouts/VersionLayout'
import { Rule } from '@/models'
import ButtonNew from '@/components/Button.new'
import RuleDialog from './RuleDialog'
import RuleListItem, { RULE_CACHE_KEY } from './RuleListItem'

function RuleList ({ ruleId }) {
  const version = useVersion()
  const rules = reactive([])

  const addDialogVisible = atom(false)
  const addDialogType = atom('create')
  const initialValues = reactive({
    id: undefined,
    name: undefined,
    key: undefined,
    type: 'map'
  })

  const deleteDialogVisible = atom(false)
  const deleteData = reactive({
    id: undefined,
    name: undefined
  })

  const expandKey = atom()

  useViewEffect(() => {
    refreshRules()
  })

  watch(
    () => traverse(version.value.id),
    () => {
      refreshRules()
    }
  )

  const submitCallback = async (data = {}) => {
    const { name, key, id } = data
    if (addDialogType.value === 'create') {
      if (rules.some((rule) => rule.key === key)) {
        message.warning(`元数据Key【${key}】已存在`)
        return
      }
      const rule = await Rule.create(
        { ...data, version: version.value.id },
        Object.keys(data)
      )
      rules.push(rule)
      window.localStorage.setItem(RULE_CACHE_KEY, rule.content || '')
      expandKey.value = rule.id
    } else if (addDialogType.value === 'edit' && id) {
      await Rule.update(id, { name, key, version: version.value.id })
      await refreshRules()
    }

    Object.assign(initialValues, {
      id: undefined,
      name: undefined,
      key: undefined
    })
    addDialogVisible.value = false
  }

  const refreshRules = async () => {
    const list = await Rule.find({
      where: { version: version.value.id }
    })
    rules.splice(0, rules.length, ...list)
  }

  const handleUpdateRule = async (data = {}, silent) => {
    const { name, key, id, content } = data
    // 查重
    const tempRule = rules.find((rule) => rule.key === key && rule.id !== id)
    if (tempRule) {
      message.warning(`元数据KEY【${key}】已存在`)
      await refreshRules()
      return
    }
    await Rule.update(id, { name, key, content })
    await refreshRules()
    if (!silent) {
      message.success('保存成功')
    }
  }

  const handleAddClick = () => {
    addDialogType.value = 'create'
    addDialogVisible.value = true
  }

  const handleRuleOpt = (type, rule) => {
    if (type === 'see') {
      ruleId.value = rule.id
    } else if (type === 'delete') {
      Object.assign(deleteData, rule)
      deleteDialogVisible.value = true
    } else if (type === 'edit') {
      Object.assign(initialValues, rule)
      addDialogType.value = 'edit'
      addDialogVisible.value = true
    }
  }

  const handleDelete = async () => {
    if (deleteData.id) {
      try {
        await Rule.remove(deleteData.id)
        const index = rules.findIndex((e) => e.id === deleteData.id)
        if (index >= 0) {
          rules.splice(index, 1)
        }
        Object.assign(deleteData, {
          id: undefined,
          name: undefined
        })
        message.success('删除成功')
        deleteDialogVisible.value = false
      } catch (e) {
        message.error(e)
      }
    }
  }
  const renderList = () => {
    return (
      <div block>
        {() =>
          rules.map((rule) => (
            <RuleListItem
              key={rule.id}
              expandKey={expandKey}
              rule={rule}
              onDelete={() => handleRuleOpt('delete', rule)}
              onExpand={(key) => {
                expandKey.value = key
              }}
              onSave={handleUpdateRule}
            />
          ))
        }
      </div>
    )
  }

  const renderDeleteDialog = () => {
    return (
      <Dialog
        visible={atomComputed(() => deleteDialogVisible.value)}
        title="删除元数据"
        onSure={handleDelete}
        onCancel={() => {
          deleteDialogVisible.value = false
        }}>
        <div>确认删除元数据 {() => deleteData.name || ''} ?</div>
      </Dialog>
    )
  }

  return (
    <container>
      <div block flex-display block-margin-bottom-24px>
        <ButtonNew primary onClick={handleAddClick}>
          新增元数据
        </ButtonNew>
      </div>
      <RuleDialog
        type={addDialogType}
        visible={addDialogVisible}
        initialValues={initialValues}
        submitCallback={submitCallback}
      />
      {renderList()}
      {renderDeleteDialog()}
    </container>
  )
}

RuleList.Style = (fragments) => {
  fragments.root.elements.rule.style({
    backgroundColor: '#ffffff'
  })
  fragments.root.elements['rule-title'].style({
    fontSize: '22px'
  })
  fragments.root.elements['opt'].style({
    fontSize: '16px',
    margin: '0 5px',
    cursor: 'pointer'
  })
}

export default createComponent(RuleList)

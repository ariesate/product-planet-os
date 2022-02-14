import { message } from 'axii-components'
import Button from '@/components/Button.new'
import RuleEditor from '@/components/RuleEditor'
import { Rule } from '@/models'
import {
  createElement,
  createComponent,
  atom,
  useViewEffect,
  reactive,
  watchReactive
} from 'axii'

function getDefault () {
  return {
    columns: [
      {
        key: 'col-1',
        name: '列名',
        type: 'string'
      }
    ],
    rows: [
      {
        key: 'row-1',
        name: '行名'
      }
    ],
    data: [['数据']]
  }
}

/**
 * @type {import('axii').FC}
 */
function RuleDetail ({ id }) {
  const rule = atom()
  const isDisabled = atom(true)
  const content = reactive(getDefault())

  const handleClose = () => {
    id.value = null
  }

  const handleSave = async () => {
    try {
      await rule.value.update({
        content: JSON.stringify(content)
      })
    } catch (error) {
      message.error('保存失败')
      throw error
    }
    message.success('保存成功')
    isDisabled.value = true
  }

  watchReactive(content, () => {
    isDisabled.value = JSON.stringify(content) === rule.value.content
  })

  useViewEffect(() => {
    Rule.findOne({ where: { id: id.value } }).then((res) => {
      rule.value = res
      if (res.content) {
        const data = JSON.parse(res.content)
        Object.assign(content, data)
      }
    })
  })

  return (
    <container>
      <line
        block
        block-padding-right-24px
        flex-display
        flex-justify-content-space-between>
        <tip>双击表头进行编辑；右键点击表头打开更多操作菜单</tip>
        <group>
          <Button onClick={handleClose}>返回</Button>
          <Button primary disabled={isDisabled} onClick={handleSave}>
            保存修改
          </Button>
        </group>
      </line>
      <RuleEditor source={content} />
    </container>
  )
}

RuleDetail.Style = (fragments) => {
  fragments.root.elements.tip.style({
    color: '#c7c7c7',
    fontSize: '14px'
  })
}

export default createComponent(RuleDetail)

import {
  createElement,
  atom,
  createComponent,
  reactive,
  propTypes,
  useViewEffect
} from 'axii'
import { LogMessage, projectActionCode } from '@/models'

const status = {
  unStart: 0, // 未开始
  start: 1, // 进行中
  done: 2 // 已完成
}

const name = {
  design: '设计',
  fe: '前端开发',
  be: '后端开发',
  test: '测试'
}

ScheduleItemCom.propTypes = {
  statusName: propTypes.string.default(() => atom('')),
  itemStatus: propTypes.string.default(() => atom(''))
}

function ScheduleItemCom ({ statusName, itemStatus }) {
  const getItemStatus = () => {
    const statusDes = reactive({
      pre: '',
      after: ''
    })
    switch (itemStatus) {
      case status.start: {
        statusDes.after = '中'
        break
      }
      case status.done: {
        statusDes.after = '完成'
        break
      }
      default: {
        statusDes.after = '未开始'
        break
      }
    }
    return `${statusDes.pre}${statusName.value}${statusDes.after}`
  }
  return (
          <item block flex-display flex-align-items-center>
              <div></div>
              <span>{getItemStatus()}</span>
          </item>
  )
}
ScheduleItemCom.Style = (frag) => {
  const el = frag.root.elements
  el.item.style({
    height: '17px',
    padding: '10px 15px 0 15px'
  })
  el.div.style(({ itemStatus }) => {
    const color = itemStatus.value === status.unStart ? '#8C8C8C' : itemStatus.value === status.start ? '#00AD45' : '#3791F7'
    return {
      display: 'inline-block',
      height: '5px',
      width: '5px',
      borderRadius: '50%',
      marginRight: '5px',
      backgroundColor: color,
      boxShadow: `0px 0px 1px 1px ${color}`
    }
  })
  el.span.style({
    width: '100%',
    lineHeight: '14px',
    fontSize: '12px',
    color: '#666'
  })
}
export const ScheduleItem = createComponent(ScheduleItemCom)

function ScheduleBox ({ pageId }) {
  const scheduleStatus = reactive({
    design: status.unStart,
    fe: status.unStart,
    be: status.unStart,
    test: status.unStart
  })

  useViewEffect(() => {
    LogMessage.getPageProcess({ pageId }).then(r => {
      scheduleStatus.design = r[projectActionCode.design] ? status.done : status.unStart
      scheduleStatus.fe = r[projectActionCode.fe] ? status.done : status.unStart
      scheduleStatus.be = r[projectActionCode.be] ? status.done : status.unStart
    })
  })

  return (
          <scheduleBox block >
              <ScheduleItem statusName = {name.design} itemStatus = {scheduleStatus.design} />
              <ScheduleItem statusName = {name.fe} itemStatus = {scheduleStatus.fe} />
              <ScheduleItem statusName = {name.be} itemStatus = {scheduleStatus.be} />
              <ScheduleItem statusName = {name.test} itemStatus = {scheduleStatus.test} />
          </scheduleBox>
  )
}
ScheduleBox.Style = (frag) => {
  const el = frag.root.elements
  el.scheduleBox.style = ({
    weight: '100%',
    height: '100%',
    padding: '8px'
  })
}

export default createComponent(ScheduleBox)

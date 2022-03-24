/**
 * 在查询历史中，作为关联关系的补充抽象，
 * 类似 LinkPort的page是number，不是rel, 但在逻辑上却还是指向Page.id，这种就是遗漏的n:1关系
 */
const relationPolyfill = [
  {
    source: 'LinkPort',
    sourceField: 'page',
    target: 'Page'
  },
  {
    validate (data = {}) {
      return data?.destinationType === 'pageStatus'
    },
    source: 'Action',
    sourceField: 'destinationValue',
    target: 'PageStatus'
  },
  {
    source: 'Action',
    sourceField: 'nextActionId',
    target: 'Action'
  }
  // {
  //   validate (data = {}) {
  //     return data?.destinationType === 'pageStatus'
  //   },
  //   source: 'Action',
  //   sourceField: 'x',
  //   target: 'PageStatus',
  //   targetField: 'y'
  // }
]
export default relationPolyfill

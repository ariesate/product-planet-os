import { getTaskInfos } from './team.api.js'
import { PARTIAL_ACCESS_KEY } from '../dependence/bootstrap/version.js'

/**
 * 获取完整的timeline，聚合page或pageStatus信息
 * @export
 * @param {API.ER_APIs} apis
 */
export async function getTimeline (apis, param) {
  const [useCase] = await apis.find('UseCase', {
    id: param.id
  }, {}, {
    id: true,
    version: true,
    actions: true
  })

  if (useCase) {
    // TIP：由于action的特殊性，如果标记为删除的，需要在返回前端的时候进行过滤
    useCase.actions = await Promise.all(useCase.actions.filter(action => {
      return action[PARTIAL_ACCESS_KEY] ? !action[PARTIAL_ACCESS_KEY].versionRemove : true
    }).map(async action => {
      const m = {
        page: {
          entity: 'Page',
          fields: { id: true, name: true }
        },
        status: {
          entity: 'PageStatus',
          fields: { id: true, name: true, page: { id: true, name: true } }
        },
        pageStatus: {
          entity: 'PageStatus',
          fields: { id: true, name: true, page: { id: true, name: true } }
        }
      }
      const name = m[action.destinationType]
      let result = Object.assign({}, action)
      if (name) {
        const [r] = await apis.find(name.entity, { id: action.destinationValue }, { limit: 1 }, name.fields)
        if (r) {
          if (action.destinationType === 'page') {
            if (r[PARTIAL_ACCESS_KEY]?.lcdpId !== undefined) {
              delete r[PARTIAL_ACCESS_KEY]
            }
          } else {
            delete r[`page_${PARTIAL_ACCESS_KEY}`]
          }
          result = Object.assign(result, r, action)
        }
      }
      return result
    }))
  }

  return useCase
}

/**
 * 获取 taskInfo 信息
 * @export
 * @param {API.ER_APIs} apis
 */
export async function getTaskInfosAndUseCase (apis, params) {
  const useCases = await apis.find(
    'UseCase',
    { version: params.versionId },
    { limit: null },
    { id: true, name: true, taskId: true, actions: true }
  )
  return await Promise.all(useCases.map(async usecase => {
    let infos = {}
    if (usecase.taskId) {
      infos = await getTaskInfos.call(this, apis, {
        taskIds: usecase.taskId.split(',')
      })
    }
    const { actions } = await getTimeline(apis, { id: usecase.id })
    usecase.actions = actions
    return {
      ...usecase,
      infos
    }
  }))
}

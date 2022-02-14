import { getTaskInfos } from './team.api.js'

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
    useCase.actions = await Promise.all(useCase.actions.map(async action => {
      const m = {
        page: 'Page',
        status: 'PageStatus'
      }
      const name = m[action.destinationType]
      if (name) {
        const [r] = await apis.find(name, { id: action.destinationValue }, { limit: 1 })
        let result = {}
        if (r) {
          result = Object.assign(result, r, action)
        }
        const r2 = await apis.find('PagePin', { action: action.id })
        result.pins = r2
        return result
      }
      return action
    }))
  }

  return useCase
}

/**
 * 获取 taskInfo 信息
 * @export
 * @param {API.ER_APIs} apis
 */
export async function getTaskInfosAndUseCase(apis, params) {
  const useCases = await apis.find('UseCase', {
    version: params.versionId
  }, {
    limit: null
  })
  return await Promise.all(useCases.map(async usecase => {
    let infos = {}
    if (usecase.taskId) {
      infos = await getTaskInfos.call(this, apis, {
        taskIds: usecase.taskId.split(','),
      })
    }
    return {
      ...usecase,
      infos
    }
  }))
}
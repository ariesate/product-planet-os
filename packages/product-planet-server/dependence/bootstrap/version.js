import path from 'path'
import fs from 'fs'
import { isObject, mapValues, loadJSON, cloneDeep } from '../util.js'
import mergeWith from 'lodash/mergeWith.js'
import relationPolyfill from '../../app/planet.storage.history.polyfill.js'
import logger from '../../logger.js'

// logger.info = console.log.bind(console)

export const HTTP_HEADER_VERSION_TAG = 'pp-version'
export const HTTP_HEADER_GROUP_TAG = 'pp-version-group'

const ROOT_ENTITY = ['ProductVersion', 'User', 'Product', 'Resource', 'VersionStatus']

export const PARTIAL_ACCESS_KEY = '_versionPartial'

const idPostfix = '_version'

function isRoot (er, id) {
  return ROOT_ENTITY.includes(er.entities.find(e => e.id === id)?.name)
}

function removeRoot (er) {
  er = cloneDeep(er)
  er.entities.forEach(({ name, fields }) => {
    fields.forEach(f => {
      if (f.type === 'rel') {
        const relation = er.relations.find(r => r.source.field === f.id || r.target.field === f.id)
        if (relation && (isRoot(er, relation.source.entity) || isRoot(er, relation.target.entity))) {
          f.type = 'number'
        }
      }
    })
  })
  return er
}

/**
 * 查找ROOT下的所有需要建历史表的关联实体，
 */
function findERByRelation (er, versionEntities, extraER) {
  if (!extraER) {
    extraER = { entities: versionEntities, relations: [] }
  }
  const relFields = []
  /**
   * 查找当前entities里的所有有关联关系的field，和 entityId
   */
  versionEntities.forEach(({ id, name, fields }) => {
    fields.forEach(field => {
      if (field.type === 'rel') {
        relFields.push({
          field,
          entityId: id
        })
      }
    })
  })

  /**
   * 1.通过field和entityId查到对应的relation
   * 2.确定当前field是source或target
   */
  const entityIds = []
  relFields.forEach(({ field, entityId }) => {
    er.relations.forEach(relation => {
      if (relation.source.field === field.id && !isRoot(er, relation.target.entity)) {
        entityIds.push({
          id: relation.target.entity,
          relation
        })
      } else if (relation.target.field === field.id && !isRoot(er, relation.source.entity)) {
        entityIds.push({
          id: relation.source.entity,
          relation
        })
      }
    })
  })
  const entitiesInRelation = []

  entityIds.forEach(({ id, relation }) => {
    const e = er.entities.find(e => e.id === id)
    const existsE = extraER.entities.find(e => e.id === id)
    const existsR = extraER.relations.find(r => r.id === relation.id)

    // 手动禁止涉及ProductVersion遍历
    if (e && !existsE && e.name) {
      entitiesInRelation.push(e)
      extraER.entities.push(e)
    }
    if (!existsR) {
      extraER.relations.push(relation)
    }
  })
  // 有存量关联关系，继续遍历直到没有关联关系
  if (entitiesInRelation.length > 0) {
    findERByRelation(er, entitiesInRelation, extraER)
  }

  return extraER
}

/**
 * v1：拓展需要记录增量的表结构
 * 1.n:n关系的处理？只有一个n需要版本的控制的场景暂不处理
 * --
 * v2：在v1的基础上，将所有涉及到的关联关系表都生成一份历史表
 * 1.根据 tables，递归所有的嵌套关联关系所对应的 entity 并生成一个versionHistory { entities, relations }
 *   1.1 entities 保存 entity[]，并修改其中的 field.type = rel，指向新的historyEntity
 *   1.2 relations，根据 rel的新指向，修改 target,source，id（id也要加上postfix，不然因为有可能跟原来 storage.json重复）
 * 2.生成到 runtime下
 * 3.修改 services/storage/index#setup，加入新增的history.relations
 * @param er
 * @param versionTable
 */
function filerER (er, versionTable) {
  const { tables, extraColumn, entityPostfix } = versionTable
  const { entities, relations } = er
  // 增量涉及的实体
  const versionEntities = []
  // 过滤并修正
  entities.forEach(entity => {
    if (tables.includes(entity.name)) {
      versionEntities.push(entity)
    }
  })
  // v2逻辑
  // 需要仅保存历史的实体
  const versionHistoryER = findERByRelation(er, versionEntities.slice())

  // 防重复计数器
  let count = 0
  const timestamp = Date.now()

  // 1.重命名历史表结构
  versionHistoryER.entities = versionHistoryER.entities.map(entity => {
    entity = cloneDeep(entity)
    entity.name += entityPostfix.history
    entity.id += idPostfix + entityPostfix.history
    entity.fields.forEach(field => {
      field.id += idPostfix + entityPostfix.history
    })

    for (const [fieldName, type] of Object.entries(extraColumn)) {
      entity.fields.push({
        id: `${timestamp}_version_extra_${count++}`,
        name: fieldName,
        type,
        isCollection: false
      })
    }

    return entity
  })
  versionHistoryER.relations = versionHistoryER.relations.map(relation => {
    relation = cloneDeep(relation)
    relation.id += `_${entityPostfix.history}`
    relation.source.entity += idPostfix + entityPostfix.history
    relation.source.field += idPostfix + entityPostfix.history
    relation.target.entity += idPostfix + entityPostfix.history
    relation.target.field += idPostfix + entityPostfix.history
    return relation
  })

  // 2.重命名增量表结构
  const multiVersionEntities = [
    // entityPostfix.history,
    entityPostfix.partial
  ].map(postfix => {
    return versionEntities.map((entity) => {
      entity = cloneDeep(entity)
      entity.name += postfix

      entity.fields.forEach(field => {
        field.id += idPostfix
        if (field.type === 'rel') {
          // 1.增量表需要去除"”关联关系
          if (postfix === entityPostfix.partial) {
            field.type = 'number'
          } else if (postfix === entityPostfix.history) {
            // 2.历史表应该保留，这里v2功能还没完成，先保留
            field.type = 'number'
          }
        }
      })

      entity.id += idPostfix

      for (const [fieldName, type] of Object.entries(extraColumn)) {
        entity.fields.push({
          id: `${timestamp}_version_extra_${count++}`,
          name: fieldName,
          type,
          isCollection: false
        })
      }
      return entity
    })
  })

  return { partialEntities: multiVersionEntities.flat(), versionHistoryER }
}

/**
 * @param {import('@/dependence/bootstrap/bootstrap.js').SystemAPIs} systemHandle
 * @returns
 */
export async function initVersion (systemHandle) {
  const { dir, moduleConfig, versionTable } = systemHandle

  const config = moduleConfig.storage

  /** @type {{entities: ER.RawEntity[], relations: ER.RawRelation[]}} */
  const er = await loadJSON(path.join(dir.app, '/', config.options?.storageData))

  const { partialEntities, versionHistoryER } = filerER(removeRoot(er), versionTable)

  fs.writeFileSync(path.join(dir.runtime, '/', versionTable.versionHistoryJSON), JSON.stringify({
    ...versionHistoryER
  }, null, 2))

  // console.log('[initVersion] history entities=', versionHistoryER.entities.map(e => e.name))

  fs.writeFileSync(path.join(dir.runtime, '/', versionTable.versionJSON), JSON.stringify({
    entities: partialEntities
  }, null, 2))

  // console.log('[initVersion] partial entities=', partialEntities.map(e => e.name))
}

export const versionStatusMap = {
  INIT: 'init',
  DONE: 'done',
  UNDONE: 'undone',
  HOLD: 'hold',
  DRAFT: 'draft',
  ARCHIVE: 'archive'
}
/**
 * 判断当前版本是否完成，兼容历史数据的currentStatus为空的情况
 */
export function isVersionDone (version = {}) {
  if (!version.currentStatus) {
    return true
  }
  return ![versionStatusMap.UNDONE, versionStatusMap.HOLD, versionStatusMap.DRAFT].includes(version.currentStatus)
}

/**
 * 由于并发写入，一条原表数据可能会对应多条的增量数据，需要按原表id进行合并
 * 合并规则：按createAt 新覆盖旧，缺省字段不覆盖
 * @returns
 */
export function mergePartials (partialRowData) {
  return partialRowData.reduce((arr, cur) => {
    const prev = arr.find(v => v.versionOriginId === cur.versionOriginId)
    if (prev) {
      // TODO：有时会没有modifiedAt字段？
      let priority = false
      if (cur.modifiedAt || prev.modifiedAt) {
        // 隐式规则：数字 > null
        priority = cur.modifiedAt > prev.modifiedAt
      } else {
        priority = cur.createdAt > prev.createdAt
      }

      if (priority) {
        mergeWith(prev, cur, (objValue, srcValue) => {
          if (srcValue) {
            return srcValue
          } else {
            return objValue
          }
        })
      } else {
        mergeWith(prev, cur, (objValue, srcValue) => {
          if (objValue) {
            return objValue
          } else {
            return srcValue
          }
        })
      }
    } else {
      arr.push(cur)
    }
    return arr
  }, [])
}

function convertValues (obj, value) {
  const keys = Object.keys(obj)
  const result = {}
  keys.forEach(k => (result[k] = value))
  return result
}

/**
 * @param {import('@/dependence/bootstrap/bootstrap.js').SystemAPIs} systemHandle
 * @returns
 */
export function proxyCRUD (systemHandle) {
  const { attach = {}, versionTable } = systemHandle
  const { apis, allMap } = attach

  const ACCESS_CHECK_VERSION = 'accessCheckVersion'
  const PRODUCT_VERSION = 'ProductVersion'

  /**
   * 根据嵌套查询的下划线路径，找到最后一个Entity，如：
   * Entity.childEntity_childEntity2_id -> ChildEntity
   */
  function findEntityByPropPath (originEntity, pathArr) {
    if (pathArr.length === 0) {
      return originEntity
    }
    const first = pathArr.shift()
    const entityMap = allMap[originEntity]
    if (entityMap) {
      const field = entityMap.fieldsMap[first]
      const link = field?.sourceLink || field?.targetLink
      if (link) {
        return findEntityByPropPath(link.entity, pathArr)
      }
    }
  }
  /**
   * 检查版本的状态，确认增量更新的幅度
   * 当前版本未完成(!== DONE)，始终保持增量更新
   * 如果当前版本是引用了其它版本作为base，如果上个版本一直未完成则当前版本始终是写在增量表，不会把真正的数据写入最新表，防止影响
   */
  async function checkVersion (entityName, { find }) {
    let versionId = this.headers[HTTP_HEADER_VERSION_TAG]
    let enablePartial = false
    let realModify = true
    let baseVersionId
    let redirectToHistory = false
    if (versionId) {
      versionId = parseInt(versionId)
      const [version] = await find(PRODUCT_VERSION, { id: versionId }, { limit: 1 })

      if (!version) {
        console.warn(`[checkVersion] version is null id=${versionId}`)
      }

      if (version && !isVersionDone(version) && allMap[`${entityName}${versionTable.entityPostfix.partial}`]) {
        enablePartial = true
      }
      if (version && version.base) {
        const [baseVersion] = await find(PRODUCT_VERSION, { id: version.base }, { limit: 1 })
        if (baseVersion && !isVersionDone(version)) {
          realModify = false
          baseVersionId = baseVersion.id
        }
      }
      if (
        version && version.currentStatus === versionStatusMap.ARCHIVE &&
        allMap[`${entityName}${versionTable.entityPostfix.history}`]
      ) {
        redirectToHistory = true
      }
    }

    // logger.info({
    //   message: JSON.stringify({
    //     redirectToHistory,
    //     enablePartial,
    //     realModify,
    //     versionId,
    //     baseVersionId
    //   })
    // })

    return {
      redirectToHistory,
      enablePartial,
      realModify,
      versionId,
      baseVersionId
    }
  }

  /**
   * @param {bootstrap/server.js#newContext} context
   * @param {*} entity
   * @returns
   */
  function createPartialArgs (context, entity) {
    let versionId = context.headers[HTTP_HEADER_VERSION_TAG]
    let groupId = context.headers[HTTP_HEADER_GROUP_TAG]
    const isInHistory = context[ACCESS_CHECK_VERSION].redirectToHistory
    const partialEntity = `${entity}${isInHistory ? versionTable.entityPostfix.history : versionTable.entityPostfix.partial}`

    if (versionId && allMap[partialEntity]) {
      versionId = parseInt(versionId)
      groupId = groupId ? parseInt(groupId) : undefined

      const newData = { versionId }
      // if (typeof data === 'object') {
      //   Object.assign(newData, cloneDeep(data))
      // }
      // Object.assign(newData, {
      //   versionId
      // })
      if (groupId) {
        Object.assign(newData, { versionGroupId: groupId })
      }
      if (isInHistory) {
        Object.assign(newData, { versionPartial: true })
      }
      return [partialEntity, newData]
    }
  }
  /**
   * 抽象增量操作的组合性时机：优先级 和 是否修改结果
   * 1 优先级在后，create, update，操作完成后再更新增量表，不影响返回结果，可以先返回
   * 2 优先级在后, find，基于find的结果查询增量表，影响返回结果，find就需要partial的部分，不能先返回
   * 3 优先级在前，remove，优先走增量逻辑，如果不是增量则走老逻辑，不影响返回结果，结束后就返回
   * highPriority 是否优先判断
   * modify 是否修改结果
   */
  function composePartial (highPriority, modifyResponse, partialFn, historyFn) {
    return (apiMethod, apis) => async function (...args) {
      // 来自于 server.js/useAPI -> newContext
      const apiContext = this

      const checkResult = await checkVersion.call(apiContext, args[0], apis)

      Object.assign(apiContext, {
        [ACCESS_CHECK_VERSION]: checkResult
      })

      if (highPriority) {
        return partialFn.call(apiContext, args, apiMethod, apis)
      }
      /**
       * 根据当前迭代状态：
       * 1.正在进行中 & 该实体开启了增量 --> 走增量逻辑
       * 2.历史迭代 & 该实体开启了增量 --> 查询相关的历史表
       * 3.其它情况，走原来的默认
       */
      if (checkResult.enablePartial) {
        // TIP：这里只有"find"需要modifyResponse
        if (modifyResponse) {
          const result = await apiMethod.apply(apiContext, args)
          return partialFn.call(apiContext, result, args, apiMethod, apis)
        }
        // TIP: checkResult.realModify is false的情况下，下面这个方法不执行而只记增量
        let promise = Promise.resolve()
        if (checkResult.realModify) {
          promise = apiMethod.apply(apiContext, args)
        }
        promise.then(result => partialFn.call(apiContext, result, args, apiMethod, apis))
        return promise
      } else if (checkResult.redirectToHistory) {
        if (historyFn) {
          return historyFn.call(apiContext, args, apiMethod, apis)
        } else {
          return '[error] cannot invoke in history version'
        }
      } else {
        return apiMethod.apply(apiContext, args)
      }
    }
  }

  /**
   * v1.仅当前迭代：处理CRUD即可
   * @TODO v2.支持建更多引用迭代：处理关系
   */
  const methods = {
    // 新增的拓展方法
    findPartial: composePartial(true, false, onlyFindPartial, onlyFindPartialInHistory),
    // ER内的默认方法
    find: composePartial(false, true, partialFind, findInHistory),
    create: composePartial(false, false, partialCreate),
    update: composePartial(false, false, partialUpdate),
    createOrUpdate: composePartial(false, false, partialCreateOrUpdate),
    remove: composePartial(true, false, partialRemove)
    // count,
    // createRelation,
    // findRelation,
    // updateRelation,
    // removeRelation
  }

  /**
   * 仅查询增量信息，
   * 并按需newArgs[1].partialFields的指定的字段，合并原表部分字段信息
   * @TODO 不支持复杂查询语法
   * @returns
   */
  async function onlyFindPartial (args, originMethodIsUndef, { find }) {
    const newArgs = createPartialArgs(this, args[0])
    if (newArgs) {
      Object.assign(newArgs[1], typeof args[1] === 'object' ? args[1] : { versionOriginId: args[1] })
      // TIP：合并原表的字段，如果id，name等
      const partialFields = newArgs[1].partialFields
      delete newArgs[1].partialFields

      // TIP：find.fields有可能被手动指定，需要将默认拓展字段加上
      const findArgs = [...newArgs, ...args.slice(2)]
      if (findArgs[3] && typeof findArgs[3] === 'object') {
        Object.assign(findArgs[3], convertValues(versionTable.extraColumn, true))
      }
      const r = await find(...findArgs)
      // TIP：由于update的写入问题，可能会产生“重复”的增量数据，这里先合并处理
      let mergedResult = mergePartials(r)

      // TIP：增量表中的数据不“全”，所以可选的，按partialFields参数决定要合并原表中的字段
      if (partialFields && partialFields.length > 0) {
        const rWithoutFields = mergedResult.filter(p => partialFields.every(f => p[f] === undefined || p[f] === null))

        const findFields = partialFields.reduce((acc, f) => ({
          ...acc,
          [f]: true
        }), { id: true })

        const originItems = await apis.find(args[0], rWithoutFields.map((p, i) => ({
          method: i === 0 ? 'where' : 'orWhere',
          children: [
            ['id', '=', p.versionOriginId]
          ]
        })), { limit: null }, findFields)

        mergedResult = mergedResult.map(pp => {
          const originItem = originItems.find(p => p.id === pp.versionOriginId)
          if (originItem) {
            partialFields.forEach(f => {
              pp[f] = originItem[f]
            })
          }
          return pp
        })
      }

      return mergedResult.map(obj => ({
        ...obj
      }))
    }
    return []
  }

  /**
   * 仅查询历史增量（基于仅查询增量拓展参数）
   * 等价于 查询历史表中，versionPartial=1 的增量信息
   */
  function onlyFindPartialInHistory (...rests) {
    const [args] = rests
    args[1].versionPartial = true
    return onlyFindPartial.apply(this, rests)
  }

  /**
   * @TODO v2版本下不能是真实的在原表写数据，所以result.id是空的，需要在v1版本结束后再处理
   * @param {createERAPIs.create} create
   * @returns
   */
  function partialCreate (result = {}, args, create) {
    const { id } = result
    const newArgs = createPartialArgs(this, args[0])
    if (newArgs && id) {
      Object.assign(newArgs[1], {
        ...args[1],
        versionOriginId: id,
        versionAdd: true,
        versionPartial: true
      })
      create(...newArgs)
    }
  }
  function partialUpdate (idsToUpdate, args, update, { createOrUpdate }) {
    const newArgs = createPartialArgs(this, args[0])
    if (newArgs) {
      const [partialEntityName, data] = newArgs
      if (idsToUpdate) {
        idsToUpdate.forEach(async (id) => {
          // TIP：增量数据已记录则更新，否则插入
          // TODO: 在前端接口的并发调用下，同一个id的增量更新有可能会创建2条记录
          createOrUpdate(partialEntityName, { versionOriginId: id, ...data }, {
            ...data,
            ...args[2],
            versionOriginId: id,
            versionPartial: true
          })
        })
      } else {
        // @TIP：v2版本下的增量更新必须带有id
        if (typeof args[1] === 'number' || (args[1] && args[1].id)) {
          const id = typeof args[1] === 'number' ? args[1] : args[1].id
          createOrUpdate(partialEntityName, { versionOriginId: id }, {
            ...data,
            ...args[2],
            versionOriginId: id
          })
        } else {
          return 'v2版本下的增量更新必须带有id'
        }
      }
    }
  }
  function partialCreateOrUpdate (result, args, createOrUpdate, { update, create }) {
    // TIP：create返回的是创建对象，update返回的是更新id的数组
    if (Array.isArray(result) && result.every(result => typeof result === 'number')) {
      partialUpdate(result, args, update, { createOrUpdate })
    } else {
      partialCreate(result, args, create)
    }
  }

  /**
   * 先谋一下
   *
   * 前提：当一个entity1.field直接保存了entity2的id，这可以视作 entity1 -> n:1 -> entity2的关系，并且是隐式的，无法关联查询的
   * 1.确定historyRowData是否需要modify
   *   1.1 查询的entity正是出现 polyfill里的source entity
   *   1.2 查询的historyRowData的字段，是否包含了polyfill里的source entity（嵌套数据需要递归到1.1, result.entity1_entity2_entity3_field）
   *     1.2.1 需要判断field参数吗？不需要，因为field参数的作用已经反应到查询结果了
   *     1.2.2 递归的停止条件判断：查询的结果数据如果为空，就不需要再往下了
   * 2.确定通过后，收集 historyRowData中的 field和值
   * 3.根据polyfill的关系，取得对应的entity和field
   *   3.1 考虑validate的情况，有些时候这种隐式的关联关系是对着字段值变化的，如：action的type和value,type='page' value='Page.id'
   * 4.批量查询 field和值, 查询历史 { originId: 值, versionId } in (historyEntity by polyfill)
   * 5.批量替换 historyRowData
   * @returns
   */
  async function modifyDataByPolyfill (apis, historyRowData, originEntity, prefix, historyWhere, records = []) {
    if (historyRowData.length <= 0) {
      return []
    }

    const rawNewWhere = Object.keys(historyWhere).map(field => [field, '=', historyWhere[field]])
    // 1
    const polyfillRelations = []
    relationPolyfill.forEach(r => {
      if (r.source === originEntity) {
        polyfillRelations.push(r)
      }
    })
    logger.info({
      message: `[modifyDataByPolyfill] polyfillRelations: , ${originEntity}, ${JSON.stringify(polyfillRelations)}`
    })
    if (polyfillRelations.length === 0) {
      // 如果查询不到子字段的关系，这里先返回，@TODO：后续增加递归检查
      const firstData = historyRowData[0]
      const childEntities = {}
      Object.keys(firstData).forEach(key => {
        // 1:n
        if (Array.isArray(firstData[key])) {
          const entity = findEntityByPropPath(originEntity, [key])
          childEntities[entity] = ({
            isArray: true,
            entity,
            childDataArr: historyRowData.map(d => d[key])
          })
        } else {
          const keys = key.split('_')
          // 嵌套查询
          if (keys.length > 1) {
            keys.pop()
            const lastEntity = findEntityByPropPath(originEntity, keys.slice())
            // 防止 Navigation的parent和children的自我嵌套死循环
            if (lastEntity && lastEntity !== originEntity) {
              const newPrefix = keys.join('_') + '_'
              childEntities[newPrefix + lastEntity] = ({ prefix: newPrefix, entity: lastEntity })
            }
          }
        }
      })
      logger.info({
        message: `[modifyDataByPolyfill] childEntities.length=${childEntities.length} childEntities=${JSON.stringify(childEntities)}`
      })

      for (const one of Object.values(childEntities)) {
        if (one.isArray) {
          logger.info({
            message: `[modifyDataByPolyfill] childArr start=${originEntity}, one.childDataArr.length=${one.childDataArr.length}`
          })
          for (const arrOne of one.childDataArr) {
            if (arrOne.length > 0) {
              await modifyDataByPolyfill(apis, arrOne, one.entity, '', historyWhere)
            }
          }
          logger.info({
            message: `[modifyDataByPolyfill] childArr end=${originEntity}`
          })
        } else {
          await modifyDataByPolyfill(apis, historyRowData, one.entity, one.prefix, historyWhere)
        }
      }

      return historyRowData
    }

    /**
     * targetQueryMap = {
     *   [id]: {
     *     [targetE]: children
     *     [targetE2]: children2
     *   }
     * }
     */
    const targetQueryMap = {}
    historyRowData.forEach(d => {
      if (!d.id) {
        return
      }
      const childrenMap = {}
      polyfillRelations.forEach(relation => {
        if (!childrenMap[relation.target]) {
          childrenMap[relation.target] = rawNewWhere.slice()
        }
        const whereChildren = childrenMap[relation.target]

        let sourceFieldValue = null
        if (relation.validate) {
          if (relation.validate(d)) {
            sourceFieldValue = d[prefix + relation.sourceField]
          }
        } else {
          sourceFieldValue = d[prefix + relation.sourceField]
        }
        if (sourceFieldValue !== null && sourceFieldValue !== undefined) {
          whereChildren.push([
            'versionOriginId', '=', sourceFieldValue
          ])
        }
      })
      targetQueryMap[d.id] = childrenMap
    })

    const shouldQueryTargetEntities = [...new Set(Object.values(targetQueryMap).map(m => Object.keys(m)).flat())]

    logger.info({
      message: `[modifyDataByPolyfill] shouldQueryTargetEntities: ${JSON.stringify(shouldQueryTargetEntities)}`
    })

    for (const entity of shouldQueryTargetEntities) {
      const whereQuery = Object.values(targetQueryMap).filter(obj => obj[entity]).map((obj, i) => {
        return {
          method: i === 0 ? 'where' : 'orWhere',
          children: obj[entity]
        }
      })
      const historyEntity = `${entity}${versionTable.entityPostfix.history}`
      logger.info({
        message: `[modifyDataByPolyfill] historyEntity: ${historyEntity}, whereQuery=${JSON.stringify(whereQuery)}`
      })
      const result = await apis.find(historyEntity, whereQuery, { limit: null })
      logger.info({
        message: `[modifyDataByPolyfill] historyEntity: ${historyEntity}, result.length=${result.length}`
      })
      result.forEach(r => {
        polyfillRelations.forEach(relation => {
          if (relation.target === entity) {
            historyRowData.forEach(row => {
              if (row[prefix + relation.sourceField] === r.versionOriginId) {
                row[prefix + relation.sourceField] = r.id
              }
            })
          }
        })
      })
    }
    logger.info({
      message: `[modifyDataByPolyfill] originEntity=${originEntity} end`
    })
  }

  async function findInHistory (args, find, apis) {
    const newArgs = createPartialArgs(this, args[0])
    if (newArgs) {
      const [partialEntityName, where] = newArgs
      delete where.versionPartial // 不是仅仅查询增量

      const [originEntity, originWhere, ...others] = args

      let newWhere = {}
      if (Array.isArray(originWhere)) {
        newWhere = cloneDeep(originWhere)
        newWhere.forEach(whereObj => {
          whereObj.children.push(['versionId', '=', where.versionId])
          whereObj.children.push(['versionPartial', '=', false])
        })
      } else if (typeof originWhere === 'number') {
        newWhere = {
          ...where,
          id: originWhere,
          versionPartial: false
        }
      } else {
        newWhere = {
          ...where,
          ...originWhere,
          versionPartial: false
        }
      }
      // 如果是通过直接的id来查询历史数据，如何区分这个id是指的原表的，还是历史的？
      const findArgs = [partialEntityName, newWhere, ...others]
      if (findArgs[3]) {
        Object.assign(findArgs[3], convertValues(versionTable.extraColumn, true))
      }
      const resultInHistory = await find(...findArgs)

      // polyfill修正逻辑
      await modifyDataByPolyfill(apis, resultInHistory, originEntity, '', where)

      const r = await partialFind.call(this, resultInHistory, args, find, apis)
      return r
    }
  }

  /**
   * 查询关联关系的增量数据
   * 1.获取字段和关系
   *   1.1 keys(args[1]) 中的字段，并收集其中是关联关系的字段,对应的Entity，即target，还有关系 type
   *   1.2 结果 [ target = [ type, Entity, field]...]
   * 2.获取关联关系的增量数据
   *   2.1 按字段取出原表里的result[field] as result，递归传入 partialFind 构建args = [target.Entity, {}]
   * 3. as result的时候要处理下下划线字段，转成对象，因为1->1或n->1时的结果会直接转成字段 如: Page.baseStatus_id（ TODO：注意考虑有些字段或Entity可能自带了下划线）
   *  3.1 处理的下划线字段目前先简单处理2级，暂不考虑 Page.XXX_YYY_id
   *  3.2 1->n 会转成数组，可以直接传入partialFind
   * 4.递归查询
   * 5.返回的结果是不覆盖原来的下划线字段（防止影响存量逻辑），直接在 as result时候的是插入 PARTIAL_ACCESS_KEY=partialObj 部分
   */
  async function partialFindRelationChildren (result, args, find) {
    const [entity, queryObj, limit, fields] = args
    if (typeof queryObj === 'object') {
      const entityMap = allMap[entity]
      const queryKeys = Object.keys(fields || {})

      const childrenEntity = []
      // 1.取出字段和对应的关系
      if (entityMap && entityMap.fieldsMap) {
        for (const fieldConfig of Object.values(entityMap.fieldsMap)) {
          const link = fieldConfig.targetLink || fieldConfig.sourceLink
          if (link && queryKeys.includes(fieldConfig.name)) {
            if (
              versionTable.tables.includes(link.entity)
            ) {
              const fieldRelation = allMap[link.relation].relation
              const currentIsOne = (
                fieldRelation.type === '1:1' ||
                (fieldRelation.type === '1:n' && fieldRelation.source.entity === link.entity) ||
                (fieldRelation.type === 'n:1' && fieldRelation.target.entity === link.entity)
              )

              childrenEntity.push({
                field: fieldConfig.name,
                entity: link.entity,
                currentIsOne
              })
            }
          }
        }
      }
      // 1.1 预处理包含下划线的数据情况
      childrenEntity.forEach(({ field, entity, currentIsOne }) => {
        if (currentIsOne) {
          result.forEach(rowData => {
            Object.keys(rowData).forEach(k => {
              const kArr = k.split('_')
              if (kArr[0] === field) {
                if (!rowData[field]) {
                  rowData[field] = {}
                }
                rowData[field][kArr[1]] = rowData[k]
              }
            })
          })
        }
      })
      // 2.获取关联关系的增量数据
      for (const rowData of result) {
        for (const child of childrenEntity) {
          // 内部有merge操作
          await partialFind.call(this,
            [].concat(rowData[child.field]),
            [child.entity, {}],
            find
          )
          if (child.currentIsOne) {
            const d = rowData[child.field][PARTIAL_ACCESS_KEY]
            delete rowData[child.field]
            rowData[`${child.field}_${PARTIAL_ACCESS_KEY}`] = d
          }
        }
      }
    }
  }
  async function partialFind (result, args, find) {
    if (result.length > 0 && result.every(r => !r.id)) {
      console.warn('[partialFind warning] prev result lack of id property ')
      return result
    }

    const newArgs = createPartialArgs(this, args[0])
    if (newArgs) {
      try {
        const [partialEntityName, data] = newArgs
        // 定向查询，则增量表也定向查询
        if (args[1]?.id) {
          data.versionOriginId = args[1].id
        }
        const partialResult = await find(partialEntityName, data, { limit: null })

        const mergedResult = mergePartials(partialResult)
        // TODO: v2版本还需要迭代base的增量的数据
        mergedResult.forEach((partialObj) => {
          const { versionOriginId } = partialObj;
          [].concat(result).forEach((obj) => {
            if (obj.id === versionOriginId) {
              // TIP：由于并发写入的关系，一条原表数据可能会对应多条增量数据
              Object.assign(obj, {
                [PARTIAL_ACCESS_KEY]: partialObj
              })
            }
          })
        })

        await partialFindRelationChildren.call(this, result, args, find)
      } catch (e) {
        console.error('[version]proxyFind:', e)
      }
    }

    return result
  }

  async function partialRemove (args, remove, { find, create, update }) {
    const newArgs = createPartialArgs(this, args[0])
    const id = args[1]
    // 当前版本还在进行中，支持增量操作
    if (newArgs && this[ACCESS_CHECK_VERSION].enablePartial) {
      const [partialEntityName, data] = newArgs
      Object.assign(data, { versionOriginId: id })
      const existsResult = await find(partialEntityName, data, { limit: 1 })
      if (existsResult && existsResult.length > 0) {
        const isAddInVersion = existsResult.some(r => r.versionAdd)
        // TIP：如果是迭代内才新增的，则直接删除
        if (isAddInVersion) {
          await remove(...args)
          existsResult.forEach(r => {
            remove(partialEntityName, r.id)
          })
        } else {
          await update(partialEntityName, data, { versionRemove: true, versionPartial: true })
        }
      } else {
        await create(partialEntityName, {
          ...data,
          versionRemove: true
        })
      }
      return id
    }
    return remove(...args)
  }

  const newProxyApis = Object.entries(apis).map(([name, fn]) => {
    const p = methods[name]
    const newFn = p ? p(fn, apis) : fn

    return { [name]: newFn }
  }).reduce((p, n) => Object.assign(p, n), {
    findPartial: methods.findPartial(null, apis)
  })

  return newProxyApis
}

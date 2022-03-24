import { clearUselessKeys } from './util.js'
import { HTTP_HEADER_VERSION_TAG, isVersionDone, mergePartials, versionStatusMap } from '../dependence/bootstrap/version.js'
import config from '../config/index.js'
import { loadJSON, cloneDeep } from '../dependence/util.js'
import path from 'path'
import { fileURLToPath } from 'url'
import logger from '../logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
/**
 *
 * @param {API.ER_APIs} apis
 * @param {string} productId
 * @param {{
 *  name: string
 *  description?: string
 *  notice?: string
 * }} versionFields
 */
export async function createNewVersion (apis, productId, versionFields) {
  const { id } = await apis.create('ProductVersion', {
    ...clearUselessKeys(versionFields),
    product: productId
  })

  return id
}

/**
 *
 * @param {API.ER_APIs} apis
 * @param {{
 *  name: string
 *  product: number
 * }} args
 */
export async function startNewVersion (apis, args) {
  // 当前版本
  const contextVersionId = this.headers[HTTP_HEADER_VERSION_TAG] ? parseInt(this.headers[HTTP_HEADER_VERSION_TAG]) : undefined
  // 同一个时间只能有一个进行中的迭代，迭代是严格的串行关系，新建迭代必须将上个完成迭代进行归档
  const [currentVersion] = await apis.find('ProductVersion', {
    id: contextVersionId
  }, { limit: 1 })

  // 先处理脏数据，可能同时存在多个迭代在进行中
  const versions = await apis.find('ProductVersion', {
    product: args.product
  }, { limit: null })
  if (versions.length > 0) {
    for (const v of versions) {
      //  仍存在还有未完结的旧迭代, 手动帮其结束
      if (v.id !== currentVersion.id && v.currentStatus !== versionStatusMap.ARCHIVE && v.createdAt < currentVersion.createdAt) {
        await apis.update('ProductVersion', v.id, {
          currentStatus: versionStatusMap.ARCHIVE
        })
      }
    }
  }

  // TIP：在完成的迭代的基础上建立新迭代（兼容逻辑，老数据的currentStatus为空，默认它是完成的）
  if (currentVersion && (isVersionDone(currentVersion) || !currentVersion.currentStatus)) {
    const storageMap = await loadJSON(path.join(__dirname, '../runtime/storage.map.json'))

    const newVersion = await apis.create('ProductVersion', {
      ...args,
      currentStatus: 'undone'
    })

    await archiveAllHistoryTable(storageMap, apis, currentVersion.id, newVersion.id)

    await apis.update('ProductVersion', contextVersionId, {
      currentStatus: 'archive'
    })

    return newVersion
  } else {
    throw new Error('暂不支持其它形式的新建迭代')
  }
}

/**
 * 归档所有的历史表，其中productVersion需要特殊处理
 */
async function archiveAllHistoryTable (storageMap, apis, versionId, newVersionId) {
  const entityArr = []
  for (const entityName of Object.keys(storageMap)) {
    const reg = new RegExp(`${config.versionTable.entityPostfix.history}$`)
    if (reg.test(entityName)) {
      const en = entityName.replace(reg, '')
      // TIP：LinkPort需要特殊处理，因为Link -> Port是2条线共同指向，生成的allMap在反向查找的时候会丢失
      if (en === 'LinkPort') {
        entityArr.unshift(en)
      } else {
        entityArr.push(en)
      }
    }
  }
  // 记录遍历的过程，防止重复归档
  // archiveRecord = { [id + Entity]: false }
  const archiveRecord = {}

  // 手动处理ProductVersion下的直接关联，切换指引
  // await Promise.all(Object.values(storageMap.ProductVersion.fieldsMap).map(async (field) => {
  for (const field of Object.values(storageMap.ProductVersion.fieldsMap)) {
    if (field.type === 'rel') {
      const link = field.sourceLink || field.targetLink
      const historyEntity = `${link.entity}${config.versionTable.entityPostfix.history}`
      const fieldRelation = storageMap[link.relation]?.relation

      // TIP：手动跳过，version本身的field（自身的属性，作为在1:n关系的n）
      if (
        !fieldRelation ||
        ['VersionGroup'].includes(link.entity) ||
        (fieldRelation.source.entity === 'ProductVersion' && fieldRelation.type === 'n:1') ||
        (fieldRelation.target.entity === 'ProductVersion' && fieldRelation.type === '1:n')
      ) {
        continue
      }

      const st = Date.now()
      const rowData = await apis.find(link.entity, { [link.field[0]]: versionId })

      logger.info({
        message: `[${link.entity}] start. historyEntity=${historyEntity} rowData.length=${rowData.length}`
      })

      if (rowData.length > 0) {
        // 仅归档，ProductVersion下的关联数据
        try {
          if (storageMap[historyEntity]) {
            await archiveEntity(storageMap, apis, link.entity, rowData, versionId, archiveRecord)
            for (const d of rowData) {
              await apis.update(historyEntity, { versionOriginId: d.id, versionId: versionId }, { [link.field[0]]: versionId })
            }
            const cost = (Date.now() - st) / 1000
            logger.info({
              message: `[${link.entity}] end 耗时:${cost}秒`
            })
          }
          // 在归档时需要按versionId查原表数据，所以关联关系的变更必须在最后
          for (const d of rowData) {
            await apis.createRelation(`${link.entity}.${link.field[0]}`, d.id, newVersionId)
          }
        } catch (e) {
          logger.error(e)
        }
        // 即时出错了，但由于之前部分数据已经归档 & 新版本已经建好，还是需要将当前数据滚到当前版本
        for (const d of rowData) {
          await apis.createRelation(`${link.entity}.${link.field[0]}`, d.id, newVersionId)
        }
      }
    }
  }
  // }))
}

function buildField (fieldArr, obj = {}) {
  return fieldArr.map(f => ({
    [f]: true
  })).reduce((p, n) => Object.assign(p, n), obj)
}

/**
 * 归档单个实体
 * 1.先查询原表数据，不包含关联关系
 * 2.归档实体数据 -> history.table
 *   1.1 特殊处理：如果实体是ProductVersion的直接下级，则手动指定version字段=versionId
 * 3.查到实体的关联关系字段和关系
 * 4.检查关联关系的字段是否已经归档
 *   3.1 是则建立关联
 *   3.1 否则跳过，等关联关系的另一端在归档时，在建联系
 */
function archiveRecordKey (e, id, vid) {
  return `${e}_${id}_${vid}`
}
async function archiveEntity (storageMap, apis, entity, oldRowData, versionId, archiveRecord) {
  logger.info({
    message: `[v=${versionId} archive=${entity}] into1: ids=${oldRowData.map(o => o.id)}`
  })

  oldRowData = oldRowData.filter(({ id }) => {
    return !archiveRecord[archiveRecordKey(entity, id, versionId)]
  })

  logger.info({
    message: `[v=${versionId} archive=${entity}] into2: ids=${oldRowData.map(o => o.id)}`
  })

  const historyEntity = `${entity}${config.versionTable.entityPostfix.history}`
  const partialEntity = `${entity}${config.versionTable.entityPostfix.partial}`
  const entityMap = storageMap[entity]
  // 1.确认是否存在历史表，存在才能归档
  if (storageMap[historyEntity] && entityMap && entityMap.fieldsMap) {
    const relations = []
    for (const fieldConfig of Object.values(entityMap.fieldsMap)) {
      const link = fieldConfig.targetLink || fieldConfig.sourceLink
      const fieldRelation = storageMap[link?.relation]?.relation
      if (fieldRelation) {
        relations.push(fieldRelation)
      }
    }
    // 先归档relation里的数据，再归档自己
    if (oldRowData.length > 0) {
      for (const d of oldRowData) {
        const currentArchiveRecordKey = archiveRecordKey(entity, d.id, versionId)
        if (archiveRecord[currentArchiveRecordKey]) {
          logger.info({
            message: `[v=${versionId} archive=${entity} id=${d.id}] already archived. key=${currentArchiveRecordKey}`
          })
          /**
           * 预先判断，因为递归有可能当前的oldRowData的下一个d会被自己的子级先归档
           * 路径：page[1, 2] -> page1 -> page1 in H -> n:1的xxx子级1 -> xxx子级1 in H -> 1:n page[1, 2]
           * -> record(page, 1) is true跳过 -> record(page, 2) is false 开始归档 -> page2 in H -> n:1的xxx子级1
           * -> record(xxx子级1， d) is true 跳过 -> page2 H relation xxx子级1 H -> xxx子级1 H relation [page1 H, page2 H]
           * -> page1 H relation xxx子级1 H -> page2 -> record(page, 2) is true 跳过 -> 结束
           */
          return
        }
        archiveRecord[currentArchiveRecordKey] = true

        const createData = cloneDeep(d)
        delete createData.id
        createData.versionOriginId = d.id
        createData.versionId = versionId
        createData.versionPartial = false

        // 先检查:由于错误原因，这条数据已经被归档过了
        logger.info({
          message: `[v=${versionId} archive=${entity} id=${d.id}] before historyR: entity=${entity}, historyEntity=${entity}, versionOriginId=${d.id}, versionId=${versionId}`
        })
        let [historyR] = await apis.find(historyEntity, { versionOriginId: d.id, versionId })
        if (!historyR) {
          historyR = await apis.create(historyEntity, createData)
        }
        logger.info({
          message: `[v=${versionId} archive=${entity} id=${d.id}] after historyR: , historyEntity=${historyEntity}, historyR.id=${historyR.id}`
        })
        // 增量数据也归档到历史
        if (storageMap[partialEntity]) {
          let oldPartialRowData = await apis.find(partialEntity, {
            versionOriginId: d.id,
            versionId
          })
          if (oldPartialRowData.length > 0) {
            oldPartialRowData = mergePartials(oldPartialRowData)
            // 如果原表数据是删除，则及时删除
            let isDelete = false
            oldPartialRowData.forEach(oldPartial => {
              if (d.versionOriginId === oldPartial.versionOriginId) {
                // TIP：由于并发写入的关系，一条原表数据可能有多条增量数据，所以采用综合判断
                isDelete = isDelete || oldPartial.versionRemove
              }
            })
            logger.info({
              message: `[v=${versionId} archive=${entity} id=${d.id}] check remove: isDelete=${isDelete} originId=${d.id} versionId=${versionId}`
            })
            if (isDelete) {
              await apis.remove(entity, d.id)
            }
            let createHistoryPartial = oldPartialRowData[0]
            createHistoryPartial = clearUselessKeys(createHistoryPartial)
            createHistoryPartial.versionOriginId = historyR.id
            createHistoryPartial.versionPartial = true
            delete createHistoryPartial.id
            // 先检查:由于错误原因，这条数据可能已经被归档过了
            const [exist] = await apis.find(historyEntity, { versionOriginId: historyR.id, versionPartial: true, versionId })
            if (!exist) {
              await apis.create(historyEntity, createHistoryPartial)
            }
          }
        }

        // 历史数据关联
        for (const relation of relations) {
          const relationRowData = []
          let linkObj = null
          let isReverse = false
          let sourceEntity = null
          let relationEntity = null
          // 根据relation查找原表的单条数据的关联关系
          switch (relation.type) {
            case '1:n':
              linkObj = relation.target
              if (relation.source.entity === entity) {
                sourceEntity = relation.source
                relationEntity = relation.target
              } else {
                sourceEntity = relation.target
                relationEntity = relation.source
                isReverse = true
              }
              break
            case 'n:1':
              linkObj = relation.source
              if (relation.source.entity === entity) {
                isReverse = true
                relationEntity = relation.target
                sourceEntity = relation.source
              } else {
                relationEntity = relation.source
                sourceEntity = relation.target
              }
              break
            case '1:1':
            case 'n:n':
              if (relation.source.entity === entity) {
                linkObj = relation.target
                relationEntity = relation.target
                sourceEntity = relation.source
              } else {
                linkObj = relation.source
                relationEntity = relation.source
                sourceEntity = relation.target
              }
              break
          }

          const relationHistoryEntity = `${relationEntity.entity}${config.versionTable.entityPostfix.history}`
          if (!storageMap[relationHistoryEntity]) {
            continue
          }
          logger.info({
            message: `[v=${versionId} archive=${entity} id=${d.id}] before find relation data: current=${entity} isReverse=${isReverse} linkObj=${linkObj.entity} ${linkObj.field[0]} relation=${relationEntity.entity} ${relationEntity.field[0]}`
          })
          /**
           * 原表1数据d -> 关联数据的原表2 newData -> 先归档关联数据的原表数据
           * -> 最后再查关联数据的历史数据 historyRelationData -> 建立联系
           */
          let opponentOriginData = []
          if (isReverse) {
            const r = await apis.find(linkObj.entity, { id: d.id }, { limit: null }, buildField(linkObj.field, { id: true }))
            if (r[0]) {
              const newData = {}
              Object.keys(r[0]).forEach(key => {
                linkObj.field.forEach(f => {
                  const reg = new RegExp(`${f}_`)
                  const newKey = key.replace(reg, '')
                  newData[newKey] = r[0][key]
                })
              })
              if (newData.id) {
                opponentOriginData.push(newData)
              }
            }
          } else {
            const where = {}
            linkObj.field.forEach(f => {
              where[f] = d.id
            })
            opponentOriginData = await apis.find(linkObj.entity, where, { limit: null })
          }
          logger.info({
            message: `[v=${versionId} archive=${entity} id=${d.id}] find relation data in origin: relation=${relationEntity.entity} ${relationEntity.field[0]} originIds=${opponentOriginData.map(o => o.id)}`
          })
          // 根据关联对象的原表数据先归档关联对象
          await archiveEntity(storageMap, apis, relationEntity.entity, opponentOriginData, versionId, archiveRecord)

          if (isReverse) {
            if (opponentOriginData[0]) {
              const historyRelationData = await apis.find(relationHistoryEntity, { versionOriginId: opponentOriginData[0].id, versionId })
              if (historyRelationData[0]) {
                relationRowData.push(...historyRelationData)
              }
            }
          } else {
            if (opponentOriginData.length > 0) {
              const historyWhere = opponentOriginData.map(({ id }, i) => ({
                method: i === 0 ? 'where' : 'orWhere',
                children: [
                  ['versionOriginId', '=', id],
                  ['versionId', '=', versionId]
                ]
              }))
              const historyRelationData = await apis.find(relationHistoryEntity, historyWhere, { limit: null })
              relationRowData.push(...historyRelationData)
            }
          }
          // 建立历史关联，由于递归子级的关系，有可能重复建关系但不影响
          const sourceHistoryEntity = `${sourceEntity.entity}${config.versionTable.entityPostfix.history}`
          logger.info({
            message: `[v=${versionId} archive=${entity} id=${d.id}] find relation data in history: ${sourceHistoryEntity}.${sourceEntity.field[0]}'-> ${relationHistoryEntity}, ${relationRowData.map(o => o.id).join(',')}`
          })
          await Promise.all(relationRowData.map(async historyRelationData => {
            await apis.createRelation(`${sourceHistoryEntity}.${sourceEntity.field[0]}`, historyR.id, historyRelationData.id)
          }))
        }
      }
    }
  }
}

/**
 * 获取当前正在进行中的versions，否则取最后一个
 */
export async function getCurrentVersion (apis, pid, versions) {
  if (!versions) {
    versions = await apis.find('ProductVersion', { product: pid })
  }

  let version
  for (const v of versions) {
    if (!isVersionDone(version)) {
      version = v
      break
    }
  }
  if (!version) {
    version = versions[versions.length - 1]
  }
  return version
}

export async function getVersions (apis, productId) {
  return await apis.find('ProductVersion', { product: productId })
}

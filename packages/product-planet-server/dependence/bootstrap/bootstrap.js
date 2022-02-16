import defaultFs from 'fs/promises'
import path from 'path'
import knexConnect from 'knex'
import createStateHandle from './state.js'
import { setup as setupServer } from './server.js'
import { withCallbacks } from './callback.js'
import { mapValues, loadAllFiles, loadJSON, isObject } from '../util.js'
import config from '../../config/index.js'

const __dirname = path.resolve()
export const DIRECT_ACCESS_KEY = '__AccessMethods'

/**
 * @typedef {{
 *  fs: import('fs/promises')
 *  database: import('knex').Knex
 *  state: import('./state.js').GlobalStateAPIs
 *  dir: {
 *    app: string
 *    runtime: string
 *  }
 *  attach: {
 *    apis: object
 *    allMap: object
 *    allTables: import('../services/common.js').TableConfig[]
 *    compositeFieldTypes?: import('../util.js').FilesContent // '@/app/*.field.js' content collection
 *  }
 *  useEffect: (effect: Function) => void
 * }} SystemAPIs
 */

/** @type {Function[]} */
const effects = []
/**
 * ? 什么时候执行 cleaner?
 * @type {Function[]}
 **/
const effectCleaners = []
/** @type {(effect: Function) => void} */
const useEffect = (effect) => {
  effects.push(effect)
}

/**
 * service 之间的依赖关系：
 * 最基础的： storage，放到最后处理.
 * 1.
 * 2. user 给所有 belongToUser 的 storage 增加 relation。同时修改 user entity
 *
 * @param {{
 *  fs: import('fs/promises')
 * }} { fs }
 * @return {*}
 */
async function bootstrap ({ fs }) {
  const dir = {
    app: path.join(__dirname, '/app'),
    runtime: path.join(__dirname, '/runtime')
  }

  // 实例化数据库
  const database = knexConnect(config.database)
  if (process.env.DEBUG_SQL === '1') {
    database.on('query', (query) => {
      console.log(query.sql)
    })
  }
  const moduleConfig = config.moduleConfig || {}

  // @DEBUG
  // database.on('query', d => console.log('query >> ',d))

  /** @type {SystemAPIs} */
  const system = {
    fs,
    database,
    state: createStateHandle({ database, useEffect }),
    dir,
    moduleConfig,
    // 各module之间互通的数据
    attach: {
      apis: {},
      allMap: {},
      allTables: []
    },
    useEffect
  }

  const compositeFieldTypes = await loadAllFiles(dir.app, /\.field\.js$/)
  Object.assign(system.attach, { compositeFieldTypes })

  // 1. 执行依次执行启用的module
  const moduleNames = Object.keys(moduleConfig)

  for (const name of moduleNames) {
    if (!moduleConfig[name].enable) continue
    const { setup } = await import(`../services/${name}/index.js`)
    await setup.call(this, system)
  }

  // 执行 effects
  for (const effect of effects) {
    effectCleaners.push(await effect())
  }

  // 2. 暴露封装的有领域语义的 api
  const domainLogicAPIs = {
    [DIRECT_ACCESS_KEY]: {}
  }

  for (const [moduleNames, methods] of Object.entries(await loadAllFiles(dir.app, /\.api\.js$/, undefined, 2))) {
    const targetMethods = mapValues(methods, fn => function (...argv) {
      return fn.call(this, system.attach.apis, ...argv)
    })
    Object.assign(domainLogicAPIs[DIRECT_ACCESS_KEY], targetMethods)
    Object.assign(domainLogicAPIs, {
      [moduleNames]: targetMethods
    })
  }

  const rawApis = {
    ...system.attach.apis,
    ...domainLogicAPIs
  }

  const apisWithCallbacks = withCallbacks(rawApis)

  // 3. 写进 api.map.json
  function replaceAPIs (fnOrModule) {
    if (typeof fnOrModule === 'function') {
      const fnStr = fnOrModule.toString()
      const matchFn = fnStr.match(/^function\s*\w*\(([\w\d\s_,.={}]*)\)/i)
      if (matchFn) return matchFn[1]
      const matchInlineFn = fnStr.match(/^\(([\w\d\s_,.={}]*)\)/i)
      if (matchInlineFn) return matchInlineFn[1]
      const matchAsync = fnStr.match(/^async\s*\(([\w\d\s_,.={}]*)\)\s=>/i)
      if (matchAsync) return matchAsync[1]
      const matchAsyncFn = fnStr.match(/^async\sfunction\s*\w*\(([\w\d\s_,.={}]*)\)/i)
      if (matchAsyncFn) return matchAsyncFn[1]
      return fnStr
    } else if (isObject(fnOrModule)) {
      return mapValues(fnOrModule, replaceAPIs)
    }
  }
  await fs.writeFile(
    path.join(dir.runtime, './api.map.json'),
    JSON.stringify(
      mapValues(rawApis, replaceAPIs),
      null,
      4
    )
  )

  // TODO 处理 crash，要 clean effect。

  return {
    apis: {
      ...apisWithCallbacks
    },
    system
  }
}

/**
 *
 * @param {{
 *  fs?: typeof defaultFs
 * }} { fs }
 * @returns {Promise<any>}
 */
async function initServer ({
  fs = defaultFs
}) {
  const { apis } = await bootstrap({ fs })

  return setupServer(apis)
}

export {
  loadJSON,
  initServer
}

import { setupTables } from '../services/common.js'
import { NOOP } from '../util.js'

/**
 * @typedef {{
 *  getState: GlobalStateAPIs['getState']
 *  setState: GlobalStateAPIs['setState']
 *  commit: import('knex').Knex.Transaction['commit']
 *  rollback: import('knex').Knex.Transaction['rollback']
 * }} TransactionAPIs
 *
 * @typedef {{
 *  getState: <T>(key: any, defaultValue: T) => Promise<T | unknown>
 *  setState: <T>(key: any, value: T) => Promise<number | number[]>
 *  transaction: (isolationLevel: import('knex').Knex.IsolationLevels) => TransactionAPIs
 * }} GlobalStateAPIs
 */

const STATE_TABLE = 'globalState'

/**
 * Create a table of global state and return APIs of operational data.
 *
 * @param {{
 *  database: import('knex').Knex
 *  useEffect: (effect: Function) => void
 * }} { database, useEffect }
 * @returns
 */
export default function createStateHandle ({ database, useEffect }) {
  const table = {
    name: STATE_TABLE,
    columns: [{
      name: 'key',
      type: 'string',
      size: 32
    }, {
      name: 'value',
      type: 'string',
      size: 128
    }]
  }

  useEffect(async () => {
    await setupTables(database, [table])
  })

  return createAPIs({ database })
}

/**
 * Create APIs for operation global state
 *
 * @param {{database: import('knex').Knex}} params
 * @returns {GlobalStateAPIs}
 */
export function createAPIs ({ database }) {
  /**
   * @template T
   * @param {import('knex').Knex | import('knex').Knex.Transaction} db
   * @param {*} key
   * @param {T} defaultValue
   * @returns {Promise<unknown>}
   */
  async function getState (db, key, defaultValue) {
    const [record] = await db(STATE_TABLE).where({ key }).limit(1)
    if (!record) return defaultValue
    return JSON.parse(record.value)
  }

  /**
   * @template T
   * @param {import('knex').Knex | import('knex').Knex.Transaction} db
   * @param {*} key
   * @param {T} value
   * @returns {Promise<number | number[]>}
   */
  async function setState (db, key, value) {
    const [record] = await database(STATE_TABLE).where({ key })
    if (record) {
      return db(STATE_TABLE).where({ key }).update({ value: JSON.stringify(value) })
    } else {
      return db(STATE_TABLE).insert({ key, value: JSON.stringify(value) })
    }
  }

  /** @type {GlobalStateAPIs['getState']} */
  const unsafeGetState = (...argv) => getState(database, ...argv)
  /** @type {GlobalStateAPIs['setState']} */
  const unsafeSetState = (...argv) => setState(database, ...argv)

  /**
   * @param {import('knex').Knex.IsolationLevels} isolationLevel
   * @returns {TransactionAPIs}
   */
  async function transaction (isolationLevel) {
    let error
    /** @type {import('knex').Knex.Transaction} */
    let trx
    try {
      trx = await database.transaction({ isolationLevel })
    } catch (e) {
      error = e
      console.error(e)
    }

    return error
      ? {
          getState: unsafeGetState,
          setState: unsafeSetState,
          commit: NOOP,
          rollback: NOOP
        }
      : {
          getState: getState.bind(this, trx),
          setState: setState.bind(this, trx),
          commit: trx.commit.bind(trx),
          rollback: trx.commit.rollback(trx)
        }
  }

  return {
    transaction,
    unsafeGetState,
    unsafeSetState
  }
}

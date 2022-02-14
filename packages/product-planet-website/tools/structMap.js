import { reactive, watch } from 'axii'
export default function createStructMap (keys) {
  const globalDataCache = new Map()
  const listeners = []
  const globalData = keys.map(k => {
    return {
      [k]: {
        get () {
          return globalDataCache.get(k)
        },
        set (v) {
          globalDataCache.set(k, v)
          listeners.forEach(fn => fn())
        },
        watch (callback) {
          listeners.push(callback)
          return () => {
            const i = listeners.indexOf(callback)
            listeners.splice(i, 1)
          }
        }
      }
    }
  }).reduce((p, n) => Object.assign(p, n), {
    clear () {
      globalDataCache.clear()
    }
  })

  return globalData
}

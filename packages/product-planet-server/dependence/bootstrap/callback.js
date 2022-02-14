import { isObject, mapValues } from '../util.js'

const onCallbacksIndexedByFn = new Map()
const afterCallbacksIndexedByFn = new Map()

export function on (fn, callback) {
  let callbacks = onCallbacksIndexedByFn.get(fn)
  if (!callbacks) onCallbacksIndexedByFn.set(fn, (callbacks = new Set()))
  callbacks.add(callback)
  return () => callbacks.remove(callback)
}

export function after (fn, callback) {
  let callbacks = afterCallbacksIndexedByFn.get(fn)
  if (!callbacks) afterCallbacksIndexedByFn.set(fn, (callbacks = new Set()))
  callbacks.add(callback)
  return () => callbacks.remove(callback)
}

// TODO 事件 callback 错误应该不影响主函数
export function withCallbacks (apis) {
  function replaceWithCallbacks (fnOrModule) {
    if (typeof fnOrModule === 'function') {
      return async function (...argv) {
        const onCallbacks = onCallbacksIndexedByFn.get(fnOrModule)
        if (onCallbacks) {
          await Promise.all([...onCallbacks.values()].map(callback => callback.call(this, ...argv)))
        }
        const result = await fnOrModule.call(this, ...argv)
        const afterCallbacks = afterCallbacksIndexedByFn.get(fnOrModule)
        if (afterCallbacks) {
          await Promise.all([...afterCallbacks.values()].map(callback => callback.call(this, ...argv)))
        }
        return result
      }
    } else if (isObject(fnOrModule)) {
      return mapValues(fnOrModule, replaceWithCallbacks)
    }
  }
  return mapValues(apis, replaceWithCallbacks)
}

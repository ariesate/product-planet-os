import { atom, useViewEffect } from 'axii'
import store from '@/store'

/**
 * @example
 * const UserInfo = useStore((root) => root.UserInfo)
 *
 * @export
 * @template T
 * @param {(root: Store.root) => T} getter
 * @returns {{value: T}}
 */
export default function useStore (getter) {
  const ret = atom(getter(store.getState()))
  useViewEffect(() =>
    store.subscribe(() => {
      ret.value = getter(store.getState())
    }))
  return ret
}

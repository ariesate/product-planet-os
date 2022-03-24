/** @jsx createElement */
import {
  atom,
  watch
} from 'axii'

const Yes = '1'
const No = '0'

export function useLocalBool (localKey, reverse, isSession) {
  if (!localKey) {
    throw new Error('[useLocalAtom] local key is null')
  }
  const storage = isSession ? sessionStorage : localStorage

  const target = atom(reverse ? storage.getItem(localKey) === Yes : storage.getItem(localKey) !== No)

  watch(() => target.value, () => {
    storage.setItem(localKey, target.value ? Yes : No)
  })

  return target
}
export function useLocalStr (localKey, isSession) {
  if (!localKey) {
    throw new Error('[useLocalAtom] local key is null')
  }
  const storage = isSession ? sessionStorage : localStorage

  const target = atom(storage.getItem(localKey) || '')

  watch(() => target.value, () => {
    storage.setItem(localKey, target.value)
  })

  return target
}

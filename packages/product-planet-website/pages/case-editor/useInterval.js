import {
  atom,
  reactive,
  atomComputed
} from 'axii'

export default function useInterval ({ fps = 30 } = {}) {
  let origin = reactive({ base: 0, gap: 0 })
  const originAtom = atom(origin)

  const seconds = atomComputed(() => {
    return originAtom.value.base + originAtom.value.gap
  })

  let si
  let start = 0
  let isStop = false
  const result = {
    seconds,
    start () {
      isStop = false
      start = Date.now()
      si = setInterval(() => {
        if (isStop) {
          return
        }
        origin.gap = (Date.now() - start)
      }, 1000 / fps)
    },
    stop () {
      isStop = true
      const s = seconds.value
      origin = reactive({ base: s, gap: 0 })
      originAtom.value = origin
      clearInterval(si)
    },
    reset () {
      result.stop()
      origin = reactive({ base: 0, gap: 0 })
      originAtom.value = origin
    },
    gotoSecond (s, withEnd) {
      if (s === Math.floor(seconds.value)) {
        return
      }

      result.reset()
      origin.base = s

      if (!withEnd) {
        result.start()
      }
    }
  }
  return result
}

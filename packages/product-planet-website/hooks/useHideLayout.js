import {
  atomComputed
} from 'axii'
import { historyLocation } from '@/router'
import parseSearch from '@/tools/parseSearch'

export default function () {
  const isHideLayout = atomComputed(() => {
    const search = parseSearch(historyLocation.search)
    // eslint-disable-next-line no-unused-expressions
    historyLocation.pathname
    return search.layout === 'hidden'
  })

  return {
    isHideLayout
  }
}

import { createElement, atomComputed, computed } from 'axii'
import ProtoEditor from '@/components/ProtoEditor'
import { historyLocation } from '@/router'
import parseSearch from '@/tools/parseSearch'

export default () => {
  const pageId = location.pathname.split('/').pop()
  const onStatusSelect = (id) => historyLocation.goto(`${historyLocation.pathname}?layout=hidden&status=${id}`)
  const statusId = atomComputed(() => {
    const search = parseSearch(historyLocation.search)
    return +search.status
  })

  const pinId = computed(() => {
    const search = parseSearch(historyLocation.search)
    return search.pin
  })
  return <ProtoEditor pageId={pageId} statusId={statusId} pinId={pinId} onStatusSelect={onStatusSelect} />
}

import { createElement, atomComputed, atom } from 'axii'
import ProtoEditor from '@/components/ProtoEditor'
import { historyLocation } from '@/router'
import parseSearch from '@/tools/parseSearch'

export default () => {
  const pageId = location.pathname.split('/').pop()
  const onStatusSelect = (id) => historyLocation.goto(`${historyLocation.pathname}?layout=hidden&status=${id}`)
  const status = atomComputed(() => {
    const search = parseSearch(historyLocation.search)
    console.log('compute status', search.status)
    return +search.status
  })
  return <ProtoEditor pageId={pageId} statusId={status} onStatusSelect={onStatusSelect} />
}

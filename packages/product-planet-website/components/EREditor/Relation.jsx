/** @jsx createElement */
import {
  createElement,
  useViewEffect,
  watch,
  traverse,
  computed
} from 'axii'

import Edge from './components/Edge'
import { PORT_JOINT } from '.'

const parsePort = ({ page, status, name }) => {
  return {
    cell: `${page}${PORT_JOINT}${status}`,
    port: name
  }
}

export default function Relation ({ relation, onChange, entities }) {
  const sourcePage = entities.find(x => x.id === relation.source.page)
  const targetPage = entities.find(x => x.id === relation.target.page)
  console.log('>>>>>>>>>>', relation, sourcePage, targetPage)
  if (
    !sourcePage ||
    !targetPage ||
    sourcePage.currentStatus?.id !== relation.source.status ||
    targetPage.currentStatus?.id !== relation.target.status
  ) {
    return null
  }

  useViewEffect(() => {
    if (onChange) {
      watch(() => traverse(relation), onChange)
    }
  })

  const source = computed(() => parsePort(relation.source))
  const target = computed(() => parsePort(relation.target))
  const labels = computed(() => [`${relation.name}[${relation.type}]`])
  return <Edge id={relation.id} labels={labels} source={source} target={target} key={relation.id} />
}

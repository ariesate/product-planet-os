import { createElement, createComponent, propTypes, reactive, atom } from 'axii'
import ReadonlyTable from './ReadonlyTable'
import Table from './Table'

/**
 * @type {import('axii').FC}
 */
function JsonEditor ({ json, editing }) {
  return (
    <div>
      {() => {
        if (json.schema?.type !== 'array' || json.schema?.items?.type !== 'object') {
          return <div>数据异常</div>
        }
        if (editing.value) {
          return <Table json={json} />
        }
        return (
          <ReadonlyTable json={json} />
        )
      }}
    </div>
  )
}

JsonEditor.propTypes = {
  json: propTypes.object.default(() => reactive({ schema: {}, data: [] })),
  editing: propTypes.bool.default(() => atom(false))
}

export default createComponent(JsonEditor)

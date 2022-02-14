import { createElement, createComponent, propTypes, reactive, atom } from 'axii'
import ReadonlyTable from './ReadonlyTable'
import Table from './Table'

/**
 * @type {import('axii').FC}
 */
function JsonEditor ({ schema, data, editing }) {
  return (
    <div>
      {() => {
        if (schema.type !== 'array' || schema.items?.type !== 'object') {
          return <div>数据异常</div>
        }
        if (editing.value) {
          return <Table properties={schema.items.properties} data={data} />
        }
        return (
          <ReadonlyTable properties={schema.items.properties} data={data} />
        )
      }}
    </div>
  )
}

JsonEditor.propTypes = {
  schema: propTypes.object.default(() => reactive({})),
  data: propTypes.array.default(() => reactive([])),
  editing: propTypes.bool.default(() => atom(false))
}

export default createComponent(JsonEditor)

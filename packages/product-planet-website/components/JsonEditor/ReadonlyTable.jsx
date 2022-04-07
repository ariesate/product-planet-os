import {
  createElement,
  createComponent,
  atomComputed,
  propTypes,
  reactive
} from 'axii'
import CheckIcon from 'axii-icons/Check'

/**
 * @type {import('axii').FC}
 */
function ReadonlyTable ({ json }) {
  const columns = atomComputed(() => {
    if (!json.schema.items.properties) {
      return []
    }
    return Object.entries(json.schema.items.properties).map(
      ([key, { type, description }]) => ({
        key,
        type,
        name: description || key
      })
    )
  })
  return (
    <table>
      <thead>
        <tr>
          {() =>
            columns.value.map((col) => (
              <th
                inline
                inline-display-table-cell
                inline-height-40px
                inline-min-width-150px
                key={col.key}>
                {col.name}
              </th>
            ))
          }
        </tr>
      </thead>
      <tbody>
        {() =>
          json.data.map((row, i) => (
            <tr key={i}>
              {columns.value.map((col) => (
                <td
                  inline
                  inline-display-table-cell
                  inline-height-40px
                  inline-padding="0 10px"
                  key={col.key}>
                  {col.type === 'boolean'
                    ? (
                    <CheckIcon
                      layout:inline-display-none={!row[col.key]}
                      size="16"
                      unit="px"
                      fill="#434343"
                      style={{ color: 'transparent' }}
                    />
                      )
                    : (
                        row[col.key]
                      )}
                </td>
              ))}
            </tr>
          ))
        }
      </tbody>
    </table>
  )
}

ReadonlyTable.propTypes = {
  json: propTypes.object.default(() => reactive({ schema: {}, data: [] }))
}

ReadonlyTable.Style = (frag) => {
  frag.root.elements.table.style({
    fontSize: '14px',
    color: '#434343',
    borderCollapse: 'collapse'
  })
  frag.root.elements.th.style({
    fontWeight: '700',
    backgroundColor: '#fafafa',
    border: '1px solid #f0f0f0'
  })
  frag.root.elements.td.style({
    border: '1px solid #f0f0f0'
  })
}

export default createComponent(ReadonlyTable)

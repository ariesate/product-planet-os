import {
  createElement,
  createComponent,
  atomComputed,
  propTypes,
  reactive
} from 'axii'

/**
   * @type {import('axii').FC}
   */
function ReadonlyTable ({ properties, data }) {
  const columns = atomComputed(() => {
    if (!properties) {
      return []
    }
    return Object.entries(properties).map(([key, { type, description }]) => ({
      key,
      type,
      name: description || key
    }))
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
            data.map((row, i) => (
              <tr key={i}>
                {columns.value.map((col) => (
                  <td
                    inline
                    inline-display-table-cell
                    inline-height-40px
                    inline-padding="0 10px"
                    key={col.key}>
                    {row[col.key]}
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
  properties: propTypes.object.default(() => reactive({})),
  data: propTypes.array.default(() => reactive([]))
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

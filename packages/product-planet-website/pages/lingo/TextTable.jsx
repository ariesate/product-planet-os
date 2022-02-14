import {
  createElement,
  Fragment,
  atomComputed,
  atom,
  computed,
  createComponent,
  reactive,
  propTypes,
  createRef
} from 'axii'

TextTable.propTypes = {
  data: propTypes.array.default(() => reactive([])),
  columns: propTypes.number.default(() => reactive([]))
}

function TextTable ({ data, columns }) {
  return (
      <div>
        <table border="1">
            <thead>
            <tr>
            {
              () => columns.map(col => <th style={{ width: col.width || 'auto' }} key={col.key}>{col.label}</th>)
            }
          </tr>
            </thead>
            <tbody>
            {
              () => data.length
                ? data.map((row, index) => {
                  return <tr key={`row${index}`}>
                        {
                            () => columns.map(col => {
                              if (!(row && typeof row === 'object' && col.key && typeof col.key === 'string')) return <td></td>
                              const cell = typeof col.render === 'function' ? col.render(row[col.key], index, col, row, data) : row[col.key]
                              // eslint-disable-next-line react/jsx-key
                              return <td style={{ textAlign: col.textAlign || 'left', padding: '5px 5px' }} >{cell || ''}</td>
                            })
                        }
                    </tr>
                })
                : <tr style={{ textAlign: 'center' }}><td colSpan={columns.length} style={{ padding: '20px' }}>无数据</td></tr>
          }
            </tbody>
        </table>
      </div>
  )
}
TextTable.Style = (fragments) => {
  const el = fragments.root.elements
  el['table'].style({
    border: '1px solid #f0f0f0',
    borderCollapse: 'collapse',
    width: '100%'
  })
  el['th'].style({
    background: '#fafafa',
    height: '40px'
  })
  el['tr'].style({
    borderBottom: '1px solid #f0f0f0',
    borderSpacing: 0
  })
}
export default createComponent(TextTable)

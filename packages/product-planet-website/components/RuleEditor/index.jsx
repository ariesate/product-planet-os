import {
  createComponent,
  createElement,
  debounceComputed,
  watchReactive
} from 'axii'
import Table from './Table'

function defaultOf (type) {
  switch (type) {
    case 'bool':
      return false
    case 'number':
      return 0
    default:
      return ''
  }
}

function RuleEditor ({ source, readOnly, onChange }) {
  watchReactive(source, () => {
    onChange?.(JSON.stringify(source))
  })
  const handleDelCol = (i) => {
    debounceComputed(() => {
      source.columns.splice(i, 1)
      source.data.forEach((row) => row.splice(i, 1))
    })
  }
  const handleDelRow = (i) => {
    debounceComputed(() => {
      source.rows.splice(i, 1)
      source.data.splice(i, 1)
    })
  }
  const handleSetData = (i, j, v) => {
    debounceComputed(() => {
      source.data[i][j] = v
    })
  }
  const handleUpdateCol = (col) => {
    debounceComputed(() => {
      const newCol = {
        key: col.key,
        name: col.name,
        type: col.type
      }
      if (col.index != null) {
        const oldCol = source.columns[col.index]
        source.columns[col.index] = newCol
        if (oldCol.type !== col.type) {
          source.data.forEach((row) => {
            row[col.index] = defaultOf(col.type)
          })
        }
      } else {
        source.columns.push(newCol)
        source.data.forEach((row) => row.push(defaultOf(col.type)))
      }
    })
  }
  const handleUpdateRow = (row) => {
    debounceComputed(() => {
      const newRow = {
        key: row.key,
        name: row.name
      }
      if (row.index != null) {
        source.rows[row.index] = newRow
      } else {
        source.rows.push(newRow)
        source.data.push(source.columns.map((e) => defaultOf(e.type)))
      }
    })
  }
  return (
    <div block flex-display>
      <Table
        source={source}
        readOnly={readOnly}
        onUpdateCol={handleUpdateCol}
        onUpdateRow={handleUpdateRow}
        onSetData={handleSetData}
        onDelRow={handleDelRow}
        onDelCol={handleDelCol}
      />
    </div>
  )
}

export default createComponent(RuleEditor)

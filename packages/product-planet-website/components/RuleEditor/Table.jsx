import { atom, createComponent, createElement, debounceComputed, propTypes } from 'axii'
import PlusIcon from 'axii-icons/Plus'
import { contextmenu, message } from 'axii-components'
import Cell from './Cell'
import ContextMenu from '../ContextMenu'
import ColumnForm from './ColumnForm'
import RowForm from './RowForm'

/**
 * @type {import('axii').FC}
 */
function Table ({
  source,
  onUpdateCol,
  onUpdateRow,
  onDelCol,
  onDelRow,
  onSetData,
  readOnly
}) {
  const curCol = atom({ key: '', name: '', type: 'bool', index: null })
  const curRow = atom({ key: '', name: '', index: null })
  const colDialog = atom(false)
  const rowDialog = atom(false)
  const handleColMenu = (e, i) => {
    e.preventDefault()
    if (readOnly.value) {
      return
    }
    contextmenu.open(
      <ContextMenu
        options={[
          {
            title: '修改列',
            onClick: () => {
              contextmenu.close()
              showColDialog(i)
            }
          },
          {
            title: '删除列',
            onClick: () => {
              contextmenu.close()
              onDelCol?.(i)
            }
          }
        ]}
      />,
      {
        left: e.pageX + 5,
        top: e.pageY + 5
      }
    )
  }
  const handleRowMenu = (e, i) => {
    e.preventDefault()
    if (readOnly.value) {
      return
    }
    contextmenu.open(
      <ContextMenu
        options={[
          {
            title: '修改行',
            onClick: () => {
              contextmenu.close()
              showRowDialog(i)
            }
          },
          {
            title: '删除行',
            onClick: () => {
              contextmenu.close()
              onDelRow?.(i)
            }
          }
        ]}
      />,
      {
        left: e.pageX + 5,
        top: e.pageY + 5
      }
    )
  }
  const handleSaveCol = (col) => {
    if (!col.key) {
      message.error('请填写唯一名称')
      return
    }
    if (!col.name) {
      message.error('请填写显示称')
      return
    }
    if (!col.type) {
      message.error('请选择类型')
      return
    }
    let oldCol
    if (col.index != null) {
      oldCol = source.columns[col.index]
    }
    if (
      (!oldCol || oldCol.key !== col.key) &&
      source.columns.some((e) => e.key === col.key)
    ) {
      message.error('唯一名称已存在')
      return
    }
    onUpdateCol?.(col)
    colDialog.value = false
  }
  const handleSaveRow = (row) => {
    if (!row.key) {
      message.error('请填写唯一名称')
      return
    }
    if (!row.name) {
      message.error('请填写显示称')
      return
    }
    let oldRow
    if (row.index != null) {
      oldRow = source.rows[row.index]
    }
    if (
      (!oldRow || oldRow.key !== row.key) &&
      source.rows.some((e) => e.key === row.key)
    ) {
      message.error('唯一名称已存在')
      return
    }
    onUpdateRow?.(row)
    rowDialog.value = false
  }
  const handleAddCol = () => {
    curCol.value = { name: '', key: '', type: 'bool', index: null }
    colDialog.value = true
  }
  const handleAddRow = () => {
    curRow.value = { name: '', key: '', index: null }
    rowDialog.value = true
  }
  const showColDialog = (i) => {
    debounceComputed(() => {
      const col = source.columns[i]
      curCol.value = {
        key: col.key,
        name: col.name,
        type: col.type,
        index: i
      }
      colDialog.value = true
    })
  }
  const showRowDialog = (i) => {
    debounceComputed(() => {
      const row = source.rows[i]
      curRow.value = {
        key: row.key,
        name: row.name,
        index: i
      }
      rowDialog.value = true
    })
  }
  return (
    <container>
      <content>
        <spacer />
        {() =>
          source.columns.map((e, i) => (
            <col
              key={'col' + i}
              block
              block-padding-6px
              onDblclick={() => showColDialog(i)}
              onContextMenu={(e) => handleColMenu(e, i)}>
              {e.name}
            </col>
          ))
        }
        {() =>
          source.rows.map((e, i) => (
            <row
              key={'row' + i}
              block
              block-padding-6px
              onDblclick={() => showRowDialog(i)}
              onContextMenu={(e) => handleRowMenu(e, i)}>
              {e.name}
            </row>
          ))
        }
        {() =>
          source.data
            .reduce(
              (p, c, j) => [
                ...p,
                ...c.map((e, i) => ({
                  value: e,
                  type: source.columns[i].type,
                  col: i,
                  row: j
                }))
              ],
              []
            )
            .map((e, i) =>
              readOnly.value
                ? (
                <cell block block-width-120px block-padding="0 6px">
                  {e.value}
                </cell>
                  )
                : (
                <Cell
                  key={i}
                  value={e.value}
                  type={e.type}
                  onSubmit={(val) => {
                    onSetData?.(e.row, e.col, val)
                  }}
                />
                  )
            )
        }
      </content>
      <col-line
        block
        block-width-28px
        block-margin-left-4px
        flex-display
        flex-justify-content-center
        flex-align-items-center
        onClick={handleAddCol}>
        <PlusIcon />
      </col-line>
      <row-line
        block
        block-height-28px
        block-margin-top-4px
        flex-display
        flex-justify-content-center
        flex-align-items-center
        onClick={handleAddRow}>
        <PlusIcon />
      </row-line>
      <ColumnForm visible={colDialog} data={curCol} onSubmit={handleSaveCol} />
      <RowForm visible={rowDialog} data={curRow} onSubmit={handleSaveRow} />
    </container>
  )
}

Table.Style = (fragments) => {
  fragments.root.elements.container.style({
    display: 'grid',
    gridTemplate: 'repeat(2, auto) / repeat(2, auto)'
  })
  fragments.root.elements.content.style({
    display: 'grid',
    gridGap: '1px',
    gridAutoFlow: 'dense',
    backgroundColor: '#e2e3e3',
    border: '1px solid #e2e3e3'
  })
  fragments.root.elements['col-line'].style(({ readOnly }) => ({
    display: readOnly.value ? 'none' : 'flex',
    cursor: 'pointer',
    border: '1px dashed #c9d1de',
    borderRadius: '2px'
  }))
  fragments.root.elements['col-line'].match.hover.style({
    background: '#fafafa'
  })
  fragments.root.elements['row-line'].style(({ readOnly }) => ({
    display: readOnly.value ? 'none' : 'flex',
    cursor: 'pointer',
    border: '1px dashed #c9d1de',
    borderRadius: '2px'
  }))
  fragments.root.elements['row-line'].match.hover.style({
    background: '#fafafa'
  })
  fragments.root.elements.icon.style({
    cursor: 'pointer',
    borderRadius: '50%',
    border: '1px solid #000'
  })
  fragments.root.elements.content.style(({ source: { columns, rows } }) => ({
    gridTemplateColumns: `repeat(${columns.length + 1}, 1fr)`,
    gridTemplateRows: `repeat(${rows.length + 1}, 1fr)`
  }))
  fragments.root.elements.spacer.style({
    gridColumn: '1 / span 1',
    gridRow: '1 / span 1',
    backgroundColor: '#e7eaed'
  })
  fragments.root.elements.col.style({
    gridRow: '1 / span 1',
    backgroundColor: '#f8f9fa',
    color: '#333333',
    fontWeight: '500',
    userSelect: 'none'
  })
  fragments.root.elements.row.style({
    gridColumn: '1 / span 1',
    backgroundColor: '#f8f9fa',
    color: '#333333',
    fontWeight: '500',
    userSelect: 'none',
    whiteSpace: 'nowrap'
  })
  fragments.root.elements.cell.style({
    backgroundColor: '#fff',
    lineHeight: '28px'
  })
}

Table.propTypes = {
  readOnly: propTypes.bool.default(() => atom(false))
}

export default createComponent(Table)

import {
  createElement,
  createComponent,
  propTypes,
  reactive,
  atomComputed,
  delegateLeaf,
  atom
} from 'axii'
import PlusIcon from 'axii-icons/Plus'
import SettingIcon from 'axii-icons/Setting'
import DeleteIcon from 'axii-icons/Delete'
import { HoverFeature } from '../Hoverable'
import TableCell from './TableCell'
import PropertyModal, { defaultOf } from './PropertyModal'

function createDefault (cols) {
  return cols.reduce((p, c) => ({ ...p, [c.key]: defaultOf(c.type) }), {})
}

const AppendCell = createComponent(
  ({ children, ...props }) => {
    return (
      <td inline inline-display-table-cell {...props}>
        {children}
      </td>
    )
  },
  [
    HoverFeature,
    (frag) => {
      frag.root.elements.td.style(({ hovered }) => ({
        textAlign: 'center',
        border: '1px dashed #f0f0f0',
        cursor: 'pointer',
        backgroundColor: hovered.value ? '#fafafa' : 'unset'
      }))
    }
  ]
)

const TailCell = createComponent(
  ({ children, ...props }) => {
    return (
      <td inline inline-display-table-cell {...props}>
        {children}
      </td>
    )
  },
  [
    HoverFeature,
    (frag) => {
      frag.root.elements.td.style(({ hovered }) => ({
        textAlign: 'center',
        cursor: 'pointer',
        opacity: hovered.value ? 1 : 0
      }))
    }
  ]
)

const HeaderCell = createComponent(
  ({ children, onClick, ...props }) => {
    return (
      <th
        inline
        inline-display-table-cell
        inline-height-40px
        inline-min-width-150px
        inline-position-relative
        {...props}>
        {children}
        <span
          inline
          inline-display-block
          inline-position-absolute
          inline-top-12px
          inline-right-8px
          onClick={onClick}>
          <SettingIcon />
        </span>
      </th>
    )
  },
  [
    HoverFeature,
    (frag) => {
      frag.root.elements.th.style({
        fontSize: '14px',
        fontWeight: '700',
        backgroundColor: '#fafafa',
        border: '1px solid #f0f0f0'
      })
      frag.root.elements.span.style(({ hovered }) => ({
        textAlign: 'center',
        cursor: 'pointer',
        opacity: hovered.value ? 1 : 0
      }))
    }
  ]
)

/**
 * @type {import('axii').FC}
 */
function Table ({ json }) {
  const showPropertyModal = atom(false)
  const propertyKey = atom()
  const columns = atomComputed(() => {
    if (!json.schema.items.properties) {
      return []
    }
    return Object.entries(json.schema.items.properties).map(([key, { type, description }]) => ({
      key,
      type,
      name: description || key
    }))
  })
  return (
    <div>
      <table>
        <tr>
          {() =>
            columns.value.map((col) => (
              <HeaderCell
                key={col.key}
                onClick={() => {
                  propertyKey.value = col.key
                  showPropertyModal.value = true
                }}>
                {col.name}
              </HeaderCell>
            ))
          }
          <TailCell
            inline-min-width-28px
            onClick={() => {
              propertyKey.value = null
              showPropertyModal.value = true
            }}>
            <PlusIcon />
          </TailCell>
        </tr>
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
                  <TableCell
                    type={col.type}
                    data={delegateLeaf(row)[col.key]}
                  />
                </td>
              ))}
              <TailCell>
                <DeleteIcon
                  fill="#dd3306"
                  onClick={() => {
                    json.data.splice(i, 1)
                  }}
                />
              </TailCell>
            </tr>
          ))
        }
        <tr>
          {() => (
            <AppendCell
              inline-height-28px
              colSpan={columns.value.length}
              onClick={() => {
                json.data.push(createDefault(columns.value))
              }}>
              <PlusIcon />
            </AppendCell>
          )}
        </tr>
      </table>
      <PropertyModal
        visible={showPropertyModal}
        json={json}
        propertykey={propertyKey}
      />
    </div>
  )
}

Table.propTypes = {
  json: propTypes.object.default(() => reactive({ schema: {}, data: [] }))
}

Table.Style = (frag) => {
  frag.root.elements.table.style({
    color: '#434343',
    borderCollapse: 'collapse'
  })
  frag.root.elements.th.style({
    fontSize: '14px',
    fontWeight: '700',
    backgroundColor: '#fafafa',
    border: '1px solid #f0f0f0'
  })
  frag.root.elements.td.style({
    border: '1px solid #f0f0f0'
  })
}

export default createComponent(Table)

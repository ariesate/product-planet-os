import {
  createElement,
  createComponent,
  atom,
  propTypes,
  reactive,
  atomComputed,
  draft
} from 'axii'
import { message } from 'axii-components'
import { Expander } from '@/components/Accordion'
import DeleteIcon from 'axii-icons/Delete'
import WriteIcon from 'axii-icons/Write'
import DiskIcon from 'axii-icons/Disk'
import ReturnIcon from 'axii-icons/Return'
import CautionIcon from 'axii-icons/Caution'
import { HoverFeature } from '@/components/Hoverable'
import { Meta } from '@/models'
import Modal from '@/components/Modal'
import InlineInput from './InlineInput'
import Loading from './Loading'
import JsonEditor from '@/components/JsonEditor'

const HoverableExpander = Expander.extend(HoverFeature)

function ActionButtons ({ buttons }) {
  if (!buttons) {
    return null
  }
  return (
    <div block flex-display block-font-size-0>
      {buttons.map(({ icon: Icon, onClick, fill }, i) => (
        <div
          key={i}
          block
          block-margin-left-18px={i > 0}
          style={{ cursor: 'pointer' }}
          onClick={onClick}>
          <Icon size="16" unit="px" fill={fill} />
        </div>
      ))}
    </div>
  )
}

/**
 * @type {import('axii').FC}
 */
function MetaListItem ({ item, editing, children, onRemoved, ...props }) {
  const source = reactive({ data: [], schema: {} })
  const { draftValue } = draft(source)
  const name = atom('')
  const initialized = atom(false)
  const loading = atom(false)
  const hovered = atom(false)
  const buttons = atomComputed(() => {
    if (!hovered.value) {
      return
    }
    if (editing.value) {
      return [
        {
          icon: ReturnIcon,
          onClick: (e) => {
            e.stopPropagation()
            discard()
          }
        },
        {
          icon: DiskIcon,
          onClick: async (e) => {
            e.stopPropagation()
            loading.value = true
            try {
              await update()
            } catch (error) {
              message.error(error.message)
              return
            } finally {
              loading.value = false
            }
            editing.value = false
          }
        }
      ]
    }
    return [
      {
        icon: WriteIcon,
        onClick: (e) => {
          e.stopPropagation()
          name.value = item.name
          editing.value = true
        }
      },
      {
        icon: DeleteIcon,
        fill: '#dd3306',
        onClick: async (e) => {
          e.stopPropagation()
          Modal.confirm({
            title: (
              <span>
                {Modal.titleIcon(CautionIcon, '#FBBD1B')}
                确认删除当前数据？
              </span>
            ),
            onOk: async () => {
              loading.value = true
              try {
                await remove()
              } catch (error) {
                message.error(error.message)
                return
              } finally {
                loading.value = false
              }
              onRemoved?.()
            }
          })
        }
      }
    ]
  })

  const fetchData = async () => {
    loading.value = true
    let res
    try {
      res = JSON.parse(item.content)
    } catch (error) {
      message.error(error.message)
      return
    } finally {
      loading.value = false
    }
    Object.keys(source.schema).forEach((key) => {
      delete source.schema[key]
    })
    Object.assign(source.schema, res.dataFormat)
    source.data.splice(0, source.data.length, ...res.data)
    initialized.value = true
  }

  const remove = async () => {
    await Meta.remove(item.id)
  }

  const update = async () => {
    if (!draftValue) {
      return
    }
    if (name.value && name.value !== item.name) {
      if (/[^a-zA-Z0-9_]/.test(name.value)) {
        throw new Error('名称格式只能包含字母、数字、下划线')
      }
      if (name.value.length > 30) {
        throw new Error('名称长度不能超过30个字符')
      }
    }
    const content = JSON.stringify({
      dataFormat: draftValue.schema,
      data: draftValue.data
    })
    const data = {
      content
    }
    if (name.value && name.value !== item.name) {
      data.name = name.value
    }
    await item.update(data)
  }

  const discard = () => {
    source.modifiedAt = Date.now()
    editing.value = false
    name.value = ''
  }

  return (
    <HoverableExpander
      layout:block-margin-bottom-12px
      hovered={hovered}
      onChange={(expanded) => {
        if (expanded) {
          fetchData()
        } else {
          discard()
        }
      }}
      title={() => (
        <div
          block
          flex-display
          flex-align-items-center
          flex-justify-content-space-between
          flex-grow-1>
          {editing.value
            ? (
            <InlineInput value={name} placeholder="支持字母、数字、下划线" />
              )
            : (
            <span>{item.name}</span>
              )}
          <ActionButtons buttons={buttons.value} />
        </div>
      )}
      {...props}>
      <div block block-position-relative>
        {() =>
          initialized.value
            ? (
            <JsonEditor
              editing={editing}
              schema={draftValue.schema}
              data={draftValue.data}
            />
              )
            : (
            <Loading />
              )
        }
        {() =>
          initialized.value && loading.value ? <Loading text="处理中" /> : null
        }
      </div>
    </HoverableExpander>
  )
}

MetaListItem.propTypes = {
  data: propTypes.object,
  editing: propTypes.bool.default(() => atom(false))
}

export default createComponent(MetaListItem)

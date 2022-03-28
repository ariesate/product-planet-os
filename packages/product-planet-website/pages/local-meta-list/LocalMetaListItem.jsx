import {
  createElement,
  createComponent,
  atom,
  propTypes,
  reactive,
  atomComputed,
  useRef
} from 'axii'
import { message } from 'axii-components'
import { Expander } from '@/components/Accordion'
import DeleteIcon from 'axii-icons/Delete'
import WriteIcon from 'axii-icons/Write'
import DiskIcon from 'axii-icons/Disk'
import ReturnIcon from 'axii-icons/Return'
import CautionIcon from 'axii-icons/Caution'
import { HoverFeature } from '@/components/Hoverable'
import { LocalMeta } from '@/models'
import Modal from '@/components/Modal'
import InlineInput from '@/components/InlineInput'
import Loading from '@/components/Loading'
import JsonEditor from '@/components/JsonEditor'
import { getDefaultValue } from './data'
import EmbeddedEditor from './EmbeddedEditor'

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
function LocalMetaListItem ({ item, editing, children, onRemoved, ...props }) {
  const source = reactive({ data: [], schema: {} })
  const name = atom('')
  const initialized = atom(false)
  const loading = atom(false)
  const hovered = atom(false)
  const embedded = useRef()
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
          onClick: (e) => {
            e.stopPropagation()
            if (item.type === 'map') {
              handleUpdate({
                content: JSON.stringify(source)
              })
            } else {
              embedded.current?.save()
            }
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
    if (item.type === 'map') {
      let content
      try {
        content = item.content ? JSON.parse(item.content) : getDefaultValue()
      } catch (error) {
        message.error(error.message)
        return
      }
      source.data = content.data
      source.schema = content.schema
    }
    initialized.value = true
  }

  const remove = async () => {
    await LocalMeta.remove(item.id)
  }

  const update = async (data) => {
    if (name.value && name.value !== item.name) {
      if (/[^a-zA-Z0-9_]/.test(name.value)) {
        throw new Error('名称格式只能包含字母、数字、下划线')
      }
      if (name.value.length > 20) {
        throw new Error('名称长度不能超过20个字符')
      }
      data.name = name.value
    }
    await item.update(data)
  }

  const handleUpdate = async (data) => {
    loading.value = true
    try {
      await update(data)
    } catch (error) {
      message.error(error.message)
      return
    } finally {
      loading.value = false
    }
    message.success('保存成功')
    editing.value = false
  }

  const discard = () => {
    fetchData()
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
          item.type === 'map'
            ? (
                initialized.value
                  ? (
              <JsonEditor editing={editing} json={source} />
                    )
                  : (
              <Loading />
                    )
              )
            : (
            <EmbeddedEditor ref={embedded} editing={editing} item={item} name={name} onUpdate={handleUpdate} />
              )
        }
        {() =>
          initialized.value && loading.value ? <Loading text="处理中" /> : null
        }
      </div>
    </HoverableExpander>
  )
}

LocalMetaListItem.propTypes = {
  data: propTypes.object,
  editing: propTypes.bool.default(() => atom(false))
}

export default createComponent(LocalMetaListItem)

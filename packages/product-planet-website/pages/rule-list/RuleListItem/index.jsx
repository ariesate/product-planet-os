import { createElement, createComponent, reactive, atom, useViewEffect } from 'axii'
import { message } from 'axii-components'
import UpIcon from 'axii-icons/Up'
import DownIcon from 'axii-icons/Down'
import DeleteIcon from 'axii-icons/Delete'
import WriteIcon from 'axii-icons/Write'
import DiskIcon from 'axii-icons/Disk'
import ReturnIcon from 'axii-icons/Return'
import RuleEditor from '@/components/RuleEditor'

import styles from './style.module.less'

export const RULE_CACHE_KEY = 'pp-meta-data'

const customEditorURL = (rule) => `/editor.html?id=${rule.id}&type=${rule.type}&name=${rule.name}&editor=${rule.editor}`

function tableContent (rule) {
  // 只有二维表需要
  if (rule.type !== 'map') return
  const content = rule.content
    ? JSON.parse(rule.content)
    : {
        columns: [
          {
            key: 'col-1',
            name: '列名',
            type: 'string'
          }
        ],
        rows: [
          {
            key: 'row-1',
            name: '行名'
          }
        ],
        data: [['数据']]
      }
  return reactive(content)
}

/**
 * @type {import('axii').FC}
 */
function RuleListItem ({ rule, onDelete, expandKey, onExpand, onSave }) {
  const isReadOnly = atom(true)

  const handleSave = async (content) => {
    const data = {
      id: rule.id,
      name: rule.name,
      key: rule.key
    }
    if (typeof content === 'string') {
      data.content = content
    }
    await onSave?.(data, rule.type === 'map')

    isReadOnly.value = true
  }

  const handleToggle = () => {
    if (expandKey.value !== rule.id) {
      window.localStorage.setItem(RULE_CACHE_KEY, rule.content || '')
      onExpand?.(rule.id)
    } else {
      window.localStorage.removeItem(RULE_CACHE_KEY)
      onExpand?.(-1)
    }
  }
  const handleEdit = () => {
    isReadOnly.value = false
  }
  const handleCancel = () => {
    isReadOnly.value = true
  }

  useViewEffect(() => {
    const type = 'message'
    const handler = ({ data }) => {
      if (`${data.id}` === `${rule.id}`) {
        handleSave(data.content)
      }
    }
    window.addEventListener(type, handler)
    return () => window.removeEventListener(type, handler)
  })

  return (
    <container block block-margin-bottom-12px>
      <header
        block
        block-padding-18px
        flex-display
        flex-align-items-center
        flex-justify-content-space-between
        className={styles.header}
        onClick={handleToggle}
      >
        <info block flex-display flex-align-items-center>
          <indicator block block-margin-right-8px block-padding-top-6px>
            {() => (expandKey.value === rule.id ? <UpIcon /> : <DownIcon />)}
          </indicator>
          <name block block-margin-right-24px>
            {function () {
              if (isReadOnly.value) {
                return rule.name
              }
              return (
                <line>
                  <span inline inline-margin-right-12px>名称:</span>
                  <input
                    placeholder="请输入名称"
                    value={rule.name}
                    onBlur={(e) => {
                      rule.name = e.target.value
                    }}
                  />
                </line>
              )
            }}
          </name>
          <desc block>
            {function () {
              if (isReadOnly.value) {
                return null
              }
              return (
                <line>
                  <span inline inline-margin-right-12px>Key:</span>
                  <input
                    pattern="[a-zA-Z0-9_]"
                    placeholder="请输入key"
                    value={rule.key}
                    onBlur={(e) => {
                      if (
                        e.target.value &&
                        !/^[a-zA-Z$_][a-zA-Z\d_]*$/.test(e.target.value)
                      ) {
                        message.warning('元数据key不合法')
                        return
                      }
                      rule.key = e.target.value
                    }}
                  />
                </line>
              )
            }}
          </desc>
        </info>
        <actions
          block
          flex-display
          block-padding-left-24px
          onClick={(e) => {
            e.stopPropagation()
          }}>
          {function () {
            if (isReadOnly.value) {
              return (
                <line block flex-display className={styles.hoverIcons}>
                  <action block block-margin-right-12px onClick={handleEdit}>
                    <WriteIcon />
                  </action>
                  <action block block-margin-right-12px onClick={onDelete}>
                    <DeleteIcon fill="#dd3306" />
                  </action>
                </line>
              )
            }
            return (
              <line block flex-display className={styles.icons}>
                <action block block-margin-right-12px onClick={handleCancel}>
                  <ReturnIcon />
                </action>
                <action block block-margin-right-12px onClick={handleSave}>
                  <DiskIcon />
                </action>
              </line>
            )
          }}
        </actions>
      </header>
      {function () {
        if (expandKey.value === rule.id) {
          return (
            <content
              block
              block-padding-24px
              block-visible-none={expandKey.value !== rule.id}>
              {() =>
                rule.type === 'map'
                  ? <RuleEditor source={tableContent(rule)} rule={rule} onChange={handleSave} />
                  : <iframe src={customEditorURL(rule)} width="100%" height={800} frameBorder={0} />
              }
            </content>
          )
        }
        return null
      }}
    </container>
  )
}

RuleListItem.Style = (frag) => {
  frag.root.elements.container.style({
    backgroundColor: '#fff',
    borderRadius: '4px'
  })
  frag.root.elements.content.style({
    overflowX: 'scroll'
  })
  frag.root.elements.header.style({
    boxShadow: '0px 0px 4px #c9d1de',
    userSelect: 'none'
  })
  frag.root.elements.name.style({
    fontSize: '16px',
    color: '#333'
  })
  frag.root.elements.desc.style({
    fontSize: '16px',
    color: '#555'
  })
  frag.root.elements.action.style({
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  })
  frag.root.elements.primary.style({
    color: 'rgba(0, 0, 0, 0.85)'
  })
  frag.root.elements.danger.style({
    color: '#dd3306'
  })
  frag.root.elements.input.style({
    border: 'none',
    background: 'none',
    borderBottom: 'solid 1px',
    fontSize: '16px',
    outline: 'none'
  })
}

export default createComponent(RuleListItem)

import {
  propTypes,
  createElement,
  Fragment,
  atom,
  createComponent,
  atomComputed,
  reactive
} from 'axii'
import DownIcon from 'axii-icons/Down.js'
import RightIcon from 'axii-icons/Right.js'
import { pattern as scen } from 'axii-components'
import { createTreeMate } from 'treemate'
import isEmpty from 'lodash/isEmpty'
import styles from './style.module.less'

/**
 * TODO: sync to axii-components
 */

/**
 *
 * @param {import('treemate').TreeNode} node
 * @param {{value: string}} activeKey
 * @param {*} actions
 * @param {{value: import('treemate').TreeMate}} treeMate
 * @param {*} fragments
 * @returns
 */
function renderItem (node, activeKey, actions, treeMate, collapsed, fragments) {
  const { rawNode, key, children } = node
  const { onFold, onOpen, onSetActive } = actions
  const hasChildren = atomComputed(() => !isEmpty(children))

  return (
    <>
      <item
        block-position-relative
        block
        flex-display
        flex-align-items-center
        key={key}
        className={styles['item']}
      >
        <expand
          inline
          flex-display
          flex-align-items-center
          onClick={() => (rawNode.expand ? onFold(node) : onOpen(node))}>
          {() =>
            hasChildren.value
              ? rawNode.expand && !collapsed.value
                ? <DownIcon />
                : <RightIcon />
              : null
          }
        </expand>
        <name
          block
          flex-grow-1
          onClick={() => {
            onSetActive(node, treeMate)
            if (node.children?.length) {
              onOpen(node)
            }
          }}>
          {rawNode.title}
        </name>
        {() => {
          if (!hasChildren.value || !collapsed.value) {
            return null
          }
          return <popover>
            {node.children.map((childNode) => {
              return fragments.item({ node: childNode, activeKey, treeMate, collapsed })(
                renderItem(childNode, activeKey, actions, treeMate, fragments)
              )
            })}
          </popover>
        }}
      </item>
      {() => {
        if (!hasChildren.value || !rawNode.expand || collapsed.value) {
          return null
        }
        return <div>
          {
            () => node.children.map((childNode) => {
              return fragments.item({ node: childNode, activeKey, treeMate })(
                renderItem(childNode, activeKey, actions, treeMate, fragments)
              )
            })
          }
        </div>
      }}
    </>
  )
}

export function Menu (
  { options, onFold, onOpen, onSetActive, activeKey, collapsed },
  fragments
) {
  /** @type {{value: import('treemate').TreeMate}} */
  const treeMate = atomComputed(() => createTreeMate(options))

  return (
    <container block>
      {function rootMenuData () {
        return treeMate.value.treeNodes.map((node) =>
          fragments.item({ node, activeKey, treeMate, collapsed })(
            renderItem(
              node,
              activeKey,
              { onFold, onOpen, onSetActive },
              treeMate,
              collapsed,
              fragments
            )
          )
        )
      }}
    </container>
  )
}

Menu.propTypes = {
  data: propTypes.object.default(() => reactive([])),
  onFold: propTypes.callback.default(
    () => (node) => (node.rawNode.expand = false)
  ),
  onOpen: propTypes.callback.default(
    () => (node) => (node.rawNode.expand = true)
  ),
  onSetActive: propTypes.callback.default(
    () =>
      (node, treeMate, _, { activeKey }) => {
        activeKey.value = node.children?.length
          ? node.children[0].key
          : node.key
      }
  ),
  activeKey: propTypes.string.default(() => atom('')),
  collapsed: propTypes.bool.default(() => atom(false))
}

Menu.Style = (fragments) => {
  fragments.item.elements.expand.style({
    width: 20,
    userSelect: 'none',
    cursor: 'pointer'
  })

  fragments.item.elements.item.style(({ node, activeKey, collapsed }) => {
    const isActive = activeKey.value === node.key
    return {
      padding: scen().spacing(),
      paddingLeft: scen().spacing(2) * (collapsed.value ? 0 : node.level),
      borderLeft: isActive ? '4px rgba(0, 0, 0, .85) solid' : undefined,
      background: isActive ? 'rgba(0, 0, 0, .05) ' : 'transparent',
      userSelect: 'none',
      cursor: 'pointer'
    }
  })

  fragments.item.elements.name.style(({ node }) => {
    return {
      color: node.level > 0 ? scen().color(-5) : scen().color(5)
    }
  })
}

export default createComponent(Menu)

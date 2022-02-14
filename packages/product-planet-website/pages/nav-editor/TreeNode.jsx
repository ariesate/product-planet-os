import { createElement, createComponent, computed } from 'axii'
import { contextmenu } from 'axii-components'
import DownIcon from 'axii-icons/Reduce'
import RightIcon from 'axii-icons/Add'
import PageIcon from 'axii-icons/FileHash'
import ContextMenu from '@/components/ContextMenu'
import Editable from '@/components/Editable'

function TreeNode ({ type, name, expanded, children, path, onCommand }) {
  const handleClick = (e) => {
    e.stopPropagation()
    onCommand?.({ cmd: 'exp' })
  }
  const handleRename = (value) => {
    onCommand?.({ cmd: 'ren', value })
  }
  const contextOptions = computed(() => {
    const options = [
      { title: '下移', onClick: () => onCommand?.({ cmd: 'down' }) },
      { title: '上移', onClick: () => onCommand?.({ cmd: 'up' }) },
      { title: '删除', onClick: () => onCommand?.({ cmd: 'del' }) }
    ]
    if (type === 'group') {
      options.unshift({
        title: '插入',
        children: [
          {
            title: '分组',
            onClick: () => onCommand?.({ cmd: 'ins', type: 'group' })
          },
          {
            title: '页面',
            children: [
              {
                title: '新页面',
                onClick: () => onCommand?.({ cmd: 'ins', type: 'page' })
              },
              {
                title: '选择页面',
                onClick: () =>
                  onCommand?.({ cmd: 'ins', type: 'page', mode: 'pick' })
              }
            ]
          }
        ]
      })
    }
    return options
  })
  const handleContextMenu = (e) => {
    e.stopPropagation()
    e.preventDefault()
    contextmenu.open(<ContextMenu options={contextOptions} />, {
      left: e.pageX,
      top: e.pageY
    })
  }

  return (
    <container block block-padding-left-20px block-margin-bottom-2px>
      <line
        block
        flex-display
        flex-align-items-center
        onContextMenu={handleContextMenu}>
        {() =>
          type === 'group'
            ? (
            <toggle
              block
              block-margin-right-4px
              block-font-size-0
              onClick={handleClick}>
              {expanded
                ? (
                <DownIcon size="16" unit="px" />
                  )
                : (
                <RightIcon size="16" unit="px" />
                  )}
            </toggle>
              )
            : (
            <PageIcon
              layout:block
              layout:block-margin-right-4px
              size="16"
              unit="px"
            />
              )
        }
        <Editable
          value={name}
          size="16px"
          placeholder="未命名"
          onSubmit={handleRename}
        />
      </line>
      {() =>
        type === 'group' && expanded
          ? (
          <children>
            {children.map((node, i) => (
              <TreeNodeComp
                {...node}
                key={i}
                path={[...path, i]}
                onCommand={(props) => {
                  onCommand?.({ path: [...path, i], ...props })
                }}
              />
            ))}
          </children>
            )
          : null
      }
    </container>
  )
}

TreeNode.Style = (fragments) => {
  fragments.root.elements.container.style({
    cursor: 'default'
  })
  fragments.root.elements.line.style({
    fontSize: 0
  })
  fragments.root.elements.title.style({
    userSelect: 'none'
  })
  fragments.root.elements.toggle.style({
    cursor: 'pointer'
  })
}
const TreeNodeComp = createComponent(TreeNode)

export default TreeNodeComp

import { createElement, createComponent } from 'axii'
import { contextmenu } from 'axii-components'
import PageIcon from 'axii-icons/FileHash'
import ContextMenu from '@/components/ContextMenu'

function PageNode ({ name, onCommand }) {
  const handleContextMenu = (e) => {
    e.stopPropagation()
    e.preventDefault()
    contextmenu.open(
      <ContextMenu
        options={[
          { title: '删除', onClick: () => onCommand?.({ cmd: 'del' }) }
        ]}
      />,
      {
        left: e.pageX,
        top: e.pageY
      }
    )
  }
  return (
    <container
      block
      block-margin-bottom-4px
      flex-display
      flex-align-items-center
      onContextMenu={handleContextMenu}>
      <PageIcon
        layout:block
        layout:block-margin-right-4px
        layout:block-font-size-0
        size="16"
        unit="px"
      />
      <name>{name}</name>
    </container>
  )
}

PageNode.Style = (fragments) => {
  fragments.root.elements.name.style({
    fontSize: '18px',
    userSelect: 'none'
  })
}

export default createComponent(PageNode)

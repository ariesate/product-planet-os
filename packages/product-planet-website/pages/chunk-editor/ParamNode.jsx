import { createElement, createComponent } from 'axii'
import { contextmenu } from 'axii-components'
import ContextMenu from '@/components/ContextMenu'
import Editable from '@/components/Editable'
import ParamIcon from './ParamIcon'

function ParamNode ({ name, type, onCommand }) {
  const handleRename = (value) => {
    onCommand?.({ cmd: 'ren', value })
  }
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
      <ParamIcon type={type} layout:block-margin-right-4px />
      <Editable
        value={name}
        size="18px"
        placeholder="未命名"
        onSubmit={handleRename}
      />
    </container>
  )
}

ParamNode.Style = (fragments) => {
  fragments.root.elements.container.style({
    userSelect: 'none'
  })
}

export default createComponent(ParamNode)

import { createElement, createComponent } from 'axii'
import CheckIcon from 'axii-icons/CheckOne'

/**
 * 页面列表元素
 * @param {{data: Page; checked: boolean; onToggle?: ()=>void}} param0
 */
function PageListItem ({ data, checked, onToggle }) {
  return (
    <container
      block
      block-margin-bottom-12px
      block-padding-12px
      flex-display
      flex-justify-content-space-between
      flex-align-items-center
      onClick={onToggle}>
      <name>{data.name}</name>
      <toggle block block-padding-4px>
        <CheckIcon fill={checked ? '#454545' : '#a1a1a1'} />
      </toggle>
    </container>
  )
}

PageListItem.Style = (fragments) => {
  fragments.root.elements.container.style({
    backgroundColor: '#f0f3f8',
    borderRadius: '8px',
    boxShadow: '0px 0px 4px #c9d1de',
    fontSize: '20px',
    cursor: 'pointer'
  })
}

export default createComponent(PageListItem)

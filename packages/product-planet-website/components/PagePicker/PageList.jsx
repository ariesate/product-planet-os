import { createElement, createComponent } from 'axii'
import PageListItem from './PageListItem'

/**
 * 页面列表
 * @param {{items: Page[], selected: Page[]}} param0
 */
function PageList ({ items, selected }) {
  return (
    <list
      block
      flex-display
      flex-direction-column
      flex-align-self-stretch
      block-padding="0 4px"
      block-margin-top-24px>
      {() =>
        items.map((option, i) => (
          <PageListItem
            key={i}
            data={option}
            checked={selected.includes(option)}
            onToggle={() => {
              const index = selected.indexOf(option)
              if (index < 0) {
                selected.push(option)
              } else {
                selected.splice(index, 1)
              }
            }}
          />
        ))
      }
    </list>
  )
}

PageList.Style = (fragments) => {
  fragments.root.elements.list.style({
    overflowY: 'auto'
  })
}

export default createComponent(PageList)

import { Tabs } from 'axii-components'

const CustomTabs = Tabs.extend((fragments) => {
  fragments.tabHeader.elements.tabHeader.style({
    padding: '16px 0 16px 24px'
  })
})

export default CustomTabs

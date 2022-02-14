import { createElement, reactive, createComponent, useViewEffect } from 'axii'
import { Page } from '@/models'
import PageList from './PageList'
import SearchBar from './SearchBar'
import { useVersion } from '@/layouts/VersionLayout'
import Button from '@/components/Button.new'

/**
 * 页面选择器
 * @param {{filter?: WhereOptions<Page>, onConfirm?: (pages: Page[])}} param0
 */
function PagePicker ({ onConfirm, filter }) {
  const version = useVersion()
  const items = reactive([])
  const selected = reactive([])
  const handleSearch = (text) => {
    selected.value = []
    if (text) {
      const where = [['name', 'like', `%${text}%`]]
      if (version.value) {
        where.push({
          method: 'andWhere',
          children: {
            version: {
              id: version.value.id
            }
          }
        })
      }
      if (filter) {
        where.push({
          method: 'andWhere',
          children: filter
        })
      }
      Page.find({
        where,
        fields: ['id', 'name']
      }).then((res) => {
        items.splice(0, items.length, ...res)
      })
    } else {
      items.splice(0)
    }
  }
  const handleClick = (e) => {
    e.stopPropagation()
  }
  const handleConfirm = () => {
    onConfirm?.(selected)
  }
  useViewEffect(() => {
    Page.find({
      where: {
        version: {
          id: version.value.id
        }
      },
      fields: ['id', 'name']
    }).then((res) => {
      items.splice(0, items.length, ...res)
    })
  })
  return (
    <container
      block
      block-padding-24px
      block-min-width-600px
      block-min-height-480px
      block-max-height-500px
      flex-display
      flex-direction-column
      flex-align-items-center
      onClick={handleClick}>
      <SearchBar onSearch={handleSearch} />
      <PageList items={items} selected={selected} />
      <bottom block block-margin-top-auto block-padding-top-12px>
        <Button primary onClick={handleConfirm}>
          确认
        </Button>
      </bottom>
    </container>
  )
}

PagePicker.Style = (fragments) => {
  fragments.root.elements.container.style({
    backgroundColor: '#ffffff',
    borderRadius: '4px'
  })
}

export default createComponent(PagePicker)

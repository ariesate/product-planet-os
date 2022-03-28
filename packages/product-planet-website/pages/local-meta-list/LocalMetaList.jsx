import { Accordion } from '@/components/Accordion'
import Button from '@/components/Button'
import { LocalMeta } from '@/models'
import { createElement, createComponent, atom, useViewEffect } from 'axii'
import { useVersion } from '@/layouts/VersionLayout'
import LocalMetaListItem from './LocalMetaListItem'
import LocalMetaModal from './LocalMetaModal'

/**
 * @type {import('axii').FC}
 */
function LocalMetaList () {
  const items = atom([])
  const version = useVersion()
  const showMetaModal = atom(false)

  const fetchItems = async () => {
    const res = await LocalMeta.find({
      where: {
        version: version.value.id
      }
    })
    items.value = res
  }

  useViewEffect(() => {
    fetchItems()
  })

  return (
    <container block block-padding-15px>
      {() =>
        !items.value?.length
          ? (
          <empty
            block
            block-margin-top-100px
            flex-display
            flex-direction-column
            flex-align-items-center>
            <p>当前无数据</p>
            <Button
              onClick={() => {
                showMetaModal.value = true
              }}>
              添加数据
            </Button>
          </empty>
            )
          : (
          <content>
            <div block flex-display block-margin-bottom-24px>
              <Button primary
                onClick={() => {
                  showMetaModal.value = true
                }}>
                添加数据
              </Button>
            </div>
            <Accordion strict={false}>
              {items.value.map((item) => (
                <LocalMetaListItem
                  key={item.id}
                  item={item}
                  onRemoved={fetchItems}
                />
              ))}
            </Accordion>
          </content>
            )
      }
      <LocalMetaModal visible={showMetaModal} onCreated={fetchItems} />
    </container>
  )
}

export default createComponent(LocalMetaList)

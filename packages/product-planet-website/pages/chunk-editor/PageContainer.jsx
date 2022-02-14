import { createElement, Fragment, createComponent, atom } from 'axii'
import { contextmenu } from 'axii-components'
import ContextMenu from '@/components/ContextMenu'
import Mask from '@/components/Mask'
import PagePicker from '@/components/PagePicker'
import PageNode from './PageNode'

function PageContainer ({ data, onCommand }) {
  const visible = atom(false)
  const handleCommand = (props) => {
    onCommand?.({ path: [], ...props })
    contextmenu.close()
  }
  const handleInsert = (pages) => {
    visible.value = false
    if (pages?.length) {
      handleCommand({ cmd: 'ins', pages })
    }
  }
  const handleContextMenu = (e) => {
    e.preventDefault()
    contextmenu.open(
      <ContextMenu
        options={[
          {
            title: '添加页面',
            onClick: () => {
              contextmenu.close()
              visible.value = true
            }
          }
        ]}
      />,
      {
        left: e.pageX,
        top: e.pageY
      }
    )
  }
  return (
    <>
      <container
        block
        flex-display
        flex-grow-1
        flex-direction-column
        onContextMenu={handleContextMenu}>
        {() =>
          data.map((node, i) => (
            <PageNode
              {...node}
              key={i}
              onCommand={(props) => {
                onCommand?.({ index: i, ...props })
                contextmenu.close()
              }}
            />
          ))
        }
      </container>
      <Mask dismissible visible={visible}>
        <PagePicker onConfirm={handleInsert} />
      </Mask>
    </>
  )
}

export default createComponent(PageContainer)

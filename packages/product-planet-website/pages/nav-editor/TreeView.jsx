import { createElement, Fragment, createComponent, useRef, atom } from 'axii'
import { contextmenu } from 'axii-components'
import ContextMenu from '@/components/ContextMenu'
import TreeNode from './TreeNode'
import Mask from '@/components/Mask'
import PagePicker from '@/components/PagePicker'

function TreeView ({ data, onCommand }) {
  const visible = atom(false)
  const ctx = useRef([])
  const handleCommand = (props) => {
    contextmenu.close()
    onCommand?.({ path: [], ...props })
  }
  const handleInsert = (pages) => {
    visible.value = false
    if (pages?.length) {
      handleCommand({ path: ctx.current, cmd: 'ins', type: 'page', pages })
    }
  }
  const handleContextMenu = (e) => {
    e.preventDefault()
    contextmenu.open(
      <ContextMenu
        options={[
          {
            title: '插入',
            children: [
              {
                title: '分组',
                onClick: () => handleCommand({ cmd: 'ins', type: 'group' })
              },
              {
                title: '页面',
                children: [
                  {
                    title: '新页面',
                    onClick: () => handleCommand({ cmd: 'ins', type: 'page' })
                  },
                  {
                    title: '选择页面',
                    onClick: () => {
                      contextmenu.close()
                      ctx.current = []
                      visible.value = true
                    }
                  }
                ]
              }
            ]
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
      <container block flex-grow-1 onContextMenu={handleContextMenu}>
        {() =>
          data.map((node, i) => (
            <TreeNode
              {...node}
              key={i}
              path={[i]}
              layout:block-padding-left-0
              onCommand={(props) => {
                contextmenu.close()
                if (props.cmd === 'ins' && props.mode === 'pick') {
                  ctx.current = [i]
                  visible.value = true
                } else {
                  onCommand?.({ path: [i], ...props })
                }
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

export default createComponent(TreeView)

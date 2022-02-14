import { createElement } from 'axii'
import { contextmenu } from 'axii-components'
import ContextMenu from '@/components/ContextMenu'
import ParamNode from './ParamNode'

function ParamsContainer ({ data, onCommand }) {
  const handleCommand = (props) => {
    onCommand?.({ path: [], ...props })
    contextmenu.close()
  }
  const handleInsert = (type) => {
    handleCommand({ cmd: 'ins', type })
  }
  const handleContextMenu = (e) => {
    e.preventDefault()
    contextmenu.open(
      <ContextMenu
        options={[
          {
            title: '添加参数',
            children: [
              {
                title: '字符串',
                onClick: () => {
                  handleInsert('string')
                }
              },
              {
                title: '数值',
                onClick: () => {
                  handleInsert('number')
                }
              },
              {
                title: '布尔',
                onClick: () => {
                  handleInsert('boolean')
                }
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
    <container
      block
      flex-display
      flex-grow-1
      flex-direction-column
      onContextMenu={handleContextMenu}>
      {() =>
        data.map((node, i) => (
          <ParamNode
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
  )
}

export default ParamsContainer

/** @jsx createElement */
import {
  createElement,
  useViewEffect,
  useContext
} from 'axii'
import { GraphContext } from './Graph.jsx'

const attrs = {
  circle: {
    r: 6,
    magnet: true,
    stroke: '#31d0c6',
    strokeWidth: 2,
    fill: '#fff',
    opacity: 0.5
  }
}

// Axii node 只是负责做声明周期的管理，其他的能力全部 delegate 给里面的 axii 组件。
// componentProps 才是真正传给里面组件用的数据
export default function AxiiNode ({ id, shape = 'axii-shape', component, viewProps = {}, ...componentProps }) {
  const graphRef = useContext(GraphContext)
  useViewEffect(() => {
    const node = graphRef.value.addNode({
      id,
      shape,
      component,
      ports: {
        groups: {
          group0: {
            position: 'left',
            attrs
          },
          group1: {
            position: 'right',
            attrs
          },
          group2: {
            position: 'bottom',
            attrs
          }
        }
      },
      ...viewProps,
      // CAUTION 只能写成这样是应为初始化是 x6 会对参数深度 clone，导致 reactive 引用丢失。
      getAxiiProps: () => componentProps
    })

    // TODO 处理位置等信息的同步

    return () => {
      graphRef.value.removeNode(node)
    }
  })

  return null
}

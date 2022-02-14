import { Addon } from '@antv/x6'
import { imageShapes } from './Graph'

const baseConfig = {
  stencilGraphWidth: 200,
  stencilGraphHeight: 200,
  groups: [
    {
      title: '线框图',
      name: 'common'
    }
  ],
  layoutOptions: {
    columns: 2,
    columnWidth: 100,
    rowHeight: 60
  }
}

export function Stencil (config = {}) {
  // #region 初始化 stencil
  const stencil = new Addon.Stencil({
    ...baseConfig,
    ...config
  })
  config.container?.appendChild(stencil.container)
  const group1 = imageShapes.map(shape => {
    return config.target?.createNode({
      shape: shape.key,
      width: 80,
      height: 40
    })
  })
  stencil.load(group1, 'common')
  return stencil
}

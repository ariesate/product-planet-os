
import { Graph as GraphX6, Shape, Addon } from '@antv/x6'

const defaultWidth = 80
const defaultHeight = 40

export const imageShapes = [{
  key: 'defaultRect',
  config: {
    inherit: 'rect'
  }
}, {
  key: 'defaultEllipse',
  config: {
    inherit: 'rect',
    attrs: {
      body: {
        rx: 20,
        ry: 26
      }
    }
  }
}, {
  key: 'defaultArcRect',
  config: {
    inherit: 'rect',
    attrs: {
      body: {
        rx: 6,
        ry: 6
      }
    }
  }
}, {
  key: 'defaultCircle',
  config: {
    inherit: 'circle',
    height: defaultHeight,
    width: defaultHeight,
    attrs: {
      body: {
        rx: 6,
        ry: 6
      }
    }
  }
}, {
  key: 'defaultText',
  config: {
    inherit: 'rect',
    label: '文本',
    attrs: {
      body: {
        stroke: 0,
        fill: 'rgb(0,0,0,0)'
      }
    }
  }
}]

imageShapes.map(({ key, config = {} }) =>
  GraphX6.registerNode(key, {
    inherit: config.inherit,
    label: config.label || '',
    height: config.height || defaultHeight,
    width: config.width || defaultWidth,
    attrs: {
      body: {
        stroke: '#000000',
        strokeWidth: 1,
        fill: 'rgb(0,0,0,0)',
        ...(config.attrs?.body || {})
      }
    }
  })
)

const baseConfig = {
  grid: true,
  mousewheel: {
    enabled: true,
    zoomAtMousePosition: true,
    modifiers: 'ctrl',
    minScale: 0.5,
    maxScale: 3
  },
  highlighting: {
    magnetAdsorbed: {
      name: 'stroke',
      args: {
        attrs: {
          fill: '#5F95FF',
          stroke: '#5F95FF'
        }
      }
    }
  },
  resizing: true,
  rotating: true,
  selecting: {
    enabled: true,
    rubberband: true,
    showNodeSelectionBox: true
  },
  snapline: true,
  keyboard: true,
  clipboard: true
}

export function Graph (config = {}) {
  // 初始化画布
  const graph = new GraphX6({ ...baseConfig, ...config })

  graph.enableHistory()

  // 快捷键
  // copy
  graph.bindKey(['meta+c', 'ctrl+c'], () => {
    const cells = graph.getSelectedCells()
    if (cells.length) {
      graph.copy(cells)
    }
    return false
  })
  graph.bindKey(['meta+x', 'ctrl+x'], () => {
    const cells = graph.getSelectedCells()
    if (cells.length) {
      graph.cut(cells)
    }
    return false
  })
  graph.bindKey(['meta+v', 'ctrl+v'], () => {
    if (!graph.isClipboardEmpty()) {
      const cells = graph.paste({ offset: 32 })
      graph.cleanSelection()
      graph.select(cells)
    }
    return false
  })

  // undo redo
  graph.bindKey(['meta+z', 'ctrl+z'], () => {
    if (graph.history.canUndo()) {
      graph.history.undo()
    }
    return false
  })
  graph.bindKey(['meta+shift+z', 'ctrl+shift+z'], () => {
    if (graph.history.canRedo()) {
      graph.history.redo()
    }
    return false
  })

  graph.history.on('change', () => {
    console.log('change', graph.history.canRedo(), graph.history.canUndo())
  })

  // select all
  graph.bindKey(['meta+a', 'ctrl+a'], () => {
    const nodes = graph.getNodes()
    if (nodes) {
      graph.select(nodes)
    }
  })

  // unselect all
  graph.bindKey(['esc'], () => {
    const nodes = graph.getNodes()
    if (nodes) {
      graph.unselect(nodes)
    }
  })
  return graph
}

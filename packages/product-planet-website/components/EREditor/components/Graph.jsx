import { createElement, useViewEffect, useRef, createContext, atom, propTypes } from 'axii'

export const GraphContext = createContext()

export default function Graph ({ children, createGraph }) {
  const containerRef = useRef()
  const graphRef = atom()

  useViewEffect(() => {
    const graph = createGraph()
    graphRef.value = graph

    const resizeFn = () => {
      const { width, height } = getContainerSize()
      graph.resize(width, height)
    }
    resizeFn()

    window.addEventListener('resize', resizeFn)

    return () => {
      window.removeEventListener('resize', resizeFn)
    }
  })

  return <div>
    <div ref={containerRef}></div>
    <GraphContext.Provider value={graphRef}>
      {children}
    </GraphContext.Provider>
  </div>
}

Graph.propTypes = {
  children: propTypes.arrayOf(propTypes.element())
}

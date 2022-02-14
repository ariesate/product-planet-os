import { createComponent, createElement, Fragment, propTypes, useRef, useViewEffect } from 'axii'

const DrawerWrapper = ({ children }) => {
  const body = useRef()

  useViewEffect(() => {
    Object.assign(body.current.style, {
      transform: 'translate(0, 0)'
    })
  })

  return (
    <drawer-wrapper block>
      <drawer-body ref={body} block>
        {children}
      </drawer-body>
    </drawer-wrapper>
  )
}

DrawerWrapper.propTypes = {
  children: propTypes.arrayOf(propTypes.element())
}

DrawerWrapper.Style = (frag) => {
  const el = frag.root.elements

  el['drawer-wrapper'].style((props) => ({
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100vh'
  }))
  el['drawer-body'].style((props) => ({
    backgroundColor: '#fff',
    width: props.width?.value,
    height: '100vh',
    transform: 'translate(100%, 0)',
    transition: 'all ease 0.3s'
  }))
}

export default createComponent(DrawerWrapper)

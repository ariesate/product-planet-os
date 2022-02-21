import { createElement, createComponent, propTypes } from 'axii'

/**
 * @type {import('axii').FC}
 */
function Field ({ label, children }) {
  return (
    <container
      block
      flex-display
      flex-align-items-center
      flex-justify-content-space-between>
      <span block block-font-size-14px>
        {label}
      </span>
      <div>{children}</div>
    </container>
  )
}

Field.Style = (frag) => {
  frag.root.elements.container.style({
    gap: '80px'
  })
}

Field.propTypes = {
  label: propTypes.string.isRequired,
  children: propTypes.arrayOf(propTypes.element())
}

export default createComponent(Field)

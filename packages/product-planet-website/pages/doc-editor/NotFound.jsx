import { createElement, createComponent } from 'axii'

/**
 * @type {import('axii').FC}
 */
function NotFound () {
  return (
    <container block block-margin="40px 20px 80px">
      <content
        block
        block-font-size-18px
        block-margin-top-40px
        flex-display
        flex-align-items-center
        flex-direction-column>
        找不到文档
      </content>
    </container>
  )
}

NotFound.Style = (frag) => {
  frag.root.elements.back.style({
    textDecoration: 'underline',
    cursor: 'pointer'
  })
}

export default createComponent(NotFound)

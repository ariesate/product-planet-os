import { atom, propTypes, createElement, atomComputed } from 'axii'
import { Input } from 'axii-components'

function ErrorFeature (frag) {
  frag.root.modify((node, { error }) => {
    const input = node.children[2]
    const onInput = input.attributes.onInput
    input.attributes.onInput = (e) => {
      error.value = ''
      onInput?.(e)
    }
    node.children.push(
      <error
        block
        block-display-none={atomComputed(() => !error.value)}
        block-position-absolute
        block-bottom="-22px"
        block-left-0
        block-font-size-12px>
        {error}
      </error>
    )
  })
}

ErrorFeature.Style = (frag) => {
  frag.root.elements.container.style(({ error }) => ({
    position: 'relative',
    borderColor: error.value ? '#f00' : 'rgb(217, 217, 217)'
  }))
  frag.root.elements.error.style({
    color: '#f00'
  })
}

ErrorFeature.propTypes = {
  error: propTypes.string.default(() => atom(''))
}

export default Input.extend(ErrorFeature)

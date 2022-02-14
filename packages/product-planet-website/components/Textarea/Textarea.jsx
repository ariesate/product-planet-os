import { createElement, Fragment, createComponent, propTypes } from 'axii'

function Textarea (props) {
  return (
    <textarea {...props}></textarea>
  )
}

Textarea.Style = (fragments) => {
  const textarea = fragments.root.elements['textarea']
  textarea.style({
    padding: '8px',
    border: '1px solid #CECECE',
    borderRadius: '2px'
  })
}

export default createComponent(Textarea)

import { createElement, createComponent } from 'axii'

const Types = {
  string: 'S',
  number: 'N',
  boolean: 'B'
}
const Colors = {
  string: '#E098FA',
  number: '#B8DDFF',
  boolean: '#92F3D6'
}

function ParamIcon ({ type }) {
  const t = Types[type] || '?'
  return (
    <container block block-width-18px block-height-18px>
      {t}
    </container>
  )
}

ParamIcon.Style = (fragments) => {
  fragments.root.elements.container.style(({ type }) => ({
    backgroundColor: Colors[type] || '#000000',
    borderRadius: '50%',
    fontSize: '14px',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: '18px'
  }))
}

export default createComponent(ParamIcon)

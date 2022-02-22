import {
  createElement,
  Fragment,
  atomComputed,
  atom,
  computed,
  createComponent,
  useRef,
  reactive,
  propTypes,
  createRef,
  watch,
  useViewEffect
} from 'axii'

Card.propTypes = {
  name: propTypes.string.default(() => atom('')),
  desc: propTypes.string.default(() => atom('')),
  onSet: propTypes.function.default(() => () => {}),
  onDetail: propTypes.function.default(() => () => {})
}
function Card ({ name, desc, onSet, onDetail }) {
  return (
        <div>
          <card block block-width-200px block-height-125px block-margin-right-20px>
          <content block block-padding-12px>
              <platform block block-margin-bottom-12px>{() => name.value}</platform>
              <name block >{() => desc.value}</name>
          </content>
          <action block block-width="100%" block-height-46px flex-display flex-align-items-center flex-justify-content-space-around>
              <opt block onClick={onSet}>设置</opt>
              <opt block onClick={onDetail}>详情</opt>
          </action>
          </card>
        </div>
  )
}

Card.Style = (fragments) => {
  const el = fragments.root.elements
  el.card.style({
    border: '1px solid #f0f0f0',
    borderRadius: '8px'
  })
  el.platform.style({
    fontSize: '16px'
  })
  el.name.style({
    fontSize: '14px',
    color: '#8c8c8c'
  })
  el.action.style({
    borderTop: '1px solid #f0f0f0'
  })
  el.opt.style({
    color: 'rgba(0,0,0,.45)',
    cursor: 'pointer'
  })
}

export default createComponent(Card)

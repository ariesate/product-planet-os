/** @jsx createElement */
import {
  atom,
  atomComputed,
  createElement,
  createComponent,
  reactive,
  propTypes,
  computed
} from 'axii'
import useHover from '@/hooks/useHover'

function List (props) {
  return (
    <list block block-width="100%" >
      {() => props.header || props.extra ? <List.Item disabledHover={true} layout:block-padding="16px" extra={props.extra} >{props.header?.value || props.header || ''}</List.Item> : ''}
      {() => (props.dataSource.value || props.dataSource).map((item, i) => {
        const itemElement = props.renderItem(item, i)
        return itemElement
      })}
      {() => props.footer ? <List.Item layout:block-padding="16px" >{props.footer || ''}</List.Item> : ''}
    </list>
  )
}

List.propTypes = {
  size: propTypes.string.default(() => 'normal'),
  dataSource: propTypes.array.default(() => reactive([])),
  renderItem: propTypes.function.default(() => item => <List.Item>item</List.Item>)
}

List.Style = (frag) => {
  const ele = frag.root.elements
  ele.list.style({
    backgroundColor: '#fff'
  })
}

function ListItem (props) {
  const { focus, disabledHover } = props
  const { Node, isHover } = useHover()

  const listItemStyle = atomComputed(() => {
    const result = {
      cursor: 'pointer',
      backgroundColor: '#fff',
      color: '#333'
    }
    if (focus.value) {
      Object.assign(result, {
        backgroundColor: '#000',
        color: '#fff'
      })
    } else if (isHover.value && !disabledHover) {
      Object.assign(result, {
        backgroundColor: 'rgba(0,0,0,0.05)'
      })
    }
    return {
      ...result,
      ...props.style
    }
  })

  return (
    <listItem
      style={listItemStyle}
      onClick={props.onClick}
      block block-width="100%" block-padding="12px 16px"
      flex-display flex-align-items="center" >
      <Node layout:block layout:block-width="100%" layout:flex-display layout:flex-align-items="center">
        <listItemContent block flex-display flex-grow="1" >
          {() => props.children}
        </listItemContent>
        <listItemExtra inline inline-flex flex-align-items="center">
          {props.extra || ''}
        </listItemExtra>
      </Node>
    </listItem>
  )
}
ListItem.Style = (frag) => {
  const ele = frag.root.elements
  ele.listItem.style(({ border }) => ({
    borderBottom: border ? '1px solid #eee' : 0,
    boxSizing: 'border-box'
  }))
  ele.extra.style({
    lineHeight: 0
  })
}
ListItem.propTypes = {
  // extra: propTypes.element.default(() => '')
  focus: propTypes.bool.default(() => atom(false))
}
List.Item = createComponent(ListItem)

export default createComponent(List)

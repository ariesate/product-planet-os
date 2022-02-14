/** @jsx createElement */
import {
  createElement,
  createComponent,
  useViewEffect,
  propTypes,
  atom,
  reactive,
  watch,
  traverse,
  computed,
  useContext
} from 'axii'
import { useElementPosition, manualTrigger as createManualTrigger, Select } from 'axii-components'
import Port from './Port'
import { PORT_JOINT } from './index'
import ViewContext from './shape/context'

/**
 * 字段的所有选项：
 * type : string|number|boolean|array|graph(map|tree)  | rel(关联字段)
 *
 * defaultValue
 * allowNull
 *
 * 对于 string: max-length
 * 对于 number: max|min
 *
 * TODO
 * 1. 能改 field
 * 2. type 为 rel 时展示 port
 */
// function Field({ name, defaultValue, allowNull, type }) {
//   const options = [{
//     name: 'string'
//   }, {
//     name: 'number'
//   }, {
//     name: 'boolean'
//   },{
//     name: 'rel',
//   }]
//
//   return (
//     <field>
//       <Input value={name} onClick={e => e.stopPropagation()}/>
//       <Select value={type} options={options} />
//     </field>
//   )
// }

function RawField ({ field, entityPosition, positionTrigger }) {
  const fieldPosition = reactive({})
  const { ref: fieldRef } = useElementPosition(fieldPosition, positionTrigger)

  const portPosition = computed(() => {
    const result = {}
    // 如果 fieldPosition
    if (field.type === 'rel' && fieldPosition.y && entityPosition.y) {
      const y = fieldPosition.y - entityPosition.y + (fieldPosition.height / 2)

      result.right = {
        x: '100%',
        y
      }

      result.left = {
        x: 0,
        y
      }
    }

    return result
  })

  // TODO 监听形状变化。任何形状变化。都会引起其他的位置变化。所以要
  useViewEffect(() => {
    return () => {}
  })

  return (
    <field block ref={fieldRef} block-padding-10px>
      <name>{() => field.name}</name>
      <type inline inline-margin-left-10px>{() => `${field.type}${field.isCollection ? '[]' : ''}`}</type>
      {/* {() => portPosition.left ? <Port group="right" key={field.id} id={[field.id, 'left'].join(PORT_JOINT)} args={portPosition.left}/> : null}
      {() => portPosition.right ? <Port group="left" key={field.id} id={[field.id,'right'].join(PORT_JOINT)} args={portPosition.right}/> : null} */}
    </field>
  )
}

RawField.propTypes = {
  name: propTypes.string.default(() => atom('')),
  type: propTypes.string.default(() => atom(''))
}

RawField.Style = (fragments) => {
  fragments.root.elements.type.style({
    color: 'blue'
  })
}

const Field = createComponent(RawField)

function Navbar ({ nav }) {
  return (
    <navbar block block-padding-4px block-width="100%">{() => nav.name}</navbar>
  )
}

Navbar.Style = ({ root }) => {
  root.elements.navbar.style({
    background: '#d8d8d8'
  })
}

const Nav = createComponent(Navbar)

// 真正用 axii 来渲染的组件
function Entity ({ entity, onChange }) {
  const { params, navbars } = entity

  const ports = [0, 1, 2, 3, 4, 5]

  const entityPosition = reactive({})
  const positionTrigger = createManualTrigger()
  const { ref: entityRef } = useElementPosition(entityPosition, positionTrigger)

  useViewEffect(() => {
    // watch(() => traverse(entity), (data) => {
    //   console.log('change entity', data)
    // })

    positionTrigger.trigger()
    return () => {
      positionTrigger.destroy()
    }
  })

  return <page inline ref={entityRef}>
    {/* <header block block-min-width-160px flex-display flex-align-items-center> */}
    <name block block-margin-4px block-margin-left-0>{() => entity.name}</name>
    {/* <status block block-margin-4px block-margin-left-0>{() => entity.currentStatus?.name}</status> */}
    {/* </header> */}
    <body inline inline-border-width-1px inline-min-width-80px inline-min-height-120px>
      {() => navbars.map(nav => (
        nav ? <Nav nav={nav} /> : null
      ))}
      {() => params.map(field => (
        <row block>
          <Field key={field.id} field={field} entityPosition={entityPosition} positionTrigger={positionTrigger} />
        </row>
      ))}
      {() => ports.map(p =>
        <Port id={`${entity.id}${PORT_JOINT}${entity.currentStatus?.name}${PORT_JOINT}${p}`} group={`group${~~(p / 2)}`} args={{ strict: true }} />)
      }
    </body>
  </page>
}

Entity.Style = (fragments) => {
  const el = fragments.root.elements
  el.status.style({
    color: '#666'
  })

  // el.name.style({
  //   background: '#0060a0',
  //   color: '#fff',
  // })

  el.field.style({
    borderColor: '#333',
    whiteSpace: 'nowrap',
    overflow: 'visible'
  })

  const { node } = useContext(ViewContext)

  el.body.style(({ highlightId, entity }) => {
    const result = {
      background: '#fff',
      borderColor: '#333',
      borderStyle: 'solid',
      overflow: 'visible',
      opacity: 1
    }

    // const portAttrs = {
    //   circle: {
    //     opacity: 1,
    //   }
    // }

    // entity及下属的port都在Style中统一处理
    if (highlightId.value !== entity.id) {
      result.opacity = 0.2
      // portAttrs.circle.opacity = 0.2
    }

    // node.getPorts().forEach(port => {
    //   if (port.attrs?.circle?.opacity !== portAttrs.circle.opacity) {
    //     // setPortProp会阻塞，使用Idle降低卡顿感
    //     requestIdleCallback(() => {
    //       node.setPortProp(port.id, { attrs: portAttrs })
    //     });
    //   }
    // })

    return result
  })
}

export default createComponent(Entity)

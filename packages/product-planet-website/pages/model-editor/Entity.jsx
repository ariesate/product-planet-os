/** @jsx createElement */
import {
  createElement,
  createComponent,
  useViewEffect,
  propTypes,
  atom,
  reactive,
  watch,
  computed
} from 'axii'
import { useElementPosition, manualTrigger as createManualTrigger } from 'axii-components'
import EntityConfigJSON from './Entity.k6.json'
import RelationConfigJSON from './Relation.k6.json'
import DeleteOne from 'axii-icons/DeleteOne'
import HamburgerButton from 'axii-icons/HamburgerButton'
import { Entity, Field, Relation, RelationPort } from '@/models'
import createStructMap from '@/tools/structMap'
import debounce from 'lodash/debounce'
import Modal from '@/components/Modal'
const { confirm } = Modal

export const EntityEdge = (() => {
  const EntityRender = ({ nodeConfig, edge }) => {
    // 兼容旧ER数据
    const ee = Object.assign({}, edge)
    delete ee.view

    const config = {
      ...ee,
      attrs: {
        line: {
          stroke: '#5F95FF',
          strokeWidth: 1,
          targetMarker: {
            name: 'classic',
            size: 8
          }
        }
      },
      label: `${edge.data?.name || ''} ${edge.data?.type || ''}`
    }
    return config
  }
  EntityRender.configJSON = RelationConfigJSON

  EntityRender.onChange = async (nodeConfig, edge) => {
    await EntityRender.onSave(nodeConfig, edge)
  }

  EntityRender.onAdd = async (nodeConfig, edge) => {
    console.log('[Edge onAdd] edge: ', nodeConfig, edge)
    const id = await EntityRender.onSave(nodeConfig, edge)
    return { id: id[1] }
  }

  EntityRender.onRemove = async (nodeConfig, edge, data) => {
    console.log('[Edge onRemove] nodeConfig, edge, data: ', nodeConfig, edge)
    Relation.remove(edge.id)
  }
  EntityRender.onSave = async (nodeConfig, edge) => {
    const productId = globalData.PRODUCT_ID.get()

    console.log('[Edge onChange]nodeConfig, edge, data: ', nodeConfig, edge)
    // 再创建关联子
    const sourcePort = {
      id: edge.source.id,
      entity: edge.source.cell,
      field: edge.source.port.split('-')[0],
      side: edge.source.port.split('-')[1]
      // relation: rid
    }
    const targetPort = {
      id: edge.target.id,
      entity: edge.target.cell,
      field: edge.target.port.split('-')[0],
      side: edge.target.port.split('-')[1]
      // relation: rid
    }
    const arr = await Promise.all([sourcePort, targetPort].map(p => RelationPort.upsert({ id: p.id || -1 }, p)))
    sourcePort.id = arr[0][1]
    targetPort.id = arr[1][1]

    // 创建父
    const rid = await Relation.upsert({ id: edge.id }, {
      name: edge.data.name,
      type: edge.data.type,
      source: sourcePort,
      target: targetPort,
      product: productId
    })

    console.log('[EntityEdge] onChange saved', rid)
    return rid
  }

  return EntityRender
})()

export const EntityPort = createComponent((() => {
  const PortRender = (props) => {
    const { port } = props
    return (
      <port block data-port-id={port.id} >
      </port>
    )
  }
  PortRender.Style = (frag) => {
    const genStyle = (a = {}) => ({
      width: '14px',
      height: '14px',
      backgroundColor: '#fff',
      borderRadius: '50%',
      border: '1px solid rgb(49, 208, 198)',
      ...a
    })
    frag.root.elements.port.style(props => {
      return genStyle()
    })
  }
  const configArr = []
  PortRender.getConfig = (nodeId) => configArr.filter(c => c.nodeId === nodeId || !nodeId)
  PortRender.RegisterPort = (props = {}) => {
    const config = {
      nodeId: props.nodeId,
      portId: props.id,
      position: {
        x: props.position.x + 2,
        y: props.position.y
      },
      size: {
        width: 20,
        height: 20
      }
    }
    configArr.push(config)

    useViewEffect(() => {
      return () => {
        const i = configArr.indexOf(config)
        configArr.splice(i, 1)
      }
    })

    return ''
  }

  return createComponent(PortRender)
})())

export const globalData = createStructMap(['PRODUCT_ID'])

export const EntityNode = createComponent((() => {
  const RawField = ({ nodeId, field, entityPosition, positionTrigger, RegisterPort }) => {
    const fieldPosition = reactive({})

    const portPosition = computed(() => {
      const result = {}
      // 如果 fieldPosition
      if (field.type === 'rel' && fieldPosition.y && fieldPosition.height && entityPosition.y) {
        const y = fieldPosition.y - entityPosition.y + (fieldPosition.height / 2) - 10
        // console.log('y: ', y, '= ', fieldPosition.y ,'-', entityPosition.y ,'+', (fieldPosition.height / 2), '-', 10);
        result.right = {
          x: entityPosition.width - 10,
          y
        }
        result.left = {
          x: -10,
          y
        }
      }
      return result
    })

    // 暂时用id取dom元素，因为ref在rerender之后会丢失current
    const fieldId = `entityFieldId${String(field.name).trim()}${Date.now()}${Math.floor(Math.random() * 1000)}`
    // 异步延时，用于取到dom
    setTimeout(() => {
      const fieldIds = document.querySelectorAll(`#${fieldId}`)
      if (!fieldIds || fieldIds.length > 1) {
        if (!fieldIds) {
          throw new Error(`field id 不存在, id=${fieldId}`)
        } else {
          throw new Error(`field id 重复了, id=${fieldId} ${fieldIds.length}`)
        }
      }
      if (fieldIds && fieldIds[0]) {
        const { y, height } = fieldIds[0].getBoundingClientRect()
        fieldPosition.y = y
        fieldPosition.height = height
        positionTrigger.trigger()
      }
    }, 0)

    return (
      <field block id={fieldId} >
        <name>{() => field.name}</name>
        <type inline inline-margin-left-10px>{() => `${field.type}${field.isCollection ? '[]' : ''}`}</type>
        {() => (
          portPosition.left ? <RegisterPort nodeId={nodeId} id={`${field.id}-left`} position={portPosition.left} /> : ''
        )}
        {() => (
          portPosition.right ? <RegisterPort nodeId={nodeId} id={`${field.id}-right`} position={portPosition.right} /> : ''
        )}
      </field>
    )
  }

  RawField.propTypes = {
    name: propTypes.string.default(() => atom('')),
    type: propTypes.string.default(() => atom(''))
  }
  RawField.Style = (fragments) => {
    fragments.root.elements.field.style({
      fontSize: 14,
      display: 'flex',
      height: 28,
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid rgba(206, 212, 222, 0.2)',
    })
    fragments.root.elements.type.style({
      color: 'rgb(191, 191, 191)'
    })
    fragments.root.elements.name.style({
      color: 'rgb(89, 89, 89)'
    })
  }

  const FieldCpt = createComponent(RawField)

  const EntityRender = (props) => {
    const { node, RegisterPort, onRemove } = props
    const { data } = node

    const entityPosition = reactive({})
    const positionTrigger = createManualTrigger()
    const { ref: entityRef } = useElementPosition(entityPosition, positionTrigger)

    useViewEffect(() => {
      positionTrigger.trigger()

      watch(() => data.fields.length, () => {
        setTimeout(() => {
          data.fields.forEach(f => {
            if (!f.id) {
              Field.create({
                entity: node.id
              }).then(fid => {
                f.id = fid
              })
            }
          })
        })
      })
      watch(() => [node.data.x, node.data.y], () => {
        setTimeout(() => {
          Entity.update(node.id, {
            posX: node.data.x,
            posY: node.data.y
          })
        })
      })

      return () => {
        positionTrigger.destroy()
      }
    })

    const clickOnEntity = () => {
      console.log(`click On entity.name = ${node.name}`)
    }

    function onBeforeRemove () {
      confirm({
        title: '是否确认删除',
        onOk () {
          onRemove()
        },
        onCancel () {
        }
      })
    }

    return (
      <entity
        onClick={() => clickOnEntity()}
        inline
        ref={entityRef}>
        <container block>
          <entityName block>
            <name>
              <HamburgerButton style={{ position: 'relative', top: 1, paddingRight: 8 }} size="12" unit="px" />
              {() => {
                return data.name ? `${data.name}` : 'New Page'
              }}
            </name>
            <closeBox>
              <DeleteOne onMouseDown={onBeforeRemove} style={{ cursor: 'pointer', position: 'relative', top: 2 }} size="16" unit="px" />
            </closeBox>
          </entityName>
          <fields block block-padding="0 6px 6px">
            {() => data.fields.map(field => (
              <row block key={field.id} >
                <FieldCpt field={field}
                  nodeId={node.id}
                  entityPosition={entityPosition}
                  positionTrigger={positionTrigger}
                  RegisterPort={RegisterPort} />
              </row>
            ))}
          </fields>
        </container>
      </entity>
    )
  }
  EntityRender.Style = (frag) => {
    const el = frag.root.elements;
    el.entity.style(props => {
      const isSelected = props.node.id === props.state.selectedCell?.id
      return {
        minWidth: '200px',
        border: '1px solid rgb(205, 221, 253)',
        borderRadius: '2px',
        outline: !isSelected ? 'none' : 'rgb(24, 144, 255) solid 2px',
      }
    })
    el.entity.match.hover.style({
      border: '1px solid rgb(24, 144, 255)',
    })
    el.container.style({
      backgroundColor: 'rgb(205, 221, 253)',
      padding: '0 6px 6px',
      margin: 1
    })
    el.entityName.style({
      height: '38px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      color: 'rgba(0, 0, 0, 0.65)',
      fontSize: '14px',
    });
    el.fields.style({
      background: '#fff',
      cursor: 'pointer',
      overflowY: 'auto',
      maxHeight: '222px'
    });
  }

  EntityRender.shape = 'entity-shape'
  EntityRender.configJSON = EntityConfigJSON

  EntityRender.onAdd = async (node) => {
    console.log('[EntityRender.onAdd] node: ', node)

    const productId = globalData.PRODUCT_ID.get()

    const entityData = {
      name: 'new Entity',
      posX: node.x,
      posY: node.y,
      product: productId
    }

    const id = await Entity.create(entityData)
    console.log('[Entity onAdd] id = ', id)

    node.data.name = 'new Entity'

    return {
      ...node,
      id
    }
  }

  EntityRender.onRemove = async (node) => {
    Entity.remove(node.id)
  }

  EntityRender.onChange = debounce(async (node, nodeData, oldData) => {
    await EntityRender.onSave(node, nodeData, oldData)
  }, 1500)

  EntityRender.onSave = async (node, nodeData, oldNodeData) => {
    const productId = globalData.PRODUCT_ID.get()

    const entityData = {
      id: node.id, // 自定义
      name: node.data.name,
      posX: node.data.x,
      posY: node.data.y,
      product: productId
    }

    const updateResult = await Entity.update({ id: entityData.id }, entityData)

    // update Fail
    if (!updateResult) {
      return
    }
    const fields = node.data.fields.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      isCollection: !!f.isCollection,
      entity: node.id
    }))

    const fieldIds = await Promise.all(fields.map(f => {
      return Field.upsert({ id: f.id }, f)
    }))

    oldNodeData.fields.forEach(f => {
      if (!node.data.fields.find(newF => newF.id === f.id)) {
        Field.remove(f.id)
      }
    })

    console.log('save Entity -> Field', fieldIds)
  }

  return EntityRender
})())

export const data = () => ({
  selectItemId: ''
})

export function transOldData (data) {
  let { entities = [], relations = [] } = data

  entities = entities.map(obj => {
    const result = {}
    if (obj.view) {
      result.x = obj.view.x
      result.y = obj.view.y
      delete obj.view
    }

    result.data = {
      fields: obj.fields,
      name: obj.name
    }

    delete obj.fields

    return Object.assign(result, obj)
  })

  relations = relations.map(obj => {
    const result = {}
    if (!obj.data) {
      obj.data = {
        name: obj.name,
        type: obj.type
      }
    }
    if (obj.source?.entity) {
      result.source = {
        cell: obj.source.entity,
        port: obj.source.field + (obj.view ? '-' + obj.view.sourcePortSide : '')
      }
      delete obj.source
    }
    if (obj.target?.entity) {
      result.target = {
        cell: obj.target.entity,
        port: obj.target.field + (obj.view ? '-' + obj.view.targetPortSide : '')
      }
      delete obj.target
    }

    delete obj.view

    return Object.assign(result, obj)
  })

  return {
    nodes: entities,
    edges: relations
  }
}

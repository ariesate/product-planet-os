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
import { PARTIAL_ACCESS_KEY } from '@/models/query'

export { PARTIAL_ACCESS_KEY } from '@/models/query'

export const createPartial = (type, keys = []) => {
  const m = {
    add: {
      id: true,
      versionPartial: true,
      versionAdd: true,
      versionRemove: false
    },
    modify: {
      id: true,
      versionPartial: true,
      versionAdd: false,
      versionRemove: false
    },
    remove: {
      id: true,
      versionPartial: true,
      versionAdd: false,
      versionRemove: true
    }
  }
  const obj = m[type]
  keys.forEach(k => (obj[k] = true))
  return {
    [PARTIAL_ACCESS_KEY]: obj
  }
}

export const partialTypes = {
  add: 'add',
  remove: 'remove',
  modify: 'modify'
}
/**
 * 判断增量的方法，增量的场景和子级
 */
export function checkPartial (partial, propKeys = []) {
  if (!partial) {
    return
  }

  if (Array.isArray(partial)) {
    const types = partial.map(p => checkPartial(p, propKeys))
    return types.some(t => !!t) ? partialTypes.modify : null
  }
  let type = null

  if (partial.versionPartial) {
    if (partial.versionAdd) {
      type = partialTypes.add
    } else if (partial.versionRemove) {
      type = partialTypes.remove
    } else {
      if (propKeys.length > 0) {
        if (propKeys.some(k => partial[k] !== undefined && partial[k] !== null)) {
          type = partialTypes.modify
        }
      } else if (partial.id) {
        type = partialTypes.modify
      }
    }
    return type
  }

  if (partial[PARTIAL_ACCESS_KEY]) {
    return checkPartial(partial[PARTIAL_ACCESS_KEY])
  }

  if (partial.versionAdd) {
    type = partialTypes.add
  } else if (partial.versionRemove) {
    type = partialTypes.remove
  } else {
    if (propKeys.length > 0) {
      if (propKeys.some(k => partial[k] !== undefined && partial[k] !== null)) {
        type = partialTypes.modify
      }
    } else {
      // 深度递归
      Object.keys(partial).forEach(key => {
        if (typeof partial[key] === 'object') {
          const childType = checkPartial(partial[key])
          if (childType) {
            type = partialTypes.modify
          }
        }
      })
    }
  }

  return type
}

export function checkPartialAndMap (partial, keys, typeMap = {}) {
  const type = checkPartial(partial, keys)
  let result
  switch (type) {
    case partialTypes.add:
    case partialTypes.remove:
    case partialTypes.modify:
      result = typeMap[type] ? typeMap[type]() : undefined
      break
    default:
      result = typeMap.defaults?.()
      break
  }
  return { type, mapResult: result }
}

const positionCssMap = (p = 3, args = {}) => {
  const m = {
    0: {
      triangle: {
        bdc: `${args.color} transparent transparent ${args.color}`,
        position: {
          top: 0,
          left: 0
        }
      },
      text: {
        position: {
          top: '2px',
          left: '2px'
        }
      }
    },
    3: {
      triangle: {
        bdc: `transparent ${args.color} ${args.color} transparent`,
        position: {
          right: 0,
          bottom: 0
        }
      },
      text: {
        position: {
          bottom: '2px',
          right: '2px'
        }
      }
    }
  }
  return m[p]
}

function PartialTagRC (props) {
  const { partial, size = 45, partialKeys = [], relationKeys = [], position, partialType } = props
  const radius = props.radius ? Array.isArray(props.radius) ? props.radius : [props.radius, props.radius] : [8, 4]
  const partialDisplay = computed(() => {
    let text = ''
    let style = {}

    const type = partialType || checkPartial(partial, partialKeys)
    const childTypes = relationKeys.map(relationKey => checkPartial(partial[relationKey]))

    switch (type) {
      case partialTypes.add:
        text = '新增'
        style = {
          color: '#52c41a'
        }
        break
      case partialTypes.remove:
        text = '删除'
        style = {
          color: '#f5222d'
        }
        break
      case partialTypes.modify:
        text = '修改'
        style = {
          color: '#faad14'
        }
        break
      default:
        if (childTypes.length > 0 && childTypes.some(t => !!t)) {
          text = '修改'
          style = {
            color: '#faad14'
          }
        }
    }
    return {
      type,
      text,
      style
    }
  })

  const tagStyle = atomComputed(() => ({
    display: partialDisplay.text ? 'block' : 'none',
    backgroundColor: partialDisplay.style.color,
    borderRadius: `${radius[0]}px 0 ${radius[1]}px 0`
  }))

  return (
    <partialTag
      block block-position="absolute"
      style={tagStyle} data-type={partialDisplay.type} >
      <partialText block-padding="2px 8px" block >{() => partialDisplay.text}</partialText>
    </partialTag>
  )
}

PartialTagRC.Style = (frag) => {
  const ele = frag.root.elements
  ele.partialTag.style(({ position }) => ({
    ...positionCssMap(position).triangle.position
  }))
  ele.partialTriangle.style(({ size = 45, position }) => {
    return {
      ...positionCssMap(position).triangle.position
    }
  })
  ele.partialText.style(({ position }) => {
    return {
      color: '#fff',
      fontSize: '10px'
    }
  })
}

PartialTagRC.propTypes = {
  // size: propTypes.string.default(() => 60)
}

const PartialTag = createComponent(PartialTagRC)
/**
 * 仅展示”修改“和”删除“，适用于整个form表单都是新增，于是form的每个input就无需再次展示“新增”
 */
export const PartialTagModify = PartialTag.extend(frag => {
  const ele = frag.root.elements
  ele.partialTag.modify(vNode => {
    if (vNode.attributes['data-type'] !== partialTypes.modify) {
      vNode.children = []
    }
  })
})

export default PartialTag

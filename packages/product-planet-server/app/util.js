/**
 * 返回一个清除了无用的 key 的新对象。可以顺带清除指定的 key，不影响数据本身。
 *
 * @export
 * @template T extends object
 * @param {T} obj
 * @param {(keyof T)[]} [extKeys=[]]
 * @return {*} - 需要类型体操，暂时不耍
 */
export function clearUselessKeys (obj, extKeys = []) {
  const nextValue = Object.create({})
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== null && obj[key] !== undefined && !extKeys.includes(key)) {
      nextValue[key] = obj[key]
    }
  })
  return nextValue
}

/**
 * 文件名称重命名
 *
 * @export
 * @param {string} hasSuffixFilename
 * @return {{
 *  to: ((noSuffixFilename: string, suffix: string) => string) => string
 * }}
 */
export function renameFile (hasSuffixFilename) {
  const suffix = hasSuffixFilename.split('.').pop() || ''
  const noSuffixFilename = hasSuffixFilename.slice(0, -(suffix.length) - 1)
  return {
    to (fn) {
      return fn(noSuffixFilename, suffix)
    }
  }
}

/**
 * string是否包含汉字
 * @export
 * @param {string} str
 * @return {boolean}
 */
export function includeChinese (str) {
  // eslint-disable-next-line prefer-regex-literals
  const reg = new RegExp('[\\u4E00-\\u9FFF]+', 'g')
  return reg.test(str)
}

/**
 * 获取对象的name
 * @export
 * @param {object} obj
 * @param {object} param
 * @return {string}
 */
export function getEnName (obj, { key = 'name', identifyKey, identifyId = 'id' }, force = false) {
  // eslint-disable-next-line no-mixed-operators
  if ((force || typeof obj[key] === 'string' && includeChinese(obj[key])) && identifyKey && obj[identifyId]) {
    return `${identifyKey}-${obj[identifyId]}`
  }
  return obj[key]
}

/**
 * @description 首字母大写
 * @param {*} str
 * @return {*}
 */
export function firstChartToUpperCase (str) {
  if (typeof str === 'string' && str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
  return str
}

/**
 * @description 扁平化带children的array
 * @param {*} str
 * @return {*}
 */
export function flattenChildren (arr, key = 'children') {
  const flattenArr = []
  arr.forEach(item => {
    if (Array.isArray(item[key]) && item[key].length) {
      const children = item[key]
      const newItem = { ...item, children: null }
      flattenArr.push(newItem)
      flattenArr.push(...flattenChildren(children, key))
    } else {
      flattenArr.push(item)
    }
  })
  return flattenArr
}

/**
 * @TODO：先写死
 * linkEdtor和EREditor的默认数据
 */
export function leAndErDefaultData (productName = '') {
  const pages = [
    {
      name: `${productName}首页`,
      posX: 240,
      posY: 209,
    },
    {
      name: '详情页',
      posX: 240,
      posY: 727,
    }
  ]
  // 0 -> pages[0]
  const params = [
    [
      {
        name: 'pageId',
        type: 'string',
        page: -1
      }
    ]
  ]

  const pageLink = [
    {
      name: '打开详情',
      type: '新开窗口',
      source: {
        name: '-2',
        page: -1 // pageId
      },
      target: {
        name: '-1',
        page: -1
      },
      visible: true
    }
  ]

  const entities = [
    {
      name: 'User',
      posX: 100,
      posY: 100
    },
    {
      name: 'Account',
      posX: 600,
      posY: 250
    }
  ]
  const fields = [
    [
      {
        name: 'name',
        type: 'string'
      },
      {
        name: 'phone',
        type: 'string',
        isCollection: true
      },
      {
        name: 'account',
        type: 'rel'
      }
    ],
    [
      {
        name: 'user',
        type: 'rel'
      },
      {
        name: 'balance',
        type: 'string'
      }
    ]
  ]
  const relation = {
    account: {
      name: 'is',
      type: '1:1',
      source: {
        side: 'right'
      },
      target: {
        name: 'user',
        side: 'left'
      }
    }
  }

  const navs = [
    {
      name: '默认导航',
      type: 'root'
    },
    {
      name: pages[0].name,
      type: 'page',
      order: 0,
      page: -1 // 关联的pageId
    },
    {
      name: pages[1].name,
      type: 'page',
      order: 1,
      page: -1 // 关联的pageId
    }
  ]
  // 子级对应的父级导航，name之间映射
  const navLayers = {
    [navs[1].name]: navs[0].name,
    [navs[2].name]: navs[0].name
  }

  return {
    le: {
      pages,
      params,
      pageLink
    },
    er: {
      entities,
      fields,
      relation
    },
    nav: {
      navs,
      navLayers
    }
  }
}

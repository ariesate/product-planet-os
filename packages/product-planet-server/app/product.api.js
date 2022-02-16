import config from '../config/index.js'
import { now } from '../dependence/util.js'
import { readFileSync } from 'fs'
import { blobstoreUpload, getObjectPreviewUrl } from './blobstore.api.js'
import { addMember } from './member.api.js'
import { createNewVersion } from './productVersion.api.js'
import { leAndErDefaultData, clearUselessKeys, renameFile } from './util.js'
import { getCurrentOrg } from './orgs.api.js'
import { getCurrentUserInfo } from './user.api.js'

/**
 * 新增产品
 *
 * @export
 * @param {API.ER_APIs} apis
 * @param {{
 *  name: string
 *  description?: string
 *  logo?: File
 * }} productFields
 */
export async function createProduct (apis, productFields) {
  const user = await getCurrentUserInfo.call(this, arguments[0])
  const { id: productId } = await apis.create('Product', {
    ...clearUselessKeys(productFields, ['logo']),
    creator: this.user.id,
    org: user.org
  })

  let versionId

  await Promise.all([
    async () => {
      if (productFields?.logo) {
        await updateProductLogo.call(this, apis, productId, productFields.logo)
      }
    },
    async () => {
      versionId = await createNewVersion.call(this, apis, productId, {
        name: '版本一'
      })
    },
    async () => {
      await addMember.call(this, apis, {
        userId: user.id,
        userName: user.name || user.email,
        productId,
        role: 'admin',
        lastVisit: now()
      })
    }
  ].map(fn => fn()))

  // 新建产品创建默认数据
  addDefaultData(apis, { name: productFields.name, versionId, productId })

  return {
    id: productId
  }
}

/**
 * 为产品添加默认的 Link和ER数据
 * @param {API.ER_APIs} apis
 * @param {*} param
 */
export async function addDefaultData (apis, { name, versionId, productId }) {
  // start create Entities
  const defaultVisibleData = leAndErDefaultData(name)

  const entities = await Promise.all(defaultVisibleData.er.entities.map(entity => {
    return apis.create('Entity', {
      ...entity,
      product: productId
    })
  }))

  const relFieldArr = []
  await Promise.all(entities.map(async ({ id }, i) => {
    await Promise.all(defaultVisibleData.er.fields[i].map(field => {
      const r = apis.create('Field', {
        ...field,
        entity: id
      })
      r.then((fieldResult) => {
        if (field.type === 'rel') {
          relFieldArr.push({
            name: field.name,
            entityId: id,
            fieldId: fieldResult.id
          })
        }
      })
      return r
    }))
  }))

  if (relFieldArr.length) {
    relFieldArr.forEach(async (sourceField) => {
      const relation = defaultVisibleData.er.relation[sourceField.name]
      const targetField = relFieldArr.find(relF => relF.name === relation?.target.name)
      if (relation && targetField) {
        const source = {
          entity: sourceField.entityId,
          field: sourceField.fieldId,
          side: relation.source.side
        }
        const target = {
          entity: targetField.entityId,
          field: targetField.fieldId,
          side: relation.target.side
        }
        Promise.all(([
          apis.create('RelationPort', source),
          apis.create('RelationPort', target)
        ])).then(([p1, p2]) => {
          apis.create('Relation', {
            name: relation.name,
            type: relation.type,
            source: p1,
            target: p2,
            product: productId
          })
        })
      }
    })
  }

  // start creat Pages
  // 保存 page.name, page.id
  const pageIdsMap = {}
  const pages = await Promise.all(defaultVisibleData.le.pages.map((page, i) => {
    page.version = versionId
    const p = apis.create('Page', page)
    // 异步，添加默认的pageKey
    p.then(({ id }) => {
      apis.update('Page', id, { key: `page${id}`, path: `/page-${id}` })
      pageIdsMap[page.name] = id
    })
    return p
  }))

  // 添加页面默认的状态
  pages.forEach(async ({ id: pageId }) => {
    const s = await apis.create('PageStatus', {
      name: '默认状态'
    })
    // const s2 = await apis.create('PageStatus', {
    //   name: '空白状态'
    // })
    apis.createRelation('Page.baseStatus', pageId, s.id)
    apis.createRelation('Page.statusSet', pageId, s.id)
    // apis.createRelation('Page.statusSet', pageId, s2.id)
  })

  // create Page.Params
  pages.forEach(({ id: pageId }, i) => {
    defaultVisibleData.le.params[i]?.forEach(param => {
      param.page = pageId
      apis.create('Param', param)
    })
  })

  // create Page.Links
  const pageId = pages[0].id
  const nextPageId = pages[1].id
  defaultVisibleData.le.pageLink.forEach(link => {
    const source = {
      name: `${pageId}${link.source.name}`,
      page: pageId
    }
    const target = {
      name: `${nextPageId}${link.target.name}`,
      page: nextPageId
    }
    Promise.all([
      apis.create('LinkPort', source),
      apis.create('LinkPort', target)
    ]).then(([p1, p2]) => {
      apis.create('Link', {
        name: link.name,
        type: link.type,
        page: pageId,
        source: p1,
        target: p2
      })
    })
  })

  // start create Navigation
  const { navs, navLayers } = defaultVisibleData.nav
  const createdIdsMap = {}
  for (let i = 0; i < navs.length; i++) {
    const currentBasicNav = navs[i]
    const parentId = createdIdsMap[navLayers[currentBasicNav.name]]
    const pageId = pageIdsMap[currentBasicNav.name]
    const navData = {
      name: currentBasicNav.name,
      type: currentBasicNav.type,
      version: versionId
    }
    if (currentBasicNav.order !== undefined) {
      navData.order = currentBasicNav.order
    }
    if (parentId) {
      navData.parent = parentId
    }
    if (pageId) {
      navData.page = { id: pageId }
    }
    const { id } = await apis.create('Navigation', navData)
    createdIdsMap[currentBasicNav.name] = id
  }
}

/**
 * 移除产品
 *
 * @export
 * @param {API.ER_APIs} apis
 * @param {string} productId
 */
export async function removeProduct (apis, productId) {
  // TODO: 校验用户是否有权限删除该产品
  const membersToDelete = await apis.find('UserProduct', { product: { id: productId } }, {}, { id: true })
  await Promise.all(membersToDelete.map(member => apis.remove('UserProduct', member.id)))
  return apis.remove('Product', productId)
}

/**
 * 更新产品
 *
 * @export
 * @param {API.ER_APIs} apis
 * @param {{
 *  id: string
 *  name: string
 *  description?: string
 *  logo: File | string
 * }} productFields
 */
export async function updateProduct (apis, productFields) {
  // TODO: 校验用户是否有权限更新该产品
  const { id, logo } = productFields
  // Duck model
  const isFileLogo = !!productFields?.logo?.size
  if (isFileLogo) {
    await updateProductLogo.call(this, apis, id, logo)
  }
  return apis.update('Product', id, clearUselessKeys(productFields, ['logo']))
}

/**
 * 获取产品详情
 *
 * @export
 * @param {API.ER_APIs} apis
 * @param {string} productId
 */
export async function getProductDetail (apis, productId) {
  const [product] = await apis.find('Product', { id: productId }, undefined, {
    id: true,
    name: true,
    description: true,
    members: false,
    children: true,
    logoBucket: true,
    logoPath: true,
    creator: {
      id: true,
      displayName: true
    },
    versions: true
  })
  product.logo = await getObjectPreviewUrl.call(this, apis, {
    bucket: product.logoBucket,
    path: product.logoPath
  })
  return product
}

/**
 * 获取当前用户所拥有的产品
 *
 * @export
 * @param {API.ER_APIs} apis
 * @param {{
 *  offset: number
 *  limit: number
 * }} paging
 */
export async function getCurrentUserProducts (apis, paging) {
  const { offset = 0, limit = 10 } = paging

  const { id: org } = await getCurrentOrg.call(this, arguments[0])
  const [{ 'count(*)': count }] = await apis.count('UserProduct', { user: this.user.id, product: { org } })
  const list = await apis.find('UserProduct', {
    user: this.user.id,
    product: { org }
  }, {
    limit,
    offset
  }, {
    product: {
      id: true,
      name: true,
      logoBucket: true,
      logoPath: true,
      description: true
    },
    user: {
      id: true,
      name: true,
      displayName: true
    },
    id: true,
    role: true,
    lastVisit: true
  }, [
    ['lastVisit', 'desc']
  ])

  await Promise.all(list.map(async item => {
    const { versions } = await getProductDetail.call(this, apis, item.product_id)
    item['last_version_id'] = versions[0].id
    item['product_logo'] = await getObjectPreviewUrl.call(this, apis, {
      bucket: item.product_logoBucket,
      path: item.product_logoPath
    })
  }))

  return {
    count,
    list
  }
}

/**
 * 获取产品列表
 *
 * @export
 * @param {API.ER_APIs} apis
 * @param {string} [search='']
 * @param {} [paging={}]
 * @return {*}
 */
export async function getProducts (apis, search = '', paging = {}) {
  const { offset = 0, limit = 10 } = paging
  search = search.toString().trim()

  const { id: org } = await getCurrentOrg.call(this, arguments[0])
  const where = [
    ['name', 'like', `%${search}%`],
    ['org', '=', org]
  ]
  const [{ 'count(*)': count }] = await apis.count('Product', where)
  const list = await apis.find('Product', where, {
    limit,
    offset
  }, {
    id: true,
    name: true,
    description: true,
    members: false,
    logoBucket: true,
    logoPath: true,
    children: true,
    creator: {
      id: true,
      displayName: true
    },
    versions: true
  }, [['id', 'desc']])

  await Promise.all(list.map(async item => {
    item['logo'] = await getObjectPreviewUrl.call(this, apis, {
      bucket: item.logoBucket,
      path: item.logoPath
    })
  }))

  return {
    count,
    list
  }
}

/**
 * 更新产品 logo
 *
 * @export
 * @param {API.ER_APIs} apis
 * @param {string} productId
 * @param {File} [file={}]
 * @return {{url: string}}
 */
export async function updateProductLogo (apis, productId, file) {
  const {
    path,
    name
  } = file

  const folder = config.env === 'prod' ? 'product/product-logo' : 'test'
  const newFilename = renameFile(name)
    .to((filename, suffix) =>
      `${filename}_${productId}_${now()}.${suffix}`
    )
  const key = `${folder}/${newFilename}`
  const bucket = 'upload-product-planet'
  const fileBuffer = readFileSync(path)
  await blobstoreUpload.call(this, apis, {
    bucket,
    fileBuffer,
    path: key
  })

  const previewURL = await getObjectPreviewUrl.call(this, apis, { bucket, path: key })

  apis.update('Product', { id: productId }, { logoBucket: bucket, logoPath: key })

  return {
    url: previewURL
  }
}

/**
 * 获取子产品
 *
 * @export
 * @param {API.ER_APIs} apis
 * @param {string} productId
 */
export async function getProductChildren (apis, productId) {
  const children = await apis.find('Product', { parent: productId }, undefined, {
    id: true,
    name: true,
    description: true,
    members: false,
    logoBucket: true,
    logoPath: true,
    children: true,
    versions: true
  })
  await Promise.all(children.map(async item => {
    item['logo'] = await getObjectPreviewUrl.call(this, apis, {
      bucket: item.logoBucket,
      path: item.logoPath
    })
  }))
  return children
}

/**
 * 设置子产品
 *
 * @export
 * @param {API.ER_APIs} apis
 * @param {string} productId
 * @param {string[]} childrenIds
 */
export async function setProductChildren (apis, productId, newChildren) {
  const oldChildren = await getProductChildren.call(this, apis, productId)
  const tasks = newChildren
    .filter(newChild => !oldChildren.some(oldChild => oldChild.id === newChild))
    .map(child => async () =>
      await apis.update('Product', child, { parent: productId }))
    .concat(oldChildren.filter(oldChild => !newChildren.includes(oldChild.id))
      .map(child => async () => {
        await apis.update('Product', child.id, { parent: null })
      })
    )
  await Promise.all(tasks.map(task => task()))
}

/**
 * 获取产品的ER定义，返回json。数据格式参考：planet.storage.json
 * @export
 * @param {API.ER_APIs} apis
 * @param {string} productId
 */
export async function getProductERModel (apis, productId) {
  const result = {
    relations: [],
    entities: []
  }
  const relations = await apis.find('Relation', { product: productId }, undefined, {
    id: true,
    name: true,
    type: true,
    target: true,
    source: true
  })
  const entities = await apis.find('Entity', { product: productId }, undefined, {
    id: true,
    fields: true,
    posX: true,
    posY: true,
    name: true
  })

  result.entities = entities.filter(e => e.posX && e.posY).map(e => {
    return {
      id: e.id,
      name: e.name,
      x: e.posX,
      y: e.posY,
      fields: e.fields
    }
  })

  result.relations = relations
    .filter(r => r.source_entity && r.target_entity)
    .map(r => {
      const result = {
        id: r.id,
        name: r.name,
        type: r.type,
        source: {
          id: r.source_id,
          entity: r.source_entity,
          field: r.source_field
        },
        view: {
          sourcePortSide: r.source_side,
          targetPortSide: r.target_side
        },
        target: {
          id: r.target_id,
          entity: r.target_entity,
          field: r.target_field
        }
      }
      return result
    })
  return result
}
/**
 *
 */
export async function getProductAndPageByPageId (apis, pageId) {
  const pages = await apis.find('Page', { id: pageId }, undefined, {
    id: true,
    name: true,
    version: {
      id: true,
      product: true
    }
  })
  if (pages.length > 0) {
    const page = pages[0]
    return {
      page,
      product: {
        id: page.version_Product_id,
        name: page.version_Product_name
      }
    }
  }
}

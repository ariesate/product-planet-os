import request from '@/tools/request'
import { ObjectToFormData } from '@/tools/transform'

/**
 * 创建产品
 *
 * @export
 * @param {{
 *  name: string
 *  description?: string
 *  logo?: File
 * }} productFields
 * @returns {Promise<{id: string}>}
 */
export async function createProduct (productFields) {
  const { data } = await request.post('/api/createProduct', ObjectToFormData(productFields))
  return data.result
}

/**
 * 更新产品
 *
 * @export
 * @param {{
 *  id: string
 *  name: string
 *  description?: string
 *  logo?: File ｜ string
 * }} productFields
 * @returns {Promise<{id: string}>}
 */
export async function updateProduct (productFields) {
  const { data } = await request.post('/api/updateProduct', ObjectToFormData(productFields))
  return data.result
}

/**
 * 移除产品
 *
 * @export
 * @param {string} productId
 * @return {*}
 */
export async function removeProduct (productId) {
  const { data } = await request.post('/api/removeProduct', { argv: [productId] })
  return data.result
}

/**
 * 获取当前用户的产品
 *
 * @export
 * @param {number} [offset=0]
 * @param {number} [limit=10]
 * @returns {Promise<{
 *  count: number,
 *  list: API.Product.UserProduct[]
 * }>}
 */
export async function fetchCurrentUserProducts (offset = 0, limit = 10) {
  const { data } = await request.post('/api/getCurrentUserProducts', {
    argv: [{ offset, limit }]
  })
  return data.result
}

/**
 * 获取产品列表
 *
 * @export
 * @param {string} [search='']
 * @param {number} [offset=number]
 * @param {number} [limit=number]
 * @returns {Promise<{
 *  count: number,
 *  list: API.Product.ProductDetail[]
 * }>}
 */
export async function fetchProducts (search = '', offset = 0, limit = 10) {
  const { data } = await request.post('/api/getProducts', {
    argv: [search, { offset, limit }]
  })
  return data.result
}

/**
 * 获取产品详情信息
 *
 * @export
 * @param {string} productId
 * @returns {API.Product.ProductDetail}
 */
export async function fetchProductDetail (productId) {
  const { data } = await request.post('/api/getProductDetail', {
    argv: [productId]
  })
  return data.result
}

/**
 * 获取产品的子产品列表
 *
 * @export
 * @param {string} productId
 * @returns
 */
export async function fetchProductChildren (productId) {
  const { data } = await request.post('/api/getProductChildren', {
    argv: [productId]
  })
  return data.result
}

/**
 * 修改子产品列表
 *
 * @param {string} productId
 * @param {string[]} children
 * @returns
 */
export async function setProductChildren (productId, children) {
  const { data } = await request.post('/api/setProductChildren', {
    argv: [productId, children]
  })
  return data.result
}

/**
 * 获取产品的ER定义
 *
 * @param {string} productId
 * @returns
 */
export async function getProductERModel (productId) {
  const { data } = await request.post('/api/getProductERModel', {
    argv: [productId]
  })
  return data.result
}

/**
 * 获取产品下的一系列关联数据：Link, Navigation, Chunks
 */
export async function getProductStruct (versionId) {
  const { data } = await request.post('/api/figma/getProductStruct', {
    argv: [null, versionId]
  })
  return data.result
}

/**
 * 修改产品视图模式：nodeMode
 */
export async function setProductNodeMode (versionId, nodeMode) {
  const { data } = await request.post('/api/figma/setProductNodeMode', {
    argv: [versionId, nodeMode]
  })
  return data.result
}

/**
 * 修改产品显隐外部页面：hideExternal
 */
export async function setHideExternalStatus (versionId, hideExternal) {
  const { data } = await request.post('/api/figma/setHideExternalStatus', {
    argv: [versionId, hideExternal]
  })
  return data.result
}

/**
 * 获取页面的关联数据：Link, Navigation, Chunks
 */
export async function getPageDetail (pageId) {
  const { data } = await request.post('/api/figma/getPageDetail', ObjectToFormData({
    pageId
  }))
  return data.result
}

export async function addDefaultData ({ name, versionId }) {
  const { data } = await request.post('/api/product/addDefaultData', ObjectToFormData({
    versionId,
    name
  }))
  return data.result
}

/**
 * 获取logo
 *
 * @export
 * @param {string} logoBucket
 * @param {string} logoPath
 * @returns {Promise<string>}
 */
export async function getObjectPreviewUrl (logoBucket, logoPath) {
  const { data } = await request.post('/api/getObjectPreviewUrl', ObjectToFormData({
    bucket: logoBucket,
    path: logoPath
  }))
  return data.result
}

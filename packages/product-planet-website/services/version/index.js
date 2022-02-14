import request from '@/tools/request'

/**
 * 创建新的版本
 *
 * @export
 * @param {string} productId
 * @param {{
 *  name: string
 *  description: string
 * }} versionFields
 * @returns
 */
export async function createProductVersion (productId, versionFields) {
  const { data } = await request.post('/api/createProductVersion', {
    argv: [productId, versionFields]
  })
  return data.result
}

/**
 * 修改版本基本信息
 *
 * @exports
 * @param {string} versionId
 * @param {{
 *  name: string
 *  description: string
 * }} versionFields
 * @returns
 */
export async function updateProductVersionBaseInfo (versionId, versionFields) {
  const { data } = await request.post('/api/updateProductVersionBaseInfo', {
    argv: [versionId, versionFields]
  })
  return data.result
}

/**
 * 移除产品的版本
 *
 * @exports
 * @param {string} versionId
 * @returns
 */
export async function removeProductVersion (versionId) {
  const { data } = await request.post('/api/removeProductVersion', {
    argv: [versionId]
  })
  return data.result
}

/**
 * 获取产品版本列表
 *
 * @export
 * @param {string} productId
 * @param {{
 *  offset: number
 *  limit: number
 * }} paging
 * @returns {Promise<{
 *  count: number
 *  list: API.Version.VersionInList[]
 * }>}
 */
export async function fetchProductVersions (productId, paging) {
  const { data } = await request.post('/api/getProductVersions', {
    argv: [productId, paging]
  })
  return data.result
}

/**
 * 获取产品最近 5 个版本
 *
 * @export
 * @param {string} productId
 * @returns {Promise<API.Version.VersionInList[]>}
 */
export async function fetchProductRecentVersions (productId) {
  const { data } = await request.post('/api/getProductRecentVersions', {
    argv: [productId]
  })
  return data.result.list
}

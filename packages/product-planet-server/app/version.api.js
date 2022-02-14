import { getCurrentUserInfo } from './user.api.js'
import { clearUselessKeys } from './util.js'

/**
 * 创建新版本
 *
 * @export
 * @param {API.ER_APIs} apis
 * @param {string} productId
 * @param {{
 *  name: string
 *  description: string
 * }} versionFields
 */
export async function createProductVersion (apis, productId, versionFields) {
  const { id: creator } = await getCurrentUserInfo.call(this, apis)
  // TODO: 重名校验
  return apis.create('ProductVersion', {
    ...clearUselessKeys(versionFields),
    product: productId,
    creator
  })
}

/**
 * 更新版本基本信息
 *
 * @export
 * @param {API.ER_APIs} apis
 * @param {string} productId
 * @param {{
 *  name: string
 *  description: string
 * }} versionFields
 */
export async function updateProductVersionBaseInfo (apis, versionId, versionFields) {
  return apis.update('ProductVersion', versionId, {
    ...clearUselessKeys(versionFields)
  })
}

/**
 * 移除版本
 *
 * @export
 * @param {API.ER_APIs} apis
 * @param {string} versionId
 * @returns
 */
export async function removeProductVersion (apis, versionId) {
  return apis.remove('ProductVersion', versionId)
}

/**
 * 获取产品版本列表
 *
 * @export
 * @param {API.ER_APIs} apis
 * @param {string} productId
 * @param {{
 *  offset: number
 *  limit: number
 * }} paging
 */
export async function getProductVersions (apis, productId, paging) {
  const { offset = 0, limit = 10 } = paging
  const [{ 'count(*)': count }] = await apis.count('ProductVersion', { product: productId })
  const list = await apis.find('ProductVersion', { product: productId }, {
    limit,
    offset
  }, undefined, [
    ['createdAt', 'desc']
  ])

  return {
    count,
    list
  }
}

/**
 * 获取产品最近的版本信息
 *
 * @param {API.ER_APIs} apis
 * @param {string} productId
 */
export async function getProductRecentVersions (apis, productId) {
  return getProductVersions.call(this, apis, productId, { offset: 0, limit: 5 })
}

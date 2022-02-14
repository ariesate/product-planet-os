import { clearUselessKeys } from './util.js'

/**
 *
 * @param {API.ER_APIs} apis
 * @param {string} productId
 * @param {{
 *  name: string
 *  description?: string
 *  notice?: string
 * }} versionFields
 */
export async function createNewVersion (apis, productId, versionFields) {
  const { id } = await apis.create('ProductVersion', {
    ...clearUselessKeys(versionFields),
    product: productId
  })
  return id
}

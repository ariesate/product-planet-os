import assert from 'assert'
import { clearUselessKeys } from './util.js'
import { getUserByKim } from './kim.api.js'

/**
 * @export
 * @param {API.ER_APIs} apis
 */
export async function getCurrentUserInfo (apis) {
  assert(this.sso.userName, 'No current user information')
  const [user] = await apis.find('User', { name: this.sso.userName })
  if (!user) {
    const { id } = await registerUserFromKim.call(this, arguments[0], this.sso.userName)
    return (await apis.find('User', { id }))[0]
  }
  return user
}

/**
 * @export
 * @param {API.ER_APIs} apis
 * @param {{
 *  id?: string
 *  name?: string
 * }} query
 */
export async function getUserInfo (apis, query) {
  const { id, name } = query
  assert(id || name, '\'id\' or \'name\' is needed')
  const [user] = await apis.find('User', clearUselessKeys(query))
  if (!user) {
    const { id } = await registerUserFromKim.call(this, arguments[0], name)
    return (await apis.find('User', { id }))[0]
  }
  return user
}

/**
 * @export
 * @param {API.ER_APIs} apis
 * @param {string} userName
 */
export async function registerUserFromKim (apis, userName) {
  const kimUser = await getUserByKim(apis, userName)
  return apis.create('User', clearUselessKeys({
    name: kimUser.username,
    displayName: kimUser.name,
    email: kimUser.email,
    avatar: kimUser.avatarUrl
  }))
}

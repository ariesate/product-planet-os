import assert from 'assert'
import { clearUselessKeys } from './util.js'

/**
 * @export
 * @this {API.This}
 * @param {API.ER_APIs} apis
 */
export async function getCurrentUserInfo (apis) {
  const [user] = await apis.find(
    'User',
    { id: this.user.id },
    { limit: 1 },
    {
      id: true,
      email: true,
      name: true,
      avatar: true,
      displayName: true,
      org: { id: true, name: true }
    }
  )
  if (user?.org_id) {
    user.org = {
      id: user.org_id,
      name: user.org_name
    }
    delete user.org_id
    delete user.org_name
  }
  return user
}

/**
 * @this {API.This}
 * @param {API.ER_APIs} apis
 */
export async function setCurrentUserInfo (apis, { displayName, avatar }) {
  await apis.update('User', this.user.id, {
    displayName,
    avatar
  })
}

/**
 * @export
 * @this {API.This}
 * @param {API.ER_APIs} apis
 * @param {{
 *  id?: string
 *  name?: string
 * }} query
 */
export async function getUserInfo (apis, query) {
  const { id, name } = query
  assert(id || name, "'id' or 'name' is needed")
  const [user] = await apis.find('User', clearUselessKeys(query))
  assert(user, 'User not found')
  return user
}

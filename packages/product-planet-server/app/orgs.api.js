/**
 * @this {API.This}
 * @param {API.ER_APIs} apis
 * @param {string} name
 */
export async function createOrg (apis, name) {
  const { id } = await apis.create('Org', { name, owner: this.user.id })
  await apis.createRelation('User.orgs', this.user.id, id)
  await apis.createRelation('User.org', this.user.id, id)
}

/**
 * @this {API.This}
 * @param {API.ER_APIs} apis
 */
export async function getCurrentOrg (apis) {
  const [user] = await apis.find(
    'User',
    { id: this.user.id },
    { limit: 1 },
    { org: true }
  )
  if (user?.org_id) {
    return {
      id: user.org_id,
      name: user.org_name
    }
  }
  return null
}

/**
 * @this {API.This}
 * @param {API.ER_APIs} apis
 */
export async function getOrgs (apis) {
  const [user] = await apis.find(
    'User',
    { id: this.user.id },
    { limit: 1 },
    { orgs: true }
  )
  return user.orgs
}

/**
 * @this {API.This}
 * @param {API.ER_APIs} apis
 * @param {string} email
 */
export async function findOrgMembers (apis, email) {
  const [user] = await apis.find(
    'User',
    { id: this.user.id },
    { limit: 1 },
    { org: true }
  )
  const [org] = await apis.find(
    'User',
    [
      ['org', '=', user.org.id],
      ['email', 'like', `%${email}%`]
    ],
    { limit: 10 },
    {
      members: {
        id: true,
        email: true,
        avatar: true
      }
    }
  )
  return org.members
}

/**
 * @this {API.This}
 * @param {API.ER_APIs} apis
 * @param {string} email
 */
export async function addOrgMember (apis, email) {
  const [user] = await apis.find(
    'User',
    { id: this.user.id },
    { limit: 1 },
    { org: true }
  )
  if (!user.org_id) {
    throw new Error('You are not in an org')
  }
  const [member] = await apis.find(
    'User',
    { email },
    { id: true },
    { limit: 1 }
  )
  if (!member) {
    throw new Error('User not found')
  }
  await apis.createRelation('Org.members', user.org_id, member.id)
}

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
  const orgId = user.org_id
  const members = await apis.database
    .select('id', 'name', 'displayName', 'avatar', 'email')
    .from('User')
    .innerJoin('User_orgs_BelongsTo_Org_users', function () {
      this.on('User_orgs_BelongsTo_Org_users.source', '=', 'User.id').on(
        'User_orgs_BelongsTo_Org_users.target',
        '=',
        orgId
      )
    })
    .where('User.email', 'like', `%${email}%`)
    .limit(10)
  return members
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
    { limit: 1 },
    { id: true }
  )
  if (!member) {
    throw new Error('User not found')
  }
  await apis.createRelation('Org.users', user.org_id, member.id)
}

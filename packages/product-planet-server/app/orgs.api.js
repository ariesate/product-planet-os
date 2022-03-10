/**
 * @this {API.This}
 * @param {API.ER_APIs} apis
 * @param {string} name
 */
export async function createOrg (apis, name) {
  const { id } = await apis.create('Org', { name, owner: this.user.id })
  await apis.createRelation('User.orgs', this.user.id, id)
  await apis.createRelation('User.org', this.user.id, id)
  return id
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
    {
      org: {
        id: true,
        name: true,
        owner: {
          id: true
        }
      }
    }
  )
  if (user?.org_id) {
    return {
      id: user.org_id,
      name: user.org_name,
      owner: user.org_Owner_id
    }
  }
  return null
}

/**
 * @this {API.This}
 * @param {API.ER_APIs} apis
 */
export async function setCurrentOrg (apis, orgId) {
  const org = await apis.find('Org', { id: orgId })
  if (!org) {
    throw new Error('机构不存在')
  }
  const res = await apis.findRelation('User.orgs', this.user.id, orgId)
  if (!res.length) {
    throw new Error('你不是机构成员')
  }
  await apis.createRelation('User.org', this.user.id, orgId)
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
  const members = await apis.database()
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
    {
      org: {
        id: true,
        owner: {
          id: true
        }
      }
    }
  )
  if (!user.org_id) {
    throw new Error('当前组织不存在')
  }
  if (user.org_Owner_id !== this.user.id) {
    throw new Error('你不是当前组织的管理员')
  }
  const [member] = await apis.find(
    'User',
    { email },
    { limit: 1 },
    { id: true }
  )
  if (!member) {
    throw new Error('用户不存在')
  }
  const res = await apis.findRelation('Org.users', user.org_id, member.id)
  if (res.length) {
    throw new Error('用户已在当前组织')
  }
  await apis.createRelation('Org.users', user.org_id, member.id)
}

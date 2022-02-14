/*
 * @Description: 成员
 * @Author: fanglin05
 * @Date: 2021-10-26 14:58:46
 * @LastEditors: fanglin05
 * @LastEditTime: 2021-11-08 11:25:34
 */
import assert from 'assert'
import { getUserInfo } from './user.api.js'
import { now } from '../dependence/util.js'

export async function addMember (
  { create, find },
  { userName, userId, productId, role = '', ...fields }
) {
  assert(userId || userName, 'userId or userName is needed')
  assert(typeof productId === 'number', 'productId should be number')

  if (!userId) {
    userId = (await getUserInfo.call(this, arguments[0], { name: userName })).id
  }

  // 防止重复添加成员
  const [item] = await find('UserProduct', { user: userId, product: productId })
  if (item?.id) {
    throw new Error(`member ${userName} is exist in product ${productId}`)
  }

  return create('UserProduct', {
    user: userId,
    product: productId,
    role,
    ...fields
  })
}

export async function addMemberToPage (apis, { userName, pageId, role }) {
  const userId = (await getUserInfo(apis, { name: userName })).id
  return apis.create('UserPage', {
    user: userId,
    page: pageId,
    role
  })
}

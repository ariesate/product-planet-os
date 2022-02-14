/*
 * @Description: 成员
 * @Author: fanglin05
 * @Date: 2021-10-26 11:43:42
 * @LastEditors: fanglin05
 * @LastEditTime: 2021-11-19 16:27:47
 */
import request from '@/tools/request'

export async function addMember ({ userName, userId, productId, role = '' }) {
  const { data = {} } = await request.post('/api/addMember', {
    argv: [{ userName, userId, productId, role }]
  })
  if (data && Array.isArray(data.result)) {
    return data.result
  }
  return []
}

// 输入联想
export async function getSearch (text) {
  const { data = {} } = await request.post('/api/getFilterUsersByKim', {
    argv: [text]
  })
  if (data && Array.isArray(data.result)) {
    const res = data.result.map((item) => {
      return {
        id: item.username,
        name: item.name
      }
    })
    return res
  }
  return []
}

export async function addMemberToPage ({ userName, userId, pageId, role = '' }) {
  const { data = {} } = await request.post('/api/addMemberToPage', {
    argv: [{ userName, userId, pageId, role }]
  })
  if (data && Array.isArray(data.result)) {
    return data.result
  }
  return []
}

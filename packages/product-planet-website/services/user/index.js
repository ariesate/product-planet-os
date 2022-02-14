import request from '@/tools/request'

/**
 * 获取用户信息
 *
 * @export
 * @returns {Promise<API.User.UserInfo>}
 */
export async function fetchUserInfo () {
  const { data } = await request.get('/api/getCurrentUserInfo')
  return data.result
}

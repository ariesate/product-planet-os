import axios from 'axios'

const OPENAPI_DOMAIN = ''
const APP_KEY = ''
const SECRET_KEY = ''

const accessAuth = { token: '', expires: 0 }

/**
 * @description 获取kim ak
 */
async function getAccessToken () {
  if (!(accessAuth.token && new Date().valueOf() < accessAuth.expires)) {
    const data = await axios.default({
      method: 'get',
      url: `${OPENAPI_DOMAIN}/token/get`,
      params: {
        appKey: APP_KEY,
        secretKey: SECRET_KEY
      }
    })
    const { code, result } = data.data || {}
    if (code === 0) {
      accessAuth.token = result.accessToken
      accessAuth.expires =
        new Date().valueOf() + (result.expireTime || 0) * 1000
    }
  }
  return { Authorization: `Bearer ${accessAuth.token}` }
}

/**
 * @description 发送单条kim消息
 * @param {API.ER_APIs} apis
 * @param {object} param
 * @return {*}
 */
async function sendMessage (apis, param = {}) {
  try {
    const ak = await getAccessToken()
    const data = await axios.post(`${OPENAPI_DOMAIN}/openapi/v2/message/send`, param, {
      headers: {
        ...ak,
        'Content-Type': 'application/json'
      }
    })
    const { data: result, status } = data.data || {}
    return result || {}
  } catch (e) {
    return e
  }
}

/**
 * @description 批量发送kim消息
 * @param {API.ER_APIs} apis
 * @param {object} param
 * @return {*}
 */
async function batchSendMessage (apis, param = {}) {
  try {
    const ak = await getAccessToken()
    const data = await axios.post(
      `${OPENAPI_DOMAIN}/openapi/v2/message/batch/send`,
      param,
      {
        headers: {
          ...ak,
          'Content-Type': 'application/json'
        }
      }
    )
    const { data: result, status } = data.data || {}
    return result || {}
  } catch (e) {
    return e
  }
}

/**
 * @description 模糊搜索kim成员列表
 * @param {API.ER_APIs} apis
 * @param {string} text 搜索关键字
 * @param {number} count
 * @return {*}
 */
async function getFilterUsersByKim (apis, text = '', count = 30) {
  try {
    const ak = await getAccessToken()
    const data = await axios.default({
      method: 'post',
      url: `${OPENAPI_DOMAIN}/openapi/v2/user/search/user`,
      data: {
        text,
        username: this.sso?.userName,
        count
      },
      timeout: 1000,
      headers: ak
    })
    const { data: result } = data.data || {}
    return result || []
  } catch (e) {
    return e
  }
}

/**
 * @description 获取kim用户信息
 * @param {API.ER_APIs} apis
 * @param {string} username
 * @param {number} count
 * @return {*}
 */
async function getUserByKim (apis, username = '', count = 30) {
  try {
    const ak = await getAccessToken()
    const data = await axios.default({
      method: 'get',
      url: `${OPENAPI_DOMAIN}/openapi/v2/user/user/${username}`,
      timeout: 1000,
      headers: ak
    })
    const { data: result } = data.data || {}
    return result || {}
  } catch (e) {
    return e
  }
}

export {
  sendMessage,
  batchSendMessage,
  getFilterUsersByKim,
  getUserByKim
}

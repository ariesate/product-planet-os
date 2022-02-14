import axios from 'axios'

const OPENAPI_DOMAIN = 'https://is-gateway.corp.kuaishou.com'
const APP_KEY = '3e8a3e15-5e6c-4cd7-a654-bc4716aa2f12'
const SECRET_KEY = '8f0e80db145e42cf8858ce66a0dc56ae'

const accessAuth = { token: '', expires: 0 }

/**
 * @description 获取 accessToken
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

async function fetchFromTeamOpenapi ({ method, url, data, params }) {
  try {
    const ak = await getAccessToken()
    const r = await axios({
      method,
      headers: {
        ...ak,
        'Content-Type': 'application/json'
      },
      url: `${OPENAPI_DOMAIN}/${url}`,
      data,
      params
    })
    const { result } = r.data || {}
    return result || {}
  } catch (e) {
    return e
  }
}

export { fetchFromTeamOpenapi }

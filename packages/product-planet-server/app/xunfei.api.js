import CryptoJS from 'crypto-js'

const API_SECRET = 'MmI4MDdiYTA3ZmYyOGEzNDQyZDUyNzAz'
const API_KEY = 'eba4ea5719f9a5d8d869b956d501cff9'

export async function getWebSocketUrl (apis) {
  const url = 'wss://iat-api.xfyun.cn/v2/iat'
  const host = 'iat-api.xfyun.cn'
  const apiKey = API_KEY
  const apiSecret = API_SECRET
  const date = new Date().toGMTString()
  const algorithm = 'hmac-sha256'
  const headers = 'host date request-line'
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/iat HTTP/1.1`
  const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret)
  const signature = CryptoJS.enc.Base64.stringify(signatureSha)
  const authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`
  const authorization = Buffer.from(authorizationOrigin).toString('base64')
  return `${url}?authorization=${authorization}&date=${date}&host=${host}`
}

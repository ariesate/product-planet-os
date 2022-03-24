import axios from 'axios'
import { parseSearch } from '../utils/util'
/**
 * @template T
 * @typedef {{
 *  result: T
 *  context: Object
 * }} AjaxResponse
 */

/**
 * @type {import('axios').AxiosRequestConfig}
 */
const config = {
  timeout: 20e3,
  headers: {
    Accept: 'application/json'
  },
  withCredentials: true
}

const instance = axios.create(config)
instance.interceptors.request.use(config => {
  const pathArr = location.pathname.split('/').filter(Boolean)
  if (pathArr[0] === 'product' && pathArr[2] === 'version') {
    config.headers['pp-version'] = pathArr[3]
  }
  const search = parseSearch(location.search)
  if (search && search.group) {
    config.headers['pp-version-group'] = search.group
  }

  return config
})
instance.interceptors.response.use(
  /**
   * @template
   * @param {import('axios').AxiosResponse<AjaxResponse<T>>} res
   * @returns {(import('axios').AxiosResponse<AjaxResponse<T>>) | Promise<never>}
   */
  (res) => {
    const data = res.data.result
    if (data && data.loginUrl) {
      window.location.href = data.loginUrl
    }
    return res
  },
  /**
   * @param {import('axios').AxiosError} e
   * @returns {Promise<never>}
   */
  (e) => {
    if (e.response?.status === 401) {
      window.location.href = '/account/login?redirect=' + encodeURIComponent(window.location.pathname)
    }
    let message = ''
    try {
      if (e.response?.data?.message && typeof e.response?.data?.message === 'string') {
        message = e.response?.data?.message
      } else if (e.message && typeof e.message === 'string') {
        message = e.message
      } else if (e.isAxiosError && typeof e.toJSON === 'function') {
        message = JSON.stringify(e.toJSON())
      } else if (e.code) {
        message = `code: ${e.code}`
      }
    } catch {
      // ignore
    }
    e.message = message
    return Promise.reject(e)
  }
)

export default instance

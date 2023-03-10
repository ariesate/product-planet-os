import request from '@/tools/request'
import axios from 'axios'

interface ApiResponseData<T = any> {
  result: T
}
async function send(service: string, ...args: any[]): Promise<any> {
  let data: any
  let headers: Record<string, string>
  if (args[0] instanceof FormData) {
    data = args[0]
    headers = {
      'Content-Type': 'multipart/form-data'
    }
  } else {
    data = {
      argv: args
    }
  }
  const res = await request.post<ApiResponseData>(`/api/${service}`, data, {
    headers
  })
  return res.data?.result
}
async function upload(
  this: APIObject,
  file: Blob | File,
  name: string
): Promise<string> {
  const res = await this.storage.getUploadParams(name)
  const data = new FormData()
  for (const key in res.fields) {
    data.append(key, res.fields[key])
  }
  data.append('file', file)
  await axios.post(res.endpoint, data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return res.url
}
send.$upload = upload

interface APIObject {
  <T = any>(...args: any[]): Promise<T>
  [x: string]: APIObject
}
type ExtendedAPIObject = {
  $upload(file: Blob | File, name: string): Promise<string>
} & APIObject

function proxify(target: any, prop: string, receiver?: any) {
  if (Reflect.has(target, prop)) {
    return Reflect.get(target, prop, receiver)
  }
  return new Proxy(target.bind(undefined, prop), {
    apply(t, c, args) {
      return t.apply(c, args)
    },
    get(t, p: string, r) {
      return proxify(target, `${prop}/${p}`, r)
    }
  })
}

/**
 * API 对象
 * @description
 * 通过API对象访问API请求，支持链式访问
 * - `api.methodName()` 请求转换为`/api/methodName`
 * - `api.serviceName.methodName()` 请求转换为`/api/serviceName/methodName`
 * - `api.service1Name.service2Name.methodName()` 请求转换为`/api/service1Name/service2Name/methodName`
 * 参数直接以参数表形式传入调用函数即可
 * - `api.methodName(arg1, arg2, ...)`
 * @example
 * await api.userInfo();
 * aait api.users.updateProfile('https://...');
 */
export default new Proxy(send, {
  get(t, p: string, r) {
    return proxify(t, p, r)
  }
}) as ExtendedAPIObject

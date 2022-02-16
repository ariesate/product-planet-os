import Koa from 'koa'
import koaBody from 'koa-body'
import { parsePath } from '../util.js'
import { DIRECT_ACCESS_KEY } from './bootstrap.js'

export function useAPI (serviceAPIs) {
  return async (requestContext, method, next) => {
    // TODO: Become a middleware
    if (requestContext.request.type === 'multipart/form-data') {
      requestContext.request.body = {
        argv: [Object.assign(requestContext.request.body, requestContext.request.files)]
      }
    }

    // CAUTION 未来还可以支持其他的控制参数
    const { argv = [], context = {} } = requestContext.request.body

    const accessPath = method.split('/').join('.')
    const directAccessPath = `${DIRECT_ACCESS_KEY}.${accessPath}`

    const accessedMethod = parsePath(accessPath)(serviceAPIs) || parsePath(directAccessPath)(serviceAPIs)

    if (typeof accessedMethod !== 'function') {
      next()
      return
    }

    let result

    // TODO 如何配置化
    /** @type {API.This} */
    const newContext = {
      effects: [],
      ...context,
      user: requestContext.state.user
    }

    let hasError
    try {
      result = await accessedMethod.apply(newContext, argv)
    } catch (e) {
      console.error(e)
      hasError = true
      requestContext.status = 500
      requestContext.body = {
        name: e.name,
        message: e.message
      }
    }

    if (!hasError) {
      requestContext.status = 200
      requestContext.body = {
        result,
        context
      }
    }
  }
}

export function setup (serviceAPIs) {
  const server = new Koa()
  server.use(koaBody({
    json: true,
    multipart: true,
    patchKoa: true
  }))

  return { server, serviceAPIs, useAPI }
}

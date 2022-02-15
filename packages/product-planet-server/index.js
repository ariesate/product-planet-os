import koaRoute from 'koa-route'
import cors from '@koa/cors'
import serve from 'koa-static'
import config from './config/index.js'
import { initServer } from './dependence/bootstrap/bootstrap.js'
import catchError from './middleware/catchError.js'
import { cloneTemplate } from './app/git.js'
import auth from './dependence/auth.js'

const { server, serviceAPIs, useAPI } = await initServer({})

// TODO serve static files，理论上应该分开部署，不过因为 AP 不支持断开访问，所以目前先这样处理
server.use(serve('./dist'))
server.use(catchError)
server.use(
  auth({
    database: config.database,
    jwtSecret: config.server.jwtSecret,
    exclude: /^\/(health|figma|page|logMessage|webhooks|login)/
  })
)
server.use(cors({ origin: '*' }))

// 下载文件，返回二进制形式
server.use(
  koaRoute.post('/api/blobstoreDownload', async (ctx, next) => {
    await next()
    const buffer = ctx.response?.body?.result
    ctx.body = buffer
    ctx.type = 'bin'
  })
)

// git的webhook，标准化入参
server.use(
  koaRoute.post('/webhooks/gitlab', async (ctx, next) => {
    ctx.request.body = { argv: [ctx.request.body] }
    await next()
  })
)

// 部署所需
server.use(
  koaRoute.get('/health', (ctx) => {
    ctx.status = 200
    ctx.body = 'ok'
  })
)

server.use(koaRoute.post('/api/(.*)', useAPI(serviceAPIs)))
server.use(koaRoute.get('/api/(.*)', useAPI(serviceAPIs)))

// ======================== open apis ========================
server.use(koaRoute.post('/figma/(.*)', useAPI(serviceAPIs?.figma || {})))
server.use(koaRoute.get('/figma/(.*)', useAPI(serviceAPIs?.figma || {})))
server.use(koaRoute.post('/page/(.*)', useAPI(serviceAPIs?.page || {})))
server.use(koaRoute.get('/page/(.*)', useAPI(serviceAPIs?.page || {})))
server.use(
  koaRoute.post('/logMessage/(.*)', useAPI(serviceAPIs?.logMessage || {}))
)
server.use(
  koaRoute.get('/logMessage/(.*)', useAPI(serviceAPIs?.logMessage || {}))
)
server.use(koaRoute.post('/webhooks/(.*)', useAPI(serviceAPIs?.webhooks || {})))
server.use(koaRoute.post('/team/(.*)', useAPI(serviceAPIs?.team || {})))
server.use(koaRoute.get('/team/(.*)', useAPI(serviceAPIs?.team || {})))

// error handling
server.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    console.error(err)
    ctx.status = err.statusCode || err.status || 500
    ctx.body = {
      message: err.message
    }
  }
})

// 项目启动前，拉取codebase初始模板
cloneTemplate()

server.listen(process.env.port || 9000, () => {
  console.info({
    message: 'server ready'
  })
})

/*
 * @Description: 错误处理
 * @Author: fanglin05
 * @Date: 2021-11-14 20:33:56
 * @LastEditors: fanglin05
 * @LastEditTime: 2021-12-27 19:42:17
 */
import fs from 'fs'

export default async (ctx, next) => {
  await next()
  // 如果是404、401，需要判断一下是页面路由还是普通接口请求，如果是页面路由则返回index.html
  if ([404, 401].includes(ctx.status) && ctx.originalUrl?.indexOf('/api/') === -1) {
    ctx.set('Content-Type', 'text/html')
    ctx.body = fs.readFileSync('dist/index.html')
  }
}

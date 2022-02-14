import { getProductAndPageByPageId } from './product.api.js'
import * as webhooks from './webhooks.api.js'
import config from '../config/index.js'

/**
 * 新增日志
 *
 * @export
 * @param {API.ER_APIs} apis
 * @param {{
 *  productId: number;  产品，以“id”结尾表示是数据字段而不是关联关系
 *  pageId: number; 页面
 *  type: 'log' | 'monitor' | 'project';
 *  action: string;
 *  member: string;  message user
 *  value: string;   对应 error message 和 project status
 * }} upData
 */

export async function log (apis, upData) {
  if (!upData.pageId) {
    const pages = await apis.find('Page', { key: upData.pageKey })
    upData.pageId = pages[0].id
  }
  delete upData.pageKey

  await apis.create('LogMessage', { ...upData })

  // TODO：消息通知，临时在log里处理
  if (upData.pageId && upData.type === 'project') {
    const pageId = upData.pageId
    const { product, page } = await getProductAndPageByPageId(apis, pageId)

    if (product) {
      console.log('config.server: ', config.server)
      switch (upData.action) {
        case 'design':
          webhooks.notice(apis, [{
            ...page
            // author: '设计师',
            // message: '完成设计稿',
            // url: config.server?.domain,
          }], {
            productId: product.id,
            content: `**页面【${page.name}】进度通知**\n>状态：<font color=green>完成</font>\n>人员：设计师\n>内容：完成设计稿\n>`
          })
          break
        default:
      }
    }
  }

  return 1
}

/**
 * 读取日志
 *
 * @export
 * @param {API.ER_APIs} apis
 * @param {{
 *  productId: number;  产品
 *  pageId: number;  页面
 *  type: 'log' | 'monitor' | 'project';
 *  action: string;
 *  date?: [Date, Date]; 时间范围，默认取全部
 *  format?: 'acc' | 'latest'  acc 返回累加后的结果 latest只取最新的
 * }} query
 */
export async function readLog (apis, query) {
  if (typeof query.date === 'string') {
    query.date = query.date.split(',').map(str => Number(str))
  }

  const queryWhere = query.date
    ? [
        {
          method: 'andWhere',
          children: [
            ['createdAt', '>', query.date[0]],
            ['createdAt', '<', query.date[1]]
          ]
        },
        ['pageId', '=', query.pageId],
        ['type', '=', query.type],
        ['action', '=', query.action]
      ]
    : {
        pageId: query.pageId,
        type: query.type,
        action: query.action
      }

  let logs = await apis.find('LogMessage',
    queryWhere,
    query.format === 'latest' ? { limit: 1 } : undefined,
    {
      productId: true,
      pageId: true,
      type: true,
      action: true,
      member: true,
      value: true,
      createdAt: true
    },
    query.format === 'latest' ? [['createdAt', 'desc']] : undefined
  )

  if (logs.length) {
    switch (query.format) {
      case 'acc':
        logs = logs.reduce((p, n) => {
          const numValue = Number(n.value || 1)
          const nextValue = isNaN(numValue) ? 1 : numValue
          return Object.assign(p, {
            counts: p.counts + nextValue
          })
        }, { counts: 0, ...logs[0] })
        break
      case 'latest':
        logs = logs.slice(0, 1)
        break
    }
  }
  return logs
}

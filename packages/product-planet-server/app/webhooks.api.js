import { sendMessage, batchSendMessage } from './kim.api.js'
import { log } from './logMessage.api.js'

/**
 * @description gitlab webhook
 * @param {API.ER_APIs} apis
 * @param {object} event
 * @return {*}
 */
export async function gitlab (apis, event) {
  switch (event.object_kind) {
    case 'push':
      if (!/^0+$/.test(event.after)) {
        const res = await handlePush.call(this, apis, event)
        return res
      }
      break
  }
}

/**
 * @description 处理push事件
 * @param {API.ER_APIs} apis
 * @param {object} event
 * @return {*}
 */
async function handlePush (apis, event) {
  const { project_id: projectId, commits = [], url } = event || {}
  const { id: productId } =
      (await apis.find('Product', { codebaseId: projectId }))[0] || {}
  if (!productId) return
  const { id: versionId } =
      (await apis.find('ProductVersion', { product: productId }))[0] || {}
  await handleFinishPages.call(this, apis, commits, { productId, versionId })
}

/**
 * @description 处理页面前端开发完成, 通知页面成员
 * @param {API.ER_APIs} apis
 * @param {Array} commits
 * @param {{projectId: number, versionId: number}} commits
 * @return {*}
 */
async function handleFinishPages (apis, commits = [], { productId, versionId }) {
  // 完成态commit格式约定
  // finish: finish message#page=page1,page2,page3
  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i]
    const { title = '', author = {}, url } = commit
    const reg = /^(finish:.*)#page=(.*)$/
    const regArr = reg.exec(title)
    const pageArr = []
    if (regArr && regArr.length > 2) {
      const pages = regArr[2].split(',')
      for (let j = 0; j < pages.length; j++) {
        const text = pages[j]
        let id, name
        const tempPage = (await apis.find('Page', { version: versionId, key: text }))[0]
        if (tempPage?.id) {
          id = tempPage.id
          name = tempPage.name
        } else if (/^page-\d+$/.test(text)) {
          id = Number(text.split('-')[1])
          name =
            (await apis.find('Page', { id, version: versionId }))[0]?.name || ''
        } else {
          const res =
            (await apis.find('Page', { name: text, version: versionId }))[0] ||
            {}
          id = res.id
          name = text
        }
        id &&
          name &&
          pageArr.push({
            id,
            name,
            message: regArr[1],
            author: author.name,
            url
          })
      }
    }
    await updatePageStatus.call(this, apis, pageArr, { productId, versionId })
    await notice.call(this, apis, pageArr, { productId, versionId })
  }
}

async function updatePageStatus (apis, pages = [], { productId }) {
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    await log.call(this, apis, {
      productId,
      pageId: page.id,
      type: 'project',
      action: 'frontend',
      value: 'DONE'
    })
  }
}

/**
 * @description 处理页面前端开发完成，通知页面成员
 * @param {API.ER_APIs} apis
 * @param {Array} pages
 * @param {{projectId?: number, versionId?: number, content: string}} param
 * @return {*}
 */
export async function notice (
  apis,
  pages = [],
  { productId, versionId, content }
) {
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const members = (
      await apis.find('UserPage', { page: page.id }, {}, { user: true })
    ).map((item) => item.user_name)
    if (members && members.length) {
      await batchSendMessage.call(
        this,
        {},
        {
          usernames: members,
          msgType: 'markdown',
          markdown: {
            content:
              content ||
              `**页面【${page.name}】变更通知**\n>状态：<font color=green>完成</font>\n>变更人：${page.author}\n>变更内容：\n>${page.message}\n\n[<font color=blue>点击前往>>></font>](${page.url})`
          }
        }
      )
    }
  }
}

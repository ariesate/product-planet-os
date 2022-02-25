import { getProducts } from './product.api.js'
import { blobstoreUpload, getObjectPreviewUrl } from './blobstore.api.js'
import * as logMessage from './logMessage.api.js'
import config from '../config/index.js'
import { now } from '../dependence/util.js'
import { readFileSync } from 'fs'
import { renameFile } from './util.js'
import { getTaskInfos } from './team.api.js'
import axios from 'axios'

const host = 'https://bs3-hb1.corp.kuaishou.com'

/**
 * 获取产品结构
 *
 * @export
 * @param {API.ER_APIs} apis
 */
export async function getProductStruct (apis, productId) {
  const result = Object.create(null)
  const [{ id: versionId }] = await apis.find('ProductVersion', { product: productId })
  await Promise.all([
    async () => {
      result.navigation = await apis.find('Navigation', { version: versionId }, { limit: null }, {
        id: true,
        name: true,
        href: true,
        order: true,
        type: true,
        page: true,
        parent: true
      })
    },
    async () => {
      result.page = await apis.find('Page', { version: versionId }, { limit: null }, {
        id: true,
        name: true,
        navbars: true,
        chunks: true,
        params: true,
        key: true,
        path: true,
        posX: true,
        posY: true,
        designPreviewUrl: true,
        lcdpId: true,
        dollyId: true,
        statusSet: true,
        tasks: true,
        isHide: true,
        hideChildren: true,
        childrenNum: true,
        height: true,
        width: true
      })
      result.links = []
      await Promise.all(result.page.map(async page => {
        if (page.tasks) {
          page.taskInfos = await getTaskInfos.call(this, apis, {
            taskIds: page.tasks.split(',')
          })
        }
        page.links = await apis.find('Link', { page: page.id }, { limit: null }, {
          id: true,
          name: true,
          type: true,
          source: true,
          target: true,
          visible: true
        })

        if (page.designPreviewUrl && !page.designPreviewUrl.startsWith('data')) {
          page.designPreviewUrl = await getObjectPreviewUrl.call(this, apis, { path: page.designPreviewUrl })
        }
        result.links.push(...page.links)
      }))
      // TODO: 查询“今天”的page的pv, error数据并汇总
      const stDate = new Date()
      stDate.setHours(0)
      stDate.setMinutes(0)
      stDate.setSeconds(0)

      const dateRange = [
        stDate.getTime() / 1000,
        new Date().getTime() / 1000
      ]
      result.pageMessage = {}
      await Promise.all(result.page.map(async page => {
        const error = await logMessage.readLog(apis, {
          pageId: page.id,
          type: 'monitor',
          action: 'error',
          format: 'acc',
          date: dateRange
        })
        const pv = await logMessage.readLog(apis, {
          pageId: page.id,
          type: 'log',
          action: 'pv',
          format: 'acc',
          date: dateRange
        })
        const warning = await logMessage.readLog(apis, {
          pageId: page.id,
          type: 'monitor',
          action: 'warning',
          format: 'acc',
          date: dateRange
        })
        result.pageMessage[page.id] = { error: error.counts || 0, warning: warning.counts || 0, pv: pv.counts || 0 }
      }))
    }
  ].map(fn => fn()))

  return result
}

/**
 * 获取页面结构
 *
 * @export
 * @param {API.ER_APIs} apis
 */
export async function getPageDetail (apis, { pageId }) {
  const result = Object.create(null)
  result.pageId = pageId
  await Promise.all([
    async () => {
      result.page = await apis.find('Page', { id: pageId }, {}, {
        id: true,
        name: true,
        navbars: true,
        chunks: true,
        params: true,
        links: true,
        posX: true,
        posY: true,
        tasks: true
      })
      result.links = []
      await Promise.all(result.page.map(async page => {
        page.links = await apis.find('Link', { page: page.id }, {}, {
          id: true,
          type: true,
          name: true,
          source: true,
          target: true,
          visible: true
        })
      }))
    }
  ].map(fn => fn()))

  return result
}

/**
 * 获取产品列表
 *
 * @export
 * @param {API.ER_APIs} apis
 * @param {string} [search='']
 * @param {} [paging={}]
 * @return {*}
 */
export async function getProductsForFigma (apis, search = '', paging = {}) {
  return getProducts.call(this, apis, search, paging)
}

/**
 * 获取版本详情
 *
 * @export
 * @param {API.ER_APIs} apis
 * @returns
 */
export async function getProductDetailForFigma (apis, productId, versionId) {
  const result = {}
  await Promise.all([
    async () => {
      const [product] = await apis.find('Product', { id: productId }, undefined, {
        id: true,
        name: true,
        description: true,
        members: false,
        children: true,
        logo: true,
        creator: {
          id: true,
          displayName: true
        },
        versions: true
      })
      result.product = product
    },
    async () => {
      const pages = await apis.find('Page', { version: versionId }, undefined, {
        id: true,
        name: true,
        statusSet: true
      })
      result.pages = pages
    }
  ].map(fn => fn()))
  return result
}

/**
 * 上传页面设计稿预览图
 *
 * @export
 * @param {API.ER_APIs} apis
 * @returns
 */
export async function uploadPagePreview (apis, pageId, url) {
  return apis.update('Page', pageId, {
    designPreviewUrl: url
  })
}

export async function uploadPagePreviewV2 (apis, { pageId, file }) {
  const {
    path,
    name
  } = file

  const folder = config.env === 'prod' ? 'product/page-design-preview' : 'test'
  const newFileName = renameFile(name)
    .to((filename, suffix) =>
    `${filename}_${pageId}_${now()}.${suffix}`
    )
  const key = `${folder}/${newFileName}`
  const bucket = 'upload-product-planet'
  const fileBuffer = readFileSync(path)
  await blobstoreUpload.call(this, apis, {
    bucket,
    fileBuffer,
    path: key
  })

  return apis.update('Page', pageId, { designPreviewUrl: key })
}

export async function uploadStatusPreview (apis, { statusId, file }) {
  const {
    path,
    name
  } = file

  const folder = config.env === 'prod' ? 'product/status-design-preview' : 'test'
  const newFileName = renameFile(name)
    .to((filename, suffix) =>
    `${filename}_${statusId}_${now()}.${suffix}`
    )
  const key = `${folder}/${newFileName}`
  const bucket = 'upload-product-planet'
  const fileBuffer = readFileSync(path)
  await blobstoreUpload.call(this, apis, {
    bucket,
    fileBuffer,
    path: key
  })

  return apis.update('PageStatus', statusId, { designPreviewUrl: `${host}/${bucket}/${key}?ts=${Date.now()}` })
}

export async function convertImgToBase64URL (apis, url) {
  return Buffer.from((await axios.get(encodeURI(url), { responseType: 'arraybuffer' })).data).toString('base64')
}

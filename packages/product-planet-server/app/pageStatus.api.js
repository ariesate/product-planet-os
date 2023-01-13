import { readFileSync } from 'fs'
import config from '../config/index.js'
import { blobstoreUpload } from './blobstore.api.js'

const host = ''

/**
 * @description 添加原型图
 * @param {API.ER_APIs} apis
 * @param {{title: string, file: object}} param
 * @return {*}
 */
export async function updateProto (apis, { id, title, file }) {
  const { path, name } = file
  const type = name.split('.').pop()
  const folder = config.env === 'prod' ? 'prototype' : 'test'
  // TODO: 根据 productId/versionId/pageId/statusId 隔离
  const key = `${folder}/${title}.${type}`
  const bucket = 'upload-product-planet'

  const fileBuffer = readFileSync(path)
  const blobRes = await blobstoreUpload(apis, {
    bucket,
    fileBuffer,
    path: key
  })
  if (!blobRes.ETag) return blobRes

  // 加个时间戳方便页面刷新
  const url = `${host}/${bucket}/${key}?ts=${Date.now()}`
  await apis.update('PageStatus', +id, { proto: url })

  return url
}

/**
 * @this {API.This}
 * @param {API.ER_APIs} apis
 * @param {number} productId
 * @param {string} text
 */
export async function findMarkups (apis, productId, text) {
  let query = apis.database()
    .select({
      id: 'Markup.id',
      name: 'Markup.name',
      pageName: 'Page.name',
      statusName: 'PageStatus.name'
    })
    .from('PagePin')
    .innerJoin('Markup', 'PagePin.markup', 'Markup.id')
    .innerJoin('PageStatus', 'PagePin.pageStatus', 'PageStatus.id')
    .innerJoin('Page', 'PageStatus.page', 'Page.id')
    .innerJoin('ProductVersion', 'Page.version', 'ProductVersion.id')
    .where('ProductVersion.product', '=', productId)
  if (text) {
    query = query.andWhere('Markup.name', 'like', `%${text}%`)
  }
  const res = await query
    .orderBy('Markup.createdAt', 'desc')
    .limit(5)
  return res
}

/**
 * @this {API.This}
 * @param {API.ER_APIs} apis
 * @param {number} markupId
 */
export async function findMarkupDetail (apis, markupId) {
  const res = await apis.database()
    .select({
      id: 'Markup.id',
      name: 'Markup.name',
      image: 'PageStatus.proto',
      pageId: 'Page.id',
      pageName: 'Page.name',
      statusId: 'PageStatus.id',
      statusName: 'PageStatus.name',
      pinId: 'PagePin.id',
      canvasWidth: 'PageStatus.width',
      canvasHeight: 'PageStatus.height',
      width: 'PagePin.width',
      height: 'PagePin.height',
      x: 'PagePin.x',
      y: 'PagePin.y'
    })
    .from('PagePin')
    .innerJoin('Markup', 'PagePin.markup', 'Markup.id')
    .innerJoin('PageStatus', 'PagePin.pageStatus', 'PageStatus.id')
    .innerJoin('Page', 'PageStatus.page', 'Page.id')
    .andWhere('Markup.id', '=', markupId)
    .limit(1)
  return res[0]
}

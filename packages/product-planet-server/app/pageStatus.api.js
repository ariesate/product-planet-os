import { readFileSync } from 'fs'
import config from '../config/index.js'
import { blobstoreUpload } from './blobstore.api.js'

const host = 'https://bs3-hb1.corp.kuaishou.com'

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

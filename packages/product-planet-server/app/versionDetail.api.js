import { readFileSync } from 'fs'
import config from '../config/index.js'
import { blobstoreUpload } from './blobstore.api.js'
import { getCurrentUserInfo } from './user.api.js'
import { renameFile } from './util.js'
import { now } from '../dependence/util.js'

/**
 * @description 添加产品文件
 * @param {API.ER_APIs} apis
 * @param {{type: string, url: string, title: string, version: number, file: object}} param
 * @return {*}
 */
export async function addFile (apis, {
  type,
  url = '',
  title = '',
  version,
  file
}) {
  // 下载
  try {
    const {
      id: creator
    } = await getCurrentUserInfo.call(this, apis)
    if (title && url) {
      // 仅链接
      const res = await apis.create('Resource', {
        version: Number(version),
        name: title,
        link: url,
        type,
        creator
      })
      return res
    } else if (title && file) {
      // 文件上传到blobstore
      const {
        path,
        name
      } = file

      const folder = config.env === 'prod' ? `resource/${type}` : 'test'
      const newFilename = renameFile(name)
        .to((filename, suffix) =>
          `${filename}_${version}_${now()}.${suffix}`
        )
      const key = `${folder}/${newFilename}`
      const bucket = 'upload-product-planet'

      const fileBuffer = readFileSync(path)
      await blobstoreUpload.call(this, apis, {
        bucket,
        fileBuffer,
        path: key
      })
      const res = await apis.create('Resource', {
        version: Number(version),
        name: title,
        bucket,
        path: key,
        type,
        contentType: file.type,
        creator
      })
      return res
    }
  } catch (e) {
    return e
  }
}

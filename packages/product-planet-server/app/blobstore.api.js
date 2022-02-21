
const bs3 = {}

/**
 * @description 上传文件
 * @param {API.ER_APIs} apis
 * @param {{fileBuffer: Buffer, bucket: string, path: string}}
 * @return {*}
 */
export async function blobstoreUpload (
  apis,
  { fileBuffer, bucket = 'upload-product-planet', path }
) {
  try {
    return bs3.putObject({
      Bucket: bucket,
      Key: path,
      Body: fileBuffer
    })
  } catch (e) {
    return e
  }
}

/**
 * @description 下载文件
 * @param {API.ER_APIs} apis
 * @param {{bucket: string, path: string}}
 * @return {*}
 */
export async function blobstoreDownload (apis, { bucket = 'upload-product-planet', path }) {
  try {
    const res = await bs3.getObject({
      Bucket: bucket,
      Key: path
    })
    const bufferData = res?.Body
    return bufferData
  } catch (e) {
    console.log(e)
    return e
  }
}

/**
 * @description 获取预览url
 * @param {API.ER_APIs} apis
 * @param {{bucket: string, path: string}}
 * @return {*}
 */
export async function getObjectPreviewUrl (apis, { bucket = 'upload-product-planet', path }) {
  if (!bucket || !path) return ''
  try {
    return bs3.s3.getSignedUrlPromise('getObject', {
      Bucket: bucket,
      Key: path
    })
  } catch (e) {
    return e
  }
}

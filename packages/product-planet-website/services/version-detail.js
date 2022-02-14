/*
 * @Description: 版本详情
 * @Author: fanglin05
 * @Date: 2021-10-26 11:43:42
 * @LastEditors: fanglin05
 * @LastEditTime: 2021-11-19 15:06:22
 */
import request from '@/tools/request'

export async function addFile (fileBuffer) {
  const { data = {} } = await request.post('/api/addFile', fileBuffer, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data.result
}

export async function downloadFile ({ bucket, path }) {
  const { data = '' } = await request.post(
    '/api/blobstoreDownload',
    {
      argv: [{ bucket, path }]
    },
    {
      responseType: 'arraybuffer'
    }
  )
  return data
}

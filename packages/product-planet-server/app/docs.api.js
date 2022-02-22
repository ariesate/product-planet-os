import { readFileSync } from 'fs'
import { createHash } from 'crypto'
import config from '../config/index.js'

const bs3 = {}
const host = 'https://bs3-hb1.corp.kuaishou.com'

export async function uploadByFile (_, { file }) {
  const { path, size, name } = file
  const fileBuffer = readFileSync(path)
  const hash = createHash('md5').update(fileBuffer).digest('hex')
  const ext = name.split('.').pop()
  const folder = config.env === 'prod' ? 'attachments' : 'test'
  const bucket = 'upload-product-planet'
  const key = `${folder}/${hash}.${ext}`
  await bs3.putObject({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer
  })

  return {
    url: `${host}/${bucket}/${key}`,
    name,
    size,
    hash
  }
}

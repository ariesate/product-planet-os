import oss from 'ali-oss'
import { createHmac } from 'crypto'
import config from '../config/index.js'

const stsClient = new oss.STS({
  accessKeyId: config.oss.accessKeyId,
  accessKeySecret: config.oss.accessKeySecret
})

async function getCredentials (session) {
  const STSpolicy = {
    Statement: [
      {
        Action: ['oss:PutObject'],
        Effect: 'Allow',
        Resource: [`acs:oss:*:*:${config.oss.bucket}/${config.oss.folder}/*`]
      }
    ],
    Version: '1'
  }
  const { credentials } = await stsClient.assumeRole(
    config.oss.roleArn,
    STSpolicy,
    900,
    session
  )

  const date = new Date()
  date.setHours(date.getHours() + 1)
  const policyText = {
    expiration: date.toISOString(),
    conditions: [['content-length-range', 0, 10 * 1024 * 1024 * 1024]]
  }
  const policy = Buffer.from(JSON.stringify(policyText)).toString('base64')
  const signature = createHmac('sha1', credentials.AccessKeySecret)
    .update(policy)
    .digest('base64')
  return {
    OSSAccessKeyId: credentials.AccessKeyId,
    signature,
    policy,
    'x-oss-security-token': credentials.SecurityToken
  }
}

/**
 * @this {API.This}
 * @param {API.ER_APIs} apis
 * @param {string} filename
 */
export async function getUploadParams (apis, filename) {
  const fields = await getCredentials(this.user.id + 9999)
  const key = `${config.oss.folder}/${this.user.id + 9999}/${filename.replace(
    /\^\//,
    ''
  )}`
  return {
    endpoint: config.oss.host,
    url: `${config.oss.host}/${key}`,
    fields: {
      ...fields,
      key
    }
  }
}

import axios from 'axios'
import { createCipheriv } from 'crypto'
import { ProtectionProvider } from '@infra-node/keycenter'
import config from '../config/index.js'
import logger from '../logger.js'

const http = axios.create({
  baseURL: config.service.firefly.baseUrl
})

const DefaultSourceDataType = 8
const DefaultSourceDataFormat = JSON.stringify({
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'number' },
      name: { type: 'string' },
      member: { type: 'boolean', description: '成员' }
    },
    required: []
  },
  required: []
})
const DefaultSourceData = [
  {
    id: 1,
    name: 'test',
    member: false
  }
]

async function sign (id) {
  const kc = ProtectionProvider.getProvider(config.service.firefly.kcName)
  const secret = await kc.decryptBase64(config.service.firefly.kcData)
  const content = `${Math.floor(Date.now() / 1000)}${id || ''}`
  const cipher = createCipheriv(
    'aes-256-cbc',
    Buffer.from(secret, 'hex'),
    Buffer.alloc(16, 0)
  )
  cipher.update(content, 'utf8')
  return cipher.final('hex')
}

http.interceptors.request.use(async (req) => {
  req.headers.token = await sign(req.tokenId)
  return req
})
http.interceptors.response.use(
  (res) => {
    if (res.data?.result === 1) {
      return res.data.data
    }
    logger.error({
      kvPairs: {
        url: res.config.url,
        status: res.status,
        statusText: res.statusText,
        data: JSON.stringify(res.data || null),
        requestHeaders: JSON.stringify(res.config.headers || null)
      }
    })
    return Promise.reject(new Error(res.data.data))
  },
  (err) => {
    const data = { err }
    if (axios.isAxiosError(err)) {
      data.kvPairs = {
        url: err.config.url,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: JSON.stringify(err.response?.data || null),
        headers: JSON.stringify(err.response?.headers || null),
        requestHeaders: JSON.stringify(err.config.headers || null)
      }
    }
    logger.error(data)
    return Promise.reject(err)
  }
)

export function createProject (apis, data) {
  return http.post('/project/add', {
    ...data,
    userName: this.sso.userName,
    enterFrom: 'productPlanet'
  })
}

export function createSource (apis, data) {
  return http.post('/source/add', {
    dataType: DefaultSourceDataType,
    dataFormat: DefaultSourceDataFormat,
    data: DefaultSourceData,
    ...data,
    userName: this.sso.userName,
    enterFrom: 'productPlanet'
  })
}

export function updateSource (apis, data) {
  return http.post(
    '/source/update',
    {
      dataType: DefaultSourceDataType,
      ...data,
      userName: this.sso.userName,
      enterFrom: 'productPlanet'
    },
    { tokenId: data.sourceId }
  )
}

export function saveSource (apis, data) {
  return http.post(
    '/source/save',
    {
      dataType: DefaultSourceDataType,
      ...data,
      userName: this.sso.userName,
      enterFrom: 'productPlanet'
    },
    { tokenId: data.sourceId }
  )
}

export function getSource (apis, sourceId) {
  return http.get('/source/item', {
    params: {
      sourceId,
      userName: this.sso.userName,
      enterFrom: 'productPlanet'
    },
    tokenId: sourceId
  })
}

export function createPublish (apis, data) {
  return http.post('/publish/add', {
    storageType: 2,
    compositionType: 1,
    ...data,
    userName: this.sso.userName,
    enterFrom: 'productPlanet'
  })
}

export function updatePublish (apis, data) {
  return http.post(
    '/publish/update',
    {
      compositionType: 1,
      publishOrder: 1,
      updateDesc: '从产品星球修改',
      ...data,
      stage: config.service.firefly.stage,
      userName: this.sso.userName,
      enterFrom: 'productPlanet'
    },
    { tokenId: data.publishId }
  )
}

export function getPublish (apis, publishId) {
  return http.get('/publish/item', {
    params: {
      publishId,
      stage: config.service.firefly.stage,
      userName: this.sso.userName,
      enterFrom: 'productPlanet'
    },
    tokenId: publishId
  })
}

export function createFolder (apis, data) {
  return http.post('/folder/add', {
    folderType: 1,
    ...data,
    userName: this.sso.userName,
    enterFrom: 'productPlanet'
  })
}

export function updateFolder (apis, data) {
  return http.post(
    '/folder/update',
    {
      ...data,
      userName: this.sso.userName,
      enterFrom: 'productPlanet'
    },
    { tokenId: data.folderId }
  )
}

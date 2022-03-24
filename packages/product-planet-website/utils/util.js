import { ProductVersion } from '@/models'
import { setCurrentProduct } from '@/store/Product'
import { getObjectPreviewUrl } from '@/services/product'

/**
 * @description 更新当前全局version和product
 * @param {{value?: {
 * id: number,
 * name: string,
 * status: number,
 * description: string,
 * product: {
 *  [key:string]: any
 * }
 * }}} version 当前version
 * @param {number} versionId  兼容version还没有值的情况
 * @return {*}
 */
export const updateProductVersion = async (version, versionId) => {
  const id = versionId || version?.value?.id
  if (!id || typeof version !== 'object') return
  ProductVersion.findOne({
    where: {
      id
    },
    fields: ['id', 'name', 'status', 'description', 'product', 'teamSectionId', 'base', 'currentStatus', 'groups']
  }).then((res) => {
    if (res.product) {
      const { logoBucket, logoPath } = res.product
      if (logoBucket && logoPath) {
        getObjectPreviewUrl(logoBucket, logoPath).then(url => {
          res.product.logoUrl = url
          setCurrentProduct(Object.assign({}, res))
        })
      }
    }
    setCurrentProduct(res)
    version.value = res

    ProductVersion.findOne({
      where: {
        product: res.product.id,
        currentStatus: 'undone'
      },
      fields: ['id']
    }).then(undoneVersion => {
      if (undoneVersion) {
        setCurrentProduct(Object.assign({}, res, { undoneVersion }))
      }
    })
  })
}

// 将base64转换为文件
export const base64ToFile = (dataurl, filename) => {
  // 获取到base64编码
  const arr = dataurl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  // 将base64编码转为字符串
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

export function parseSearch (search) {
  return search
    ? search.slice(1).split('&').reduce((last, currentPair) => {
      const current = currentPair.split('=')
      return {
        ...last,
        [current[0]]: current[1] || true
      }
    }, {})
    : {}
}

export const getEnv = () => {
  const { hostname, port } = location
  if (hostname === 'localhost') return 'local'
  return 'prod'
}

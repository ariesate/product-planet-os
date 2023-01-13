export function useLcpConfig () {
  const isProductEnv = true// 是否生产环境
  const lcdpUrl = isProductEnv ? '' : ''
  return {
    lcdpUrl
  }
}

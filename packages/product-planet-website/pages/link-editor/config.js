export function useLcpConfig () {
  const isProductEnv = window.location.host === 'product-planet.corp.kuaishou.com'// 是否生产环境
  const lcdpUrl = isProductEnv ? 'https://lcp.corp.kuaishou.com' : 'https://qianxiang-3.test.gifshow.com'
  return {
    lcdpUrl
  }
}

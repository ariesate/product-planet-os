import config from '../config/index.js'

export function getConfig () {
  return {
    /**
     * 环境类型
     */
    env: config.env,
    /**
     * 当前域名(只在容器云)
     */
    domain: config.server.domain,
    /**
     * 千象域名
     */
    lcdpDomain: config.service.lcdpDomain
  }
}

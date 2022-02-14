import * as figma from './figma.api.js'

/**
 * 获取页面结构
 * @TODO: 部分结构获取写在了figma中，在page里也索引一下
 * @export
 * @param {API.ER_APIs} apis
 */
export async function getPageDetail (apis, param) {
  return figma.getPageDetail(apis, param)
}

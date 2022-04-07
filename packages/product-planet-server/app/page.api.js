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

export async function findPartial (apis, { versionId, groupId }) {
  const r = await apis.findPartial(
    'Page',
    { versionId, groupId },
    { limit: null },
    undefined,
    [['modifiedAt', 'desc']]
  )
  const pagesWithoutName = r.filter((p) => !p.name)
  const originPages = await apis.find(
    'Page',
    pagesWithoutName.map((p, i) => ({
      method: i === 0 ? 'where' : 'orWhere',
      children: [['id', '=', p.versionOriginId]]
    })),
    { limit: null },
    { id: true, name: true }
  )

  const result = r.map((pp) => {
    const originPage = originPages.find((p) => p.id === pp.versionOriginId)
    if (originPage) {
      Object.assign(pp, { name: originPage.name })
    }
    Object.assign(pp, { id: pp.versionOriginId })
    return pp
  })
  return result
}

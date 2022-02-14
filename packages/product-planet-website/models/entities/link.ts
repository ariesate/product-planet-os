import {
  Entity as E,
  EntityInputData,
  EntityModel,
  Field as F,
  Relation as R
} from '../entity'
import { LinkPort } from './linkPort'
import { Page } from "./page"

@E('Link')
export class Link extends EntityModel {
  @R(() => LinkPort, 'n:1', true)
  source?: number | LinkPort

  @R(() => LinkPort, 'n:1', true)
  target?: number | LinkPort

  @F
  name?: string

  @F
  type?: string

  @R(() => Page, '1:n')
  page?: number | Page;

  @F
  visible?: boolean

  /**
   * 获取link
   */
  static getLinks() {
    return Link.find({ fields: ['id', 'name', 'type', 'source', 'target', 'visible'] })
  }

  /**
   * 创建link
   */
  static async createLink(
    rawSource: EntityInputData<LinkPort>,
    rawTarget: EntityInputData<LinkPort>
  ) {
    const rawLink = { name: 'new link', type: 'push', page: rawSource.page }
    const [sourceId, targetId, linkId] = await Promise.all([
      LinkPort.create(rawSource),
      LinkPort.create(rawTarget),
      Link.create(rawLink)
    ])
    const source = new LinkPort({ ...rawSource, id: sourceId })
    const target = new LinkPort({ ...rawTarget, id: targetId })
    const link = new Link({ ...rawLink, id: linkId })
    await Promise.all([
      link.addRelation('source', source),
      link.addRelation('target', target)
    ])
    Object.assign(link, { source, target })
    return link
  }
}

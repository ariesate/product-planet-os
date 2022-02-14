import request from '@/tools/request'
import {
  Entity as E,
  EntityInputData,
  EntityModel,
  Field as F,
  Relation as R
} from '../entity'
import { Chunk } from './chunk'
import { Link } from "./link"
import { Navigation } from './navigation'
import { PageStatus } from './pageStatus'
import { Param } from './param'
import { ProductVersion } from './productVersion'
import { UserPage } from "./userPage"

@E('Page')
export class Page extends EntityModel {
  @F
  name?: string

  @R(() => ProductVersion, '1:n')
  version?: number | ProductVersion

  @R(() => Navigation, 'n:1')
  navigation?: Navigation[]

  @R(() => Param, '1:n', true)
  params: Param[]

  @R(() => Chunk, 'n:n', true)
  chunks?: Chunk[]

  @R(() => PageStatus, '1:n', true)
  statusSet?: PageStatus[]

  @R(() => Navigation, 'n:n', true)
  navbars: Navigation[]

  @F
  posX?: number

  @F
  posY?: number

  @R(() => PageStatus, '1:1')
  baseStatus?: number | PageStatus;

  @R(() => Link, '1:n', true)
  links?: Link[];

  @R(() => UserPage, '1:n', true)
  users?: UserPage[];

  @F
  lcdpId?: number;

  @F
  key?: string;

  @F
  path?: string;

  @F
  designPreviewUrl?: string;

  @F
  dollyId?: number;

  @F
  tasks?: string;

  @F
  isHide?: boolean;

  @F
  hideChildren?: boolean;

  @F
  forceRefresh?: boolean;

  @F
  childrenNum?: number;

  static getPages(version) {
    return this.find({
      fields: [
        'id',
        'name',
        'params',
        'navbars',
        'statusSet',
        'baseStatus',
        'posX',
        'posY',
        'isHide',
        'hideChildren',
        'forceRefresh',
        'childrenNum'
      ],
      where: { version: { id: version } }
    })
  }

  setData(data: any) {
    super.setData(data)
    const { baseStatus_id, baseStatus_name, baseStatus_proto } = data
    if (baseStatus_id) {
      this.baseStatus = new PageStatus({
        id: baseStatus_id,
        name: baseStatus_name,
        proto: baseStatus_proto
      })
    }
  }

  static async createPage(data: EntityInputData<Page>) {
    const baseStatus = { name: '默认状态' }
    const [pageId, statusId] = await Promise.all([
      Page.create(data),
      PageStatus.create(baseStatus)
    ]);
    const status = new PageStatus({ ...baseStatus, id: statusId })
    const page = new Page({ ...data, id: pageId })
    await Promise.all([
      page.addRelation('statusSet', status),
      page.addRelation('baseStatus', status),
      page.update({ key: `page${pageId}`, path: `/page-${pageId}`}),
    ]);
    page.statusSet = [status]
    page.baseStatus = status
    return page
  }

  static async createLcdp({versionId, pageId}) {
    const { data } = await request.post('/api/lcdp/createLcdp', {
      argv: [{versionId, pageId}]
    })
    return data
  }

  async addStatus(data: EntityInputData<PageStatus>) {
    const id = await PageStatus.create(data)
    const status = new PageStatus({ ...data, id })
    await this.addRelation('statusSet', status)
    return status
  }

  async addParam(data: EntityInputData<Param>) {
    const id = await Param.create(data)
    const param = new Param({ ...data, id })
    await this.addRelation('params', param)
    return param
  }
}

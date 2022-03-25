import { isUndone } from '@/pages/version-partial/util'
import request from '@/tools/request'
import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { Chunk } from './chunk'
import { Navigation } from './navigation'
import { Page } from './page'
import { Product } from './product'
import { Resource } from './resource'
import { Rule } from './rule'
import { UseCase } from "./useCase"
import { User } from './user'
import { VersionGroup } from "./versionGroup"
import { VersionStatus } from './versionStatus'
import { ModelGroup } from './modelGroup'

@E('ProductVersion')
export class ProductVersion extends EntityModel {
  @F
  name?: string

  @F
  description?: string

  @F
  notice?: string

  type?: string

  @R(() => VersionStatus, 'n:1', true)
  status?: number | VersionStatus

  @R(() => User, '1:n')
  creator?: number | User

  @R(() => Product, '1:n')
  product?: number | Product

  @R(() => Resource, '1:n', true)
  resources?: Resource[]

  @R(() => Page, '1:n', true)
  pages?: Page[]

  @R(() => Navigation, '1:n', true)
  navigations?: Navigation[]

  @R(() => Chunk, '1:n', true)
  chunks?: Chunk[]

  
  @R(() => Rule, '1:n', true)
  rules?: Rule[]

  @R(() => UseCase, '1:n', true)
  useCases?: UseCase[];

  @F
  teamSectionId?: string;

  @F
  nodeMode?: string
  
  @F
  hideExternal?: boolean

  @R(() => ModelGroup, '1:n', true)
  modelGroup?: ModelGroup[]

  static createTeamGroup = async ({productId, versionId, teamSectionName, teamProjectId}) => {
    const { data } = await request.post('/api/team/createGroup', {
      argv: [{productId, versionId, teamSectionName, teamProjectId}]
    })
    return data
  }


  static startNewVersion = async ({ productId, ...args }) => {
    const { data } = await request.post('/api/productVersion/startNewVersion', {
      argv: [
        {
          product: productId,
          ...args
        }
      ]
    })
    return (data as { result: { id: number } }).result
  }
  // 判断当前的版本状态是否是进行中
  static isUndone = async () => {
    const pathArr = location.pathname.split('/').filter(Boolean)
    if (pathArr[0] === 'product' && pathArr[2] === 'version') {
      const versionId = parseInt(pathArr[3])
      const r = await ProductVersion.findOne({ where: { id: versionId } })
      return isUndone(r)
    }
  }

    @F
    currentStatus?: string;

    @F
    base?: number;

    @R(() => VersionGroup, '1:n', true)
    groups?: VersionGroup[];
}

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
import { VersionStatus } from './versionStatus'


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

  static createTeamGroup = async ({productId, versionId, teamSectionName, teamProjectId}) => {
    const { data } = await request.post('/api/team/createGroup', {
      argv: [{productId, versionId, teamSectionName, teamProjectId}]
    })
    return data
  }
}

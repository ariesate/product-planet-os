import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { MetaGroup } from './metaGroup'

@E('Meta')
export class Meta extends EntityModel {
  key?: string

  @F
  name?: string

  @F
  sourceId?: number

  @R(() => MetaGroup, '1:n')
  group?: number | MetaGroup
}

import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { MetaGroup } from './metaGroup'

@E('Meta')
export class Meta extends EntityModel {
  @F
  name?: string

  @R(() => MetaGroup, '1:n')
  group?: number | MetaGroup

  @F
  content?: string
}

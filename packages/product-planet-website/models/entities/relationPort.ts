import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { Relation } from './relation'

@E('RelationPort')
export class RelationPort extends EntityModel {
  @F
  entity?: number

  @F
  field?: number

  @F
  side?: string

  @R(() => Relation, 'n:1')
  relation?: Relation[]
}

import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { Entity } from './entity'

@E('Field')
export class Field extends EntityModel {
  @F
  name?: string

  @F
  type?: string

  @F
  isCollection?: boolean

  @R(() => Entity, '1:n')
  entity?: number | Entity
}

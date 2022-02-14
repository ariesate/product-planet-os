import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { User } from './user'

@E('Organization')
export class Organization extends EntityModel {
  @F
  name?: string

  @R(() => User, '1:n')
  users?: number | User
}

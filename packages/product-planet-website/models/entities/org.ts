import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { Product } from './product'
import { User } from './user'

@E('Org')
export class Org extends EntityModel {
  @F
  name?: string

  @R(() => User, 'n:n')
  users?: User[]

  @R(() => User, '1:n', true)
  members?: User[]

  @R(() => Product, '1:n', true)
  products?: Product[]
}

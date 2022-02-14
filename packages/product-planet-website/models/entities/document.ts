import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { Product } from './product'
import { User } from './user'

@E('Document')
export class Document extends EntityModel {
  @F
  name?: string

  @F
  content?: string

  @R(() => Product, '1:n')
  product?: number | Product

  @R(() => User, '1:n')
  creator?: number | User
}

import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { Field } from './field'
import { Product } from "./product"

@E('Entity')
export class Entity extends EntityModel {
  @F
  name?: string

  @R(() => Field, '1:n', true)
  fields?: Field[]

  @F
  posX?: number

  @F
  posY?: number

  @F
  groupId?: number

  @R(() => Product, '1:n')
  product?: number | Product;
}

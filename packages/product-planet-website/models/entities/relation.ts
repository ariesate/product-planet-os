import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { Product } from "./product"
import { RelationPort } from './relationPort'

@E('Relation')
export class Relation extends EntityModel {
  @F
  name?: string

  @F
  type?: string

  @R(() => RelationPort, 'n:1', true)
  source?: number | RelationPort

  @R(() => RelationPort, 'n:1', true)
  target?: number | RelationPort

    @R(() => Product, '1:n')
    product?: number | Product;
}

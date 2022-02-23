import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { Meta } from './meta'
import { Product } from './product'

@E('MetaGroup')
export class MetaGroup extends EntityModel {
  @F
  name?: string

  @R(() => Meta, '1:n', true)
  children?: Meta[]

  @R(() => Product, '1:n')
  product?: number | Product

  @F
  url?: string
}

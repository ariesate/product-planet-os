import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { Codebase } from './codebase'
import { Document } from './document'
import { Entity } from './entity'
import { MetaGroup } from './metaGroup'
import { Org } from './org'
import { ProductVersion } from './productVersion'
import { User } from './user'
import { UserProduct } from './userProduct'

@E('Product')
export class Product extends EntityModel {
  @R(() => User, '1:n')
  creator?: number | User

  @F
  name?: string

  @F
  description?: string

  @R(() => UserProduct, '1:n', true)
  members?: UserProduct[]

  @R(() => ProductVersion, '1:n', true)
  versions?: ProductVersion[]

  @R(() => Product, '1:n', true)
  children?: Product[]

  @R(() => Product, '1:n')
  parent?: number | Product

  @R(() => Entity, '1:n', true)
  entities?: Entity[]

  codebaseId?: number

  @R(() => Codebase, '1:1', true)
  codebase?: number | Codebase

  @R(() => MetaGroup, '1:n', true)
  metGroups?: MetaGroup[]

  @R(() => Document, '1:n', true)
  documents?: Document[]

  @R(() => Org, '1:n')
  org?: number | Org

  @F
  logo?: string
}

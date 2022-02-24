import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { Document } from './document'
import { Org } from './org'
import { Product } from './product'
import { ProductVersion } from './productVersion'
import { Resource } from './resource'
import { Task } from './task'
import { UserPage } from './userPage'

@E('User')
export class User extends EntityModel {
  @F
  name: string

  @F
  email: string

  @F
  avatar?: string

  @F
  position?: string

  @F
  department?: string

  @R(() => Resource, '1:n', true)
  resources?: Resource[]

  @R(() => ProductVersion, '1:n', true)
  versions?: ProductVersion[]

  @R(() => Product, '1:n', true)
  products?: Product[]

  @F
  displayName?: string

  @R(() => UserPage, '1:n', true)
  pages?: UserPage[]

  @R(() => Document, '1:n', true)
  documents?: Document[]

  @R(() => Task, '1:n', true)
  assignTasks?: Task[]

  @R(() => Task, '1:1', true)
  reportTasks?: number | Task

  @R(() => Task, '1:1', true)
  createTasks?: number | Task

  @F
  password?: string

  @R(() => Org, 'n:n', true)
  orgs?: Org[]

  @F
  salt?: string

  @R(() => Org, '1:n')
  org?: number | Org

  @R(() => Org, '1:n', true)
  ownedOrgs?: Org[]
}

import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { Link } from './link'

@E('LinkPort')
export class LinkPort extends EntityModel {
  @F
  name?: string

  @F
  page?: number

  @F
  status?: number

  @R(() => Link, 'n:1')
  link?: Link[]
}

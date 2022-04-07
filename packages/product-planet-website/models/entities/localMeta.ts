import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { ProductVersion } from './productVersion'

@E('LocalMeta')
export class LocalMeta extends EntityModel {
  @F
  name?: string

  @F
  desc?: string

  @F
  type?: string

  @F
  editor?: string

  @F
  content?: string

  @R(() => ProductVersion, '1:n')
  version?: number | ProductVersion
}

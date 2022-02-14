import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { ProductVersion } from './productVersion'

@E('VersionStatus')
export class VersionStatus extends EntityModel {
  @F
  name?: string

  @F
  order?: number

  @R(() => ProductVersion, 'n:1')
  version?: ProductVersion[]
}

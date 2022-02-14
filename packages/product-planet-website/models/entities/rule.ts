import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { ProductVersion } from './productVersion'

@E('Rule')
export class Rule extends EntityModel {
  @F
  name?: string

  @F
  key?: string

  @F
  content?: string

  @R(() => ProductVersion, '1:n')
  version?: number | ProductVersion

  @F
  description?: string

  @F
  type?: string

  @F
  editor?: string
}

import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { ProductVersion } from './productVersion'

@E('ModelGroup')
export class ModelGroup extends EntityModel {
  @F
  name: string;
  
  @R(() => ProductVersion, '1:n')
  version?: number | ProductVersion

  @F
  centerX?: number;

  @F
  centerY?: number;
}

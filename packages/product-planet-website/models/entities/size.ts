import { Entity as E, EntityModel, Field as F } from '../entity'

@E('Size')
export class Size extends EntityModel {
  @F
  width?: number;
  @F
  height?: number;
}

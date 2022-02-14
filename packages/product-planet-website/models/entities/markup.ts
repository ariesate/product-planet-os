import { Entity as E, EntityModel, Field as F, Relation as R } from "../entity"
import { PagePin } from "./pagePin"

@E('Markup')
export class Markup extends EntityModel {
  @F
  name?: string;

  @F
  content?: string;

  @R(() => PagePin, '1:n', true)
  pins?: PagePin[];
}

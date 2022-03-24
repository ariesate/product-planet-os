import { Entity as E, EntityModel, Field as F, Relation as R } from "../entity"
import { PagePin } from "./pagePin"

@E('Tips')
export class Tips extends EntityModel {

    @F
    content?: string;

    @F
    fontSize?: number;

    @F
    color?: string;

    @R(() => PagePin, '1:1')
    pin?: number | PagePin;
}

import { Entity as E, EntityModel, Field as F, Relation as R } from "../entity"
import { PageStatus } from "./pageStatus"

@E('ProtoDraft')
export class ProtoDraft extends EntityModel {

    @R(() => PageStatus, '1:1')
    pageStatus?: number | PageStatus;

    @F
    protoNodes?: string;

    @F
    imgSrc?: string;
}

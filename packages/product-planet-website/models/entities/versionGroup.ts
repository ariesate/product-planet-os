import { Entity as E, EntityModel, Field as F, Relation as R } from "../entity"
import { ProductVersion } from "./productVersion"

@E('VersionGroup')
export class VersionGroup extends EntityModel {

    @R(() => ProductVersion, '1:n')
    version?: number | ProductVersion;

    @F
    name?: string;
}

import { Entity as E, EntityModel, Field as F, Relation as R } from "../entity"
import { Page } from "./page"
import { User } from "./user"

@E('UserPage')
export class UserPage extends EntityModel {

    @R(() => User, '1:n')
    user?: number | User;

    @R(() => Page, '1:n')
    page?: number | Page;

    @F
    role?: string;
}

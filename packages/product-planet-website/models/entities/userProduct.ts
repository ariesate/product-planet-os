import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { Product } from './product'
import { User } from './user'

@E('UserProduct')
export class UserProduct extends EntityModel {
  @R(() => User, '1:n')
  user?: number | User

  @R(() => Product, '1:n')
  product?: number | Product

  @F
  role?: string

  @F
  lastVisit?: number

  static getMembers = async (
    id: Partial<Omit<UserProduct, keyof EntityModel>>
  ) => {
    const list = await UserProduct.find({
      where: { product: id },
      fields: {
        id: true,
        user: { name: true, avatar: true, displayName: true },
        role: true
      }
    }).then((res) => {
      const members = (res || []).map((item: any) => {
        return {
          ...item,
          ...item.user
        }
      })
      return members
    })
    return list
  }
}

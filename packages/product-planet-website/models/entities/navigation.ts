import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { Page } from './page'
import { ProductVersion } from './productVersion'

@E('Navigation')
export class Navigation extends EntityModel {
  @F
  name?: string

  @F
  order?: number

  @R(() => Page, 'n:1', true)
  page?: number | Page

  @F
  href?: string

  @R(() => ProductVersion, '1:n')
  version?: number | ProductVersion

  @F
  type?: string

  @R(() => Navigation, '1:n')
  parent?: number | Navigation

  @R(() => Navigation, '1:n', true)
  children?: Navigation[]

  @R(() => Page, 'n:n')
  pages?: Page[]

  expanded?: boolean

  checked?: boolean

  setData(data: any) {
    super.setData(data)
    this.sortChildren()
  }

  protected sortChildren() {
    this.children?.sort((a: Navigation, b: Navigation) => a.order - b.order)
  }

  /**
   * 加载子节点
   */
  async loadChildren() {
    if (!this.children) {
      this.children = await Navigation.find({
        where: {
          parent: this.id
        },
        fields: ['id', 'name', 'type', 'order', 'page']
      })
      this.sortChildren()
    }
  }

  static getNavbars(id: number) {
    return this.find({ where: { type: 'root', version: { id } } })
  }
}

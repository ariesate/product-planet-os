import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { Page } from './page'
import { Param } from './param'
import { ProductVersion } from './productVersion'

@E('Chunk')
export class Chunk extends EntityModel {
  @F
  name?: string

  @R(() => ProductVersion, '1:n')
  version?: number | ProductVersion

  @R(() => Page, 'n:n')
  pages?: Page[]

  @R(() => Param, '1:n', true)
  params?: Param[]

  /**
   * 添加页面
   * @param page 页面
   */
  async addPage(page: Page) {
    const id = await this.addRelation('pages', page)
    if (id) {
      this.pages.push(page)
    }
  }

  /**
   * 移除页面
   * @param page 页面
   */
  async removePage(page: Page) {
    const count = await this.removeRelation('pages', page)
    if (count && this.pages?.length) {
      const index = this.pages.findIndex((e) => e.id === page.id)
      if (index >= 0) {
        this.pages.splice(index, 1)
      }
    }
  }
}

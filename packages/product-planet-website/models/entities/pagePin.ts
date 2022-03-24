import { Entity as E, EntityModel, Field as F, Relation as R } from "../entity"
import { Action } from "./action"
import { Markup } from "./markup"
import { PageStatus } from "./pageStatus"
import { Tips } from "./tips"

@E('PagePin')
export class PagePin extends EntityModel {
  @F
  x?: number;

  @F
  y?: number;

  @F
  width?: number;

  @F
  height?: number;

  @R(() => Markup, '1:n')
  markup?: number | Markup;

  @R(() => Action, '1:n')
  action?: number | Action;

  @R(() => PageStatus, '1:n')
  pageStatus?: number | PageStatus;

  @F
  type?: string;

  setData(data) {
    super.setData(data)
    const { markup_id, markup_name, markup_content, pageStatus_id } = data
    if (markup_id) {
      this.markup = new Markup({ id: markup_id, name: markup_name, content: markup_content, pins: [this] })
    }
    if (pageStatus_id) {
      this.pageStatus = pageStatus_id
    }
  }

  updateTips(content) {
    const myTips = this.tips as Tips
    if (!content) {
      // 没有内容的 tips 连同 pin 直接删除，因为一旦 blur 就不可见了，无法编辑
      if (myTips.id) {
        Tips.remove(myTips.id)
      }
      return PagePin.remove(this.id)
    } else {
      myTips.pin = this.id
      myTips.content = content
      return myTips.save()
    }
  }

    @R(() => Tips, '1:1', true)
    tips?: number | Tips;
}

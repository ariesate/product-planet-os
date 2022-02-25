import api from '@/services/api'
import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { Page } from './page'
import { PagePin } from './pagePin'
import { ProtoDraft } from './protoDraft'

@E('PageStatus')
export class PageStatus extends EntityModel {
  @F
  name?: string

  @F
  x?: number

  @F
  y?: number

  @F
  proto?: string

  @F
  prevId?: number

  @R(() => Page, '1:n')
  page?: number | Page

  @R(() => Page, '1:1', true)
  basePage?: number | Page

  @R(() => PagePin, '1:n', true)
  pins?: PagePin[]

  async updateProto(this: PageStatus, title: string, data: Blob) {
    const url = await api.$upload(data, title)
    this.update({ proto: url })
    return url
  }

  @R(() => ProtoDraft, '1:1', true)
  protoDraft?: number | ProtoDraft

  @F
  designPreviewUrl?: string

  @F
  width?: number

  @F
  height?: number
}

import request from '@/tools/request'
import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { Page } from './page'
import { PagePin } from "./pagePin"
import { ProtoDraft } from "./protoDraft"

@E('PageStatus')
export class PageStatus extends EntityModel {
  @F
  name?: string

  @F
  x?: number;

  @F
  y?: number;

  @F
  proto?: string

  @F
  prevId?: number

  @R(() => Page, '1:n')
  page?: number | Page

  @R(() => Page, '1:1', true)
  basePage?: number | Page;

  @R(() => PagePin, '1:n', true)
  pins?: PagePin[]

  updateProto(title: string, data: Blob) {
    const formData = new FormData()
    formData.append('file', data)
    formData.append('title', title)
    formData.append('id', `${this.id}`)
    return request.post('/api/updateProto', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then((res: any) => res?.data?.result)
  }


  @R(() => ProtoDraft, '1:1', true)
  protoDraft?: number | ProtoDraft;

  @F
  designPreviewUrl?: string;
}

import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { Chunk } from './chunk'
import { Page } from './page'

@E('Param')
export class Param extends EntityModel {
  @F
  name?: string

  @F
  type?: string

  @R(() => Chunk, '1:n')
  chunk?: number | Chunk

  @R(() => Page, '1:n')
  page?: number | Page
}

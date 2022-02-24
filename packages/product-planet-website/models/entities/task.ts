import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { TaskLabel } from './taskLabel'
import { User } from './user'

@E('Task')
export class Task extends EntityModel {
  @F
  productId: number
  @F
  versionId: number
  @F
  taskName: string
  @F
  statusName: string
  @F
  statusId: number
  @F
  priorityName: string
  @F
  priorityId: number
  @F
  title: string
  @F
  description: string

  @R(() => User, '1:n')
  assignee?: number | User

  @R(() => User, '1:1')
  reporter?: number | User

  @R(() => User, '1:1')
  creator?: number | User

  @F
  taskClassName: string

  @F
  taskClass: number

  @R(() => TaskLabel, '1:n')
  labelModels?: number | TaskLabel

  @F
  classId?: number
}

@E('TaskLabel')
export class Label extends EntityModel {
  @F
  name: string
  @F
  color: string
  @R(() => Task, '1:n', true)
  tasks?: Task[]
}

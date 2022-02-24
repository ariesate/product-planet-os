import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { Task } from './task'

@E('TaskLabel')
export class TaskLabel extends EntityModel {
  @F
  name?: string

  @F
  color?: string

  @R(() => Task, '1:n', true)
  tasks?: Task[]
}

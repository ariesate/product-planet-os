import { Entity as E, EntityModel, Field as F, Relation as R } from '../entity'
import { User } from './user'

@E('Task')
export class Task extends EntityModel {
  @F
  productId: number;
  @F
  versionId: number;
  @F
  taskName: string;
  @F
  statusName: string;
  @F
  statusId: number;
  @F
  priorityName: string;
  @F
  priorityId: number;
  @F
  title: string;
  @F
  description: string;
  @F
  classId: number;

  @R(() => User, '1:n', true)
  assignee?: number | User;

  @R(() => User, '1:n', true)
  reporter?: number | User;

  @F
  taskClassName: string;

  @F
  taskClass: number;

  @R(() => Label, '1:n', true)
  labelModels?: Label[];
}

@E('TaskLabel')
export class Label extends EntityModel {
  @F
  name: string;
  @F
  color: string;
  @R(() => Task, '1:n', true)
  tasks?: Task[]
}

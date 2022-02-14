import { Entity as E, EntityModel, Field as F } from '../entity'

@E('TaskLink')
export class TaskLink extends EntityModel {
  @F
  pageId?: number;
  @F
  useCaseId?: number;
  @F
  taskId: string;
  @F
  versionId: number;
}

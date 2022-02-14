import request from '@/tools/request'
import { ObjectToFormData } from '@/tools/transform'
import { Entity as E, EntityModel, Field as F, Relation as R } from "../entity"
import { Action } from "./action"
import { ProductVersion } from "./productVersion"



@E('UseCase')
export class UseCase extends EntityModel {
  @F
  name?: string;

  @F
  taskId?: string;

  @R(() => ProductVersion, '1:n')
  version?: number | ProductVersion;

  @R(() => Action, '1:n', true)
  actions?: Action[];

  static async findWithActions (id: number): Promise<any> {
    const { data } = await request.post('/api/useCase/getTimeline', ObjectToFormData({
      id
    })) as any
    return data.result
  }
}

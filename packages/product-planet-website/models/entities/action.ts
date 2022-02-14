import { Entity as E, EntityInputData, EntityModel, Field as F, Relation as R } from "../entity"
import { PagePin } from "./pagePin"
import { UseCase } from "./useCase"

@E('Action')
export class Action extends EntityModel {
  @R(() => PagePin, '1:n', true)
  pins?: PagePin[];

  @F
  triggerType?: string;

  @F
  destinationType?: string;

  @F
  destinationValue?: number;

  @R(() => UseCase, '1:n')
  useCase?: number | UseCase;

  @F
  index?: number;

  static async createWithPin(d: EntityInputData<Action>, pins: EntityInputData<PagePin>[]) {
    const actionIns = new Action(d)
    await actionIns.save()
    
    await Promise.all(pins.filter(Boolean).map(p => new PagePin(p)).map(async (pinIns) => {
        await actionIns.addRelation('pins', pinIns)
    }))
    return actionIns.id
  }
}

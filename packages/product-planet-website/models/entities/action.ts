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

  
  triggerValue?: string;
  
  static async createWithPins(d: EntityInputData<Action>, pins: EntityInputData<PagePin>[]) {
    const actionIns = new Action(d)
    await actionIns.save()

    await Promise.all(pins.filter(Boolean).map(p => new PagePin(p)).map(async (pinIns) => {
        await actionIns.addRelation('pins', pinIns)
    }))
    return actionIns.id
  }

  static async removeWithPins (id) {
    const [r] = await Action.find({
      where: { id },
      fields: ['id', 'pins']
    })
    if (r) {
      await Action.remove(r.id)
      await Promise.all(r.pins.map(async (p) => {
        await PagePin.remove(p.id)
      }))  
    }
  }


    
    prevId?: number;
}

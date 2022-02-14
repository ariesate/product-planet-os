import { Entity as E, EntityInputData, EntityModel, Field as F } from "../entity"

export const projectActionCode = {
  design: 'design',
  fe: 'frontend',
  be: 'backend',
  pd: 'pd',
  any: 'any',
};

enum EStatus {
  DONE = 'DONE',
  UNDONE = 'UNDONE',
  UPDATE = 'UPDATE',
}

@E('LogMessage')
export class LogMessage extends EntityModel {
  @F
  productId?: number;
  
  @F
  pageId?: number;
  
  @F
  type?: string;
  
  @F
  action?: string;
  
  @F
  member?: string;
  
  @F
  value?: string;

  static async getPageProcess(data: EntityInputData<LogMessage>) {
    const processMap = {
      [projectActionCode.design]: false,
      [projectActionCode.fe]: false,
    };

    const designMessages = await LogMessage.find({
      where: { pageId: data.pageId, type: 'project', action: projectActionCode.design },
      orders: [['createdAt', 'desc']]
    });
    const feMessages = await LogMessage.find({
      where: { pageId: data.pageId, type: 'project', action: projectActionCode.fe },
      orders: [['createdAt', 'desc']]
    });

    processMap[projectActionCode.design] = designMessages[0] && designMessages[0].value === EStatus.DONE;
    processMap[projectActionCode.fe] = feMessages[0] && feMessages[0].value === EStatus.DONE;

    return processMap;
  }
}

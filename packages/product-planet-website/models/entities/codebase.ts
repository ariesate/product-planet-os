import request from '@/tools/request'
import { Entity as E, EntityModel, Field as F, Relation as R } from "../entity"
import { Product } from "./product"

@E('Codebase')
export class Codebase extends EntityModel {

    @R(() => Product, '1:1')
    product?: number | Product;

    @F
    projectId?: number;

    @F
    projectUrl?: string;

    @F
    pagePath?: string;

    @F
    pageType?: string;

    @F
    metadataPath?: string;

    @F
    projectName?: string;

    @F
    targetBranch?: string;

    /**
     * @description 同步代码
     * @param {{productId: number, versionId: number, productName: string}} product
     * @param {{projectId: number, targetBranch: string, pageType: string, pagePath: string, metadataPath:string}} codebase
     * @return {*}
     */    
    static updateCodebase = async (product = {}, codebase = {}) => {
        const { data } = await request.post('/api/updateCodebase', {
          argv: [product, codebase]
        })
        return data
      }

      static createGitProject = async ({name, id }) => {
        const { data } = await request.post('/api/createCodebase', {
          argv: [{name, id }]
        })
        return data
      }
}

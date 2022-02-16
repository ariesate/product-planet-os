declare namespace API {
  export interface BaseFn<P = unknown, R = unknown>  {
    (ER_APIs, P): Promise<R>
  }

  export interface ER_APIs {
    create: (entityName: string, rawValue: unknown) => Promise<{id: string, [key: string]: unknown}>
    count: (entityName: string, rawValue: unknown) => Promise<unknown>
    createOrUpdate: (entityName: string, rawWhere: string | object, value: unknown) => Promise<unknown>
    createRelation: (entityName: string, selfId: string, oppositeId: string, fields: object) => Promise<number | number[]>
    find: (
      entityName: string,
      rawWhere: string | object,
      viewPort: {
        limit: number,
        offset: number
      },
      rawFields: object,
      orders: [
       string,
       'asc' | 'desc',
       'first' | 'last'
      ][],
      groupBy: unknown
    ) => Promise<unknown>
    findRelation: (entityField: string, selfId: string, oppositeId: string, fields: unknown) => unknown
    remove: (entityName: string, id: string) => Promise<number>
    removeRelation: (entityField: string, selfId: string, oppositeId: string) => Promise<number>
    update: (entityName: string, idOrRawWhere: string | object, rawValue: object) => unknown
    updateRelation: () => void
  }

  export interface This {
    effect: Function[]
    user?: {
      id: number
    },
    sso?: {
      avatar?: string
      displayName: string
      mail: string
      userName: string
    }
    [key: string]: unknown
  }
}

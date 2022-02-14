import request from '@/tools/request'

type InternalFields =
  | 'setData'
  | 'update'
  | 'save'
  | 'refresh'
  | 'destroy'
  | 'addRelation'
  | 'removeRelation'
export interface QueryOptions<T> {
  where?: QueryOptions.WhereOptions<QueryOptions.Queriable<T>>
  fields?: QueryOptions.SelectOptions<QueryOptions.Queriable<T>>
  orders?: QueryOptions.OrderByOptions<QueryOptions.Queriable<T>>
  groupBy?: string
  limit?: number
  offset?: number
}
export declare namespace QueryOptions {
  type Queriable<T> = Omit<T, InternalFields>
  type WhereField<T> =
    | [keyof T, any]
    | [keyof T, string, any]
    | { method: string; children: WhereOptions<T> }
  type WhereOptions<T> =
    | {
        [K in keyof T]?: any
      }
    | WhereField<T>[]
  type SelectOptions<T> =
    | {
        [K in keyof T]?: boolean | SelectOptions<any>
      }
    | Array<keyof T>
  type OrderByOptions<T> = Array<keyof T | [keyof T, 'asc' | 'desc']>
}

export interface QueryResponse<T = any> {
  result: T
}

export interface RawEntityData {
  id: number
  deleted: boolean
  createdAt?: number
  modifiedAt?: number
  [x: string]: any
}

/**
 * 查询实体
 * @param entityName 实体名称
 * @param options 选项
 * @returns 查询到的实体集合
 */
export async function find(
  entityName: string,
  options?: QueryOptions<any>
): Promise<RawEntityData[]> {
  const {
    where = {},
    limit,
    offset,
    fields = null,
    orders = null,
    groupBy = null
  } = options || {}
  let fieldsMap = fields
  if (Array.isArray(fieldsMap)) {
    fieldsMap = fieldsMap.reduce((p, k) => ({ ...p, [k]: true }), {})
  }
  const {
    data: { result }
  } = await request.post<QueryResponse<RawEntityData[]>>('/api/find', {
    argv: [entityName, where, { limit, offset }, fieldsMap, orders, groupBy]
  })
  return result
}

/**
 * 创建实体
 * @param entityName 实体名称
 * @param data 数据
 * @returns 实体ID
 */
export async function create(entityName: string, data: any): Promise<number> {
  const {
    data: { result }
  } = await request.post<QueryResponse<{ id: number }>>('/api/create', {
    argv: [entityName, data]
  })
  return result.id
}

/**
 * 更新实体
 * @param entityName 实体名称
 * @param idOrWhere ID或查询条件
 * @param data 数据
 * @returns 更新的实体ID列表
 */
export async function update(
  entityName: string,
  idOrWhere: number | QueryOptions.WhereOptions<any>,
  data: any
) {
  const {
    data: { result }
  } = await request.post<QueryResponse<number[]>>('/api/update', {
    argv: [entityName, idOrWhere, data]
  })
  return result
}

/**
 * 删除实体
 * @param entityName 实体名称
 * @param idOrWhere ID或查询条件
 * @returns 删除的实体数量
 */
export async function remove(
  entityName: string,
  idOrWhere: number | QueryOptions.WhereOptions<any>
) {
  const {
    data: { result }
  } = await request.post<QueryResponse<number>>('/api/remove', {
    argv: [entityName, idOrWhere]
  })
  return result
}

/**
 * 更新或新建实体
 * @param entityName 实体名称
 * @param where 查询条件
 * @param data 数据
 * @returns [是否创建, 实例ID]
 */
export async function createOrUpdate(
  entityName: string,
  where: QueryOptions.WhereOptions<any>,
  data: any
): Promise<[boolean, number]> {
  const {
    data: { result }
  } = await request.post<QueryResponse<[number] | { id: number }>>(
    '/api/createOrUpdate',
    {
      argv: [entityName, where, data]
    }
  )
  if (Array.isArray(result)) {
    return [false, result[0]]
  }
  return [true, result.id]
}

/**
 * 创建实体关系
 * @param entityName 实体+关系名称(如`Page.chunks`)
 * @param sourceId 源ID(实体ID)
 * @param targetId 目标ID(实体关系关联ID)
 * @param fields 中间表字段
 * @returns 关系ID
 */
export async function createRelation(
  entityName: string,
  sourceId: number,
  targetId: number,
  fields?: Record<string, any>
): Promise<number> {
  const {
    data: { result }
  } = await request.post<QueryResponse<[number]>>('/api/createRelation', {
    argv: [entityName, sourceId, targetId, fields]
  })
  return result[0]
}

/**
 * 移除实体关系
 * @param entityName 实体+关系名称(如`Page.chunks`)
 * @param sourceId 源ID(实体ID)
 * @param targetId 目标ID(实体关系关联ID)
 * @returns 移除关系数量
 */
export async function removeRelation(
  entityName: string,
  sourceId: number,
  targetId: number
): Promise<number> {
  const {
    data: { result }
  } = await request.post<QueryResponse<number>>('/api/removeRelation', {
    argv: [entityName, sourceId, targetId]
  })
  return result
}

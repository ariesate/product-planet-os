import 'reflect-metadata'
import {
  create,
  createOrUpdate,
  createRelation,
  find,
  QueryOptions,
  remove,
  removeRelation,
  update
} from './query'
import * as annotions from './annotions'

export type HookType = 'change'
type UnsubscribeHook = () => void
type HookListener = (data?: any) => void
interface EntityAnnotions<T = any> {
  entityName: string
  fields: Record<keyof T, EntityAnnotions.Field>
  relations: Record<keyof T, EntityAnnotions.Relation>
  hooks: Record<HookType, HookListener[]>
}
declare namespace EntityAnnotions {
  interface Field {
    fieldName: string
    fieldType: Function
  }
  interface Relation extends RelationMetaOptions {
    fieldName: string
  }
}
export type EntityInputData<T extends EntityModel> = Partial<
  Omit<T, keyof EntityModel>
>
const EntityMetaSymbol = Symbol('Entity')
/**
 * 将一个类标记为实体且实体名同类名
 * @deprecated 注意esbuild的minify会将classname也混淆掉，造成EntityName错误，因此生成的model不能从类名推断EntityName
 */
export function Entity(target: Function): void
/**
 * 将一个类标记为实体
 * @param name 实体名
 */
export function Entity(name: string): ClassDecorator
export function Entity(arg: any): any {
  if (typeof arg !== 'function') {
    return (target: Function) => {
      annotions.add(target.prototype, EntityMetaSymbol, {
        entityName: arg
      })
    }
  }
  annotions.add(arg.prototype, EntityMetaSymbol, {
    entityName: arg.name
  })
}
/**
 * 将一个属性标记为实体字段
 * @param fieldName 字段名
 * @deprecated 别名形式暂时不要使用
 */
export function Field(fieldName: string): PropertyDecorator
/**
 * 将一个属性标记为实体字段且其字段名同属性名
 */
export function Field(target: Object, propertyKey: string | symbol): void
export function Field(...args: any[]): any {
  if (args.length < 2) {
    return (target: Object, propertyKey: string | symbol) => {
      setFieldMeta(target, propertyKey, args[0])
    }
  } else {
    const [target, propertyKey] = args
    setFieldMeta(target, propertyKey, propertyKey)
  }
}

/**
 * 将一个属性标记为实体关系且其关系名同属性名
 * @param type 关系对象类型（使用callback形式避免circular reference）
 * @param mode 关系类型
 * @param isSource 是否为source
 */
export function Relation(
  type: () => new (data?: any) => EntityModel,
  mode: RelationMode,
  isSource?: boolean
): PropertyDecorator {
  return (target, propertyKey) => {
    setRelationMeta(target, propertyKey, {
      type,
      mode,
      isSource,
      isArray:
        mode === 'n:n' ||
        (mode === '1:n' && !!isSource) ||
        (mode === 'n:1' && !isSource)
    })
  }
}
function setFieldMeta(
  target: Object,
  propertyKey: string | symbol,
  name: string
) {
  // NOTE: 环境配置有问题, `emitDecoratorMetadata`未生效
  const type: Function = Reflect.getMetadata('design:type', target, propertyKey)
  annotions.add(target, EntityMetaSymbol, {
    fields: {
      [propertyKey]: { fieldName: name, fieldType: type }
    }
  })
}
type RelationMode = '1:1' | '1:n' | 'n:1' | 'n:n'
interface RelationMetaOptions {
  type: () => new (data?: any) => EntityModel
  mode: RelationMode
  isSource?: boolean
  isArray: boolean
}
function setRelationMeta(
  target: Object,
  propertyKey: string | symbol,
  options: RelationMetaOptions
) {
  annotions.add(target, EntityMetaSymbol, {
    relations: {
      [propertyKey]: {
        ...options,
        fieldName: propertyKey
      }
    }
  })
}
/**
 * 根据元数据规则更新对象上的属性
 * @param source 要更新属性的对象
 * @param target 要读取属性的对象
 * @param anno 元数据
 * @description
 *  - `target`中存在于`anno`中定义的字段会被设置到`source`中
 *  - `target`中不存在于`anno`中定义的字段会被忽略
 *  - `target`中的单个关系字段(1:1或n:1)会被解析并更新到`source`中(例如anno中存在`parent`关系，则`target`中的`{parent_id: number}`, `{parent_name: string}`字段会被转换为`{parent: ParentType}`赋值给`source`)
 *  - `target`中的多个关系字段(n:n或1:n)会被解析并更新到`source`中(例如anno中存在`children`关系，则`target`中的`{children: any[]}`会被转换为`{children: ChildrenType[]}`赋值给`source`)
 */
function assignWithAnnotions(source: any, target: any, anno: EntityAnnotions) {
  for (const key in anno.fields) {
    const field = anno.fields[key]
    if (Reflect.has(target, field.fieldName)) {
      let value = Reflect.get(target, field.fieldName)
      // 处理特殊类型（`emitDecoratorMetadata`未生效fieldType暂时没有）
      if (field.fieldType === Date && typeof value === 'number') {
        value = new Date(value * 1000)
      } else if (field.fieldType === Boolean && typeof value === 'number') {
        value = !!value
      }
      Reflect.set(source, key, value)
    }
  }
  for (const key in anno.relations) {
    const relation = anno.relations[key]
    if (Reflect.has(target, relation.fieldName)) {
      // 将嵌套的数据转换为关系模型
      let value = Reflect.get(target, relation.fieldName)
      const ctor = relation.type()
      let data: any
      if (Array.isArray(value)) {
        if (!relation.isArray) {
          throw new Error('invalid data type')
        }
        data = value.map((e) => new ctor(e))
      } else if (typeof value === 'object' && value != null) {
        data = new ctor(value)
      } else {
        data = value
      }
      Reflect.set(source, key, data)
    } else if (!relation.isArray) {
      // 将包含的n:1或1:1关系属性(如product_id)转换为关系模型
      // NOTE: 因为left join会导致出现属性全部为`null`的关系数据, 暂时忽略
      const ctor = relation.type()
      const nestedAnnos: EntityAnnotions = annotions.get(
        ctor.prototype,
        EntityMetaSymbol
      )
      if (nestedAnnos) {
        const nestedData: Record<string, any> = {}
        for (const nestedKey in nestedAnnos.fields) {
          const nestedField = nestedAnnos.fields[nestedKey]
          const parentKey = relation.fieldName + '_' + nestedField.fieldName
          if (Reflect.has(target, parentKey)) {
            Reflect.set(
              nestedData,
              nestedField.fieldName,
              Reflect.get(target, parentKey)
            )
          }
        }
        // NOTE: 以下处理第三层1:1/n:1嵌套关系，后续需要优化成递归
        for (const nestedKey in nestedAnnos.relations) {
          const nestedRel = nestedAnnos.relations[nestedKey]
          const grandCtor = nestedRel.type()
          const grandAnnos: EntityAnnotions = annotions.get(
            grandCtor.prototype,
            EntityMetaSymbol
          )
          const grandPrefix = relation.fieldName + '_' + grandAnnos.entityName
          const grandData: Record<string, any> = {}
          for (const grandkey in grandAnnos.fields) {
            const grandField = grandAnnos.fields[grandkey]
            const parentKey = grandPrefix + '_' + grandField.fieldName
            if (Reflect.has(target, parentKey)) {
              Reflect.set(
                grandData,
                grandField.fieldName,
                Reflect.get(target, parentKey)
              )
            }
          }
          if (Reflect.ownKeys(grandData).length) {
            Reflect.set(nestedData, nestedRel.fieldName, new grandCtor(grandData))
          }
        }
        if (Reflect.ownKeys(nestedData).length) {
          Reflect.set(source, key, new ctor(nestedData))
        }
      }
    }
  }
}

type IdLikeObject = number
interface EntityLikeObject {
  id: IdLikeObject
}

function isIdLikeObject(obj: any): obj is IdLikeObject {
  return typeof obj === 'number'
}
function isEntityLikeObject(obj: any): obj is EntityLikeObject {
  return isIdLikeObject(obj?.id)
}
function stripEntity<T extends EntityLikeObject>(value: T): EntityLikeObject {
  return { id: value.id }
}
function mapToEntities(value: any[]): EntityLikeObject[] {
  return value.map((e: any) => {
    if (!isEntityLikeObject(e)) {
      throw new Error('invalid element data type')
    }
    return { id: e.id }
  })
}
function getEntityId(entity: EntityLikeObject | IdLikeObject): IdLikeObject {
  if (isEntityLikeObject(entity)) {
    return entity.id
  }
  if (isIdLikeObject(entity)) {
    return entity
  }
  throw new Error('invalid target type')
}
/**
 * 过滤掉不在元数据里的属性
 * @param data 数据对象
 * @param anno 元数据
 * @returns 过滤后的数据对象
 */
function filterByAnnotions(data: any, anno: EntityAnnotions) {
  // NOTE: 1. 过滤所有未标记为Field的字段；2. 将Relation字段值转换为`{id: number}`形式
  const entries: [string | symbol, any][] = []
  for (const key in data) {
    if (key in anno.fields) {
      entries.push([key, data[key]])
    } else if (key in anno.relations) {
      // NOTE: experimental!! 批量更新有问题
      const relation = anno.relations[key]
      const value = data[key]
      switch (relation.mode) {
        case '1:1':
          if (isIdLikeObject(value)) {
            entries.push([key, value])
          } else if (isEntityLikeObject(value)) {
            entries.push([key, value.id])
          }
          break
        case '1:n':
          if (relation.isSource) {
            if (Array.isArray(value) && value.length) {
              entries.push([key, mapToEntities(value)])
            }
          } else {
            if (isIdLikeObject(value)) {
              entries.push([key, value])
            } else if (isEntityLikeObject(value)) {
              entries.push([key, value.id])
            }
          }
          break
        case 'n:1':
          if (relation.isSource) {
            if (isIdLikeObject(value)) {
              entries.push([key, { id: value }])
            } else if (isEntityLikeObject(value)) {
              entries.push([key, stripEntity(value)])
            }
          } else {
            if (Array.isArray(value) && value.length) {
              entries.push([key, mapToEntities(value)])
            }
          }
          break
        case 'n:n':
          if (Array.isArray(value) && value.length) {
            entries.push([key, mapToEntities(value)])
          }
          break
        default:
          break
      }
    }
  }
  if (!entries.length) {
    return
  }
  return entries.reduce((p, [k, v]) => ({ ...p, [k]: v }), {})
}

function notifyChange(anno: EntityAnnotions) {
  try {
    anno.hooks?.change?.forEach((fun) => fun())
  } catch (error) {
    console.error(error)
  }
}

export interface RawEntityData {
  id: number
  deleted: boolean
  createdAt?: number
  modifiedAt?: number
  [x: string]: any
}

export abstract class EntityModel {
  /**
   * ID
   */
  @Field
  readonly id: number
  /**
   * 删除标记
   */
  @Field
  readonly deleted: boolean
  /**
   * 创建时间
   */
  @Field
  readonly createdAt?: Date
  /**
   * 修改时间
   */
  @Field
  readonly modifiedAt?: Date

  constructor(data?: any) {
    if (data) {
      this.setData(data)
    }
  }

  /**
   * 设置数据
   * @param data 数据
   */
  setData(data: any) {
    assignWithAnnotions(
      this,
      data,
      annotions.get(this.constructor.prototype, EntityMetaSymbol)
    )
  }

  /**
   *  更新
   * @param data 数据
   * @description 修改成功会更新当前实例上对应的字段
   * @returns 是否更新成功
   */
  async update(data: Partial<typeof this>): Promise<boolean> {
    if (!this.id) {
      throw new Error('missing primary key')
    }
    const anno: EntityAnnotions = annotions.get(
      this.constructor.prototype,
      EntityMetaSymbol
    )
    const safeData = filterByAnnotions(data, anno)
    if (!safeData) {
      return
    }
    const res = await update(anno.entityName, this.id, safeData)
    if (!res?.[0]) {
      return false
    }
    Object.assign(this, safeData)
    notifyChange(anno)
    return true
  }

  /**
   * 持久化当前实例(更新或创建)
   */
  async save(): Promise<void | boolean> {
    const anno: EntityAnnotions = annotions.get(
      this.constructor.prototype,
      EntityMetaSymbol
    )
    if (this.id) {
      return this.update(this)
    }
    const safeData = filterByAnnotions(this, anno)
    const id = await create(anno.entityName, safeData)
    if (id) {
      const res = await find(anno.entityName, { where: { id }, limit: 1 })
      this.setData(res[0])
    }
    notifyChange(anno)
  }

  /**
   * 刷新当前实例数据(从数据库重新获取)
   */
  async refresh(): Promise<void> {
    if (!this.id) {
      throw new Error('missing primary key')
    }
    const anno: EntityAnnotions = annotions.get(
      this.constructor.prototype,
      EntityMetaSymbol
    )
    const res = await find(anno.entityName, {
      where: { id: this.id },
      limit: 1
    })
    this.setData(res[0])
  }

  /**
   * 销毁当前实例
   * @returns 是否成功
   */
  async destroy(): Promise<boolean> {
    if (!this.id) {
      throw new Error('missing primary key')
    }
    const anno: EntityAnnotions = annotions.get(
      this.constructor.prototype,
      EntityMetaSymbol
    )
    const res = await remove(anno.entityName, this.id)
    notifyChange(anno)
    return res > 0
  }

  /**
   * 建立实体关系
   * @param name 关系(在当前实体中定义的)字段名
   * @param target 关联实体
   * @param fields 中间字段
   * @returns 新建的关系ID
   */
  protected async addRelation(
    name: keyof typeof this,
    target: EntityLikeObject | IdLikeObject,
    fields?: Record<string, any>
  ) {
    const anno: EntityAnnotions = annotions.get(
      this.constructor.prototype,
      EntityMetaSymbol
    )
    const relation = anno.relations[name]
    if (!relation) {
      throw new Error('unknow relation')
    }
    const targetId = getEntityId(target)
    const res = await createRelation(
      `${anno.entityName}.${name}`,
      this.id,
      targetId,
      fields
    )
    notifyChange(anno)
    return res
  }

  /**
   * 移除实体关系
   * @param name 关系(在当前实体中定义的)字段名
   * @param target 关联实体
   * @returns 移除的关系数量
   */
  protected async removeRelation(
    name: keyof typeof this,
    target: EntityLikeObject | IdLikeObject
  ) {
    const anno: EntityAnnotions = annotions.get(
      this.constructor.prototype,
      EntityMetaSymbol
    )
    const relation = anno.relations[name]
    if (!relation) {
      throw new Error('unknow relation')
    }
    const targetId = getEntityId(target)
    const res = await removeRelation(
      `${anno.entityName}.${name}`,
      this.id,
      targetId
    )
    notifyChange(anno)
    return res
  }

  /**
   * 查询对象
   * @param options 选项
   * @returns 对象集合
   */
  static async find<T extends EntityModel>(
    this: new (data?: any) => T,
    options?: QueryOptions<T>
  ): Promise<T[]> {
    const anno: EntityAnnotions = annotions.get(
      this.prototype,
      EntityMetaSymbol
    )
    // TODO: 将嵌套的model flatten
    const res = await find(anno.entityName, options)
    return res.map((data) => new this(data))
  }

  /**
   * 查询单个对象
   * @param options 选项
   * @returns 单个对象
   * @description 在查询条件基础上会固定追加`limit = 1`
   */
  static async findOne<T extends EntityModel>(
    this: new (data?: any) => T,
    options?: QueryOptions<T>
  ): Promise<T> {
    const anno: EntityAnnotions = annotions.get(
      this.prototype,
      EntityMetaSymbol
    )
    const [res] = await find(anno.entityName, { ...options, limit: 1 })
    return res && new this(res)
  }

  /**
   * 创建实例
   * @param data 数据
   * @returns 新实例的ID
   */
  static async create<T extends EntityModel>(
    this: new (data?: any) => T,
    data: EntityInputData<T>
  ): Promise<number>
  /**
   * 创建实例并返回该实例
   * @param data 数据
   * @param fields 包含字段
   * @returns 新实例
   */
  static async create<T extends EntityModel>(
    this: new (data?: any) => T,
    data: EntityInputData<T>,
    fields: QueryOptions.SelectOptions<QueryOptions.Queriable<T>>
  ): Promise<T>
  static async create<T extends EntityModel>(
    this: new (data?: any) => T,
    data: EntityInputData<T>,
    fields?: QueryOptions.SelectOptions<QueryOptions.Queriable<T>>
  ): Promise<T | number> {
    const anno: EntityAnnotions = annotions.get(
      this.prototype,
      EntityMetaSymbol
    )
    const safeData = filterByAnnotions(data, anno)
    const id = await create(anno.entityName, safeData)
    notifyChange(anno)
    if (fields) {
      const [res] = await find(anno.entityName, {
        where: { id },
        limit: 1,
        fields
      })
      return new this(res)
    }
    return id
  }

  /**
   *  更新
   * @param data 数据
   * @returns 更新数量
   */
  static async update<T extends EntityModel>(
    idOrWhere: number | QueryOptions.WhereOptions<QueryOptions.Queriable<T>>,
    data: Partial<T>
  ): Promise<number> {
    const anno: EntityAnnotions = annotions.get(
      this.prototype,
      EntityMetaSymbol
    )
    const safeData = filterByAnnotions(data, anno)
    if (!safeData) {
      return
    }
    const res = await update(anno.entityName, idOrWhere, safeData)
    notifyChange(anno)
    return res.length
  }

  /**
   *  删除
   * @param idOrWhere
   * @returns 删除数量
   */
  static async remove<T extends EntityModel>(
    idOrWhere: number | QueryOptions.WhereOptions<QueryOptions.Queriable<T>>
  ): Promise<number> {
    const anno: EntityAnnotions = annotions.get(
      this.prototype,
      EntityMetaSymbol
    )
    const res = await remove(anno.entityName, idOrWhere)
    notifyChange(anno)
    return res
  }

  /**
   * 销毁实例(软删除)
   * @param id ID
   * @returns 是否成功
   */
  static async destroy(id: number): Promise<boolean>
  /**
   * 销毁实例(软删除)
   * @param id ID
   * @param force 是否硬删除
   * @returns 是否成功
   */
  static async destroy(id: number, force: boolean): Promise<boolean>
  /**
   * 销毁实例(软删除)
   * @param where 删除条件
   * @returns 删除数量
   */
  static async destroy<T extends EntityModel>(
    where: QueryOptions.WhereOptions<QueryOptions.Queriable<T>>
  ): Promise<number>
  static async destroy(
    idOrWhere: number | object,
    force?: boolean
  ): Promise<number | boolean> {
    const anno: EntityAnnotions = annotions.get(
      this.prototype,
      EntityMetaSymbol
    )
    if (typeof idOrWhere === 'object' || !force) {
      const res = await update(anno.entityName, idOrWhere, { deleted: true })
      notifyChange(anno)
      return res.length
    } else {
      const res = await remove(anno.entityName, idOrWhere)
      notifyChange(anno)
      return res > 0
    }
  }

  /**
   * 插入或更新
   *
   * @param where 查询条件
   * @param values 初始值
   * @returns [是否创建, 实例ID]
   */
  static async upsert<T extends EntityModel>(
    where: QueryOptions.WhereOptions<QueryOptions.Queriable<T>>,
    values: Partial<T>
  ): Promise<[boolean, number]> {
    const anno: EntityAnnotions = annotions.get(
      this.prototype,
      EntityMetaSymbol
    )
    const res = await createOrUpdate(anno.entityName, where, values)
    notifyChange(anno)
    return res
  }

  /**
   * 添加数据变化事件订阅(save/create/update/remove/relation)
   * @param type 事件类型
   * @param listener 订阅函数
   * @returns 取消订阅函数
   */
  static addHook<T extends EntityModel>(
    this: new (data?: any) => T,
    type: 'change',
    listener: () => void
  ): UnsubscribeHook
  static addHook<T extends EntityModel>(
    this: new (data?: any) => T,
    type: HookType,
    listener: (data?: any) => void
  ): UnsubscribeHook {
    const anno: EntityAnnotions = annotions.get(
      this.prototype,
      EntityMetaSymbol
    )
    let hooks = [listener]
    if (anno.hooks?.[type]) {
      hooks = [...anno.hooks[type]]
    }
    annotions.add(this.prototype, EntityMetaSymbol, {
      hooks: {
        [type]: hooks
      }
    })
    return () => {
      if (anno.hooks?.[type]) {
        anno.hooks[type] = anno.hooks[type].filter((e) => e !== listener)
      }
    }
  }
}

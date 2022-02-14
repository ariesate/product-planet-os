/**
 * TODO: The data type of the raw data should be provided by EREditor.
 */
declare namespace ER {
  export interface RawEntity {
    id: string
    name: string
    fields: RawEntityField[]
    belongToUser?: boolean
    view: {
      x: number
      y: number
    }
  }

  export type FieldTypes = 'id' | 'rel' | 'string' | 'number'

  export interface RawEntityField {
    id: string
    name: string
    type: FieldTypes
    size?: number
    isCollection?: boolean
  }

  export type RelationTypes = '1:1' | '1:n' | 'n:1' | 'n:n'

  export interface RawRelation {
    id: string
    name: string
    type: RelationTypes
    source: {
      entity: string // entity id
      field: string // field id
    }
    target: {
      entity: string // entity id
      field: string // field id
    }
    view: {
      sourcePortSide: 'left' | 'right'
      targetPortSide: 'left' | 'right'
    }
  }

  export interface ReplaceIdWithNameRelation {
    id: string
    name: string
    type: RelationTypes
    source: {
      entity: string // entity name
      field: [string] // field name
    }
    target: {
      entity: string // entity name
      field: [string] // field name
    }
    view: {
      sourcePortSide: 'left' | 'right'
      targetPortSide: 'left' | 'right'
    }
  }
}

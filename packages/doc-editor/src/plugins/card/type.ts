import { AxiiElement, CSSProperties } from 'axii'

export interface CardItem {
  id: number
  name: string
  [x: string]: any
}

export type FetchListType<T extends CardItem> = (text: string) => Promise<T[]>
export type FetchItemType<T extends CardItem> = (id: number) => Promise<T>
export type ActionType<T extends CardItem> = (item: T) => void
export type RenderType<T extends CardItem> = (item: T) => AxiiElement

export interface CardConfig<T extends CardItem, P extends CardItem> {
  style?: CSSProperties
  preload?: boolean
  placeholder?: string
  fetchList: FetchListType<T>
  fetchItem: FetchItemType<P>
  renderListItem: RenderType<T>
  renderDetail: RenderType<P | undefined | null>
  action?: ActionType<P>
}

export interface CardBlockData {
  id: number
}

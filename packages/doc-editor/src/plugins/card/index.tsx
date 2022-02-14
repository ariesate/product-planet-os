import { atom, render, createElement } from 'axii'
import { API } from '@editorjs/editorjs'
import CardBlock from './CardBlock'
import icon from './icon.svg?raw'
import { CardBlockData, CardConfig, CardItem } from './type'

interface Options<T extends CardItem, P extends CardItem> {
  api: API
  data: CardBlockData
  config: CardConfig<T, P>
}

export default class Card<T extends CardItem, P extends CardItem> {
  static get toolbox() {
    return {
      title: 'Card',
      icon
    }
  }

  static get isReadOnlySupported() {
    return true
  }

  protected readonly data: CardBlockData
  protected readonly config: CardConfig<T, P>

  constructor({ data, config }: Options<T, P>) {
    this.data = data
    this.config = config
  }

  render() {
    const root = document.createElement('div')
    render(
      <CardBlock
        id={atom(this.data.id)}
        style={this.config.style}
        placeholder={this.config.placeholder}
        fetchList={this.config.fetchList}
        fetchItem={this.config.fetchItem}
        renderListItem={this.config.renderListItem}
        renderDetail={this.config.renderDetail}
        onAction={this.config.action}
        onChange={(value) => {
          this.data.id = value
        }}
      />,
      root
    )
    return root
  }

  save() {
    return {
      id: this.data.id
    }
  }

  validate(data: CardBlockData) {
    if (!data.id) {
      return false
    }
    return true
  }
}

interface CreateCardOptions<T extends CardItem, P extends CardItem>
  extends CardConfig<T, P> {
  title: string
  icon: string
}
export function createCardTool<T extends CardItem, P extends CardItem>(
  options: CreateCardOptions<T, P>
) {
  const { title, icon, ...defaultConfig } = options
  return class extends Card<CardItem, CardItem> {
    static get toolbox() {
      return {
        title,
        icon
      }
    }
    constructor({ config, ...opts }: Options<T, P>) {
      super({ config: { ...defaultConfig, ...config }, ...opts })
    }
  }
}

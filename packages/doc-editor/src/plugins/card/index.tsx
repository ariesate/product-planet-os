import { atom, render, createElement } from 'axii'
import {
  API,
  PasteConfig,
  PasteEvent,
  ToolConstructable
} from '@editorjs/editorjs'
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
  protected root?: HTMLDivElement

  constructor({ data, config }: Options<T, P>) {
    this.data = data
    this.config = config
  }

  render() {
    const root = document.createElement('div')
    this.root = root
    this.renderCard()
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

  protected renderCard() {
    render(
      <CardBlock
        id={atom(this.data.id)}
        style={this.config.style}
        preload={this.config.preload}
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
      this.root
    )
  }
}

interface CreateCardOptions<T extends CardItem, P extends CardItem>
  extends CardConfig<T, P> {
  title: string
  icon: string
  pasteConfig?: PasteConfig
  handlePaste?: (e: PasteEvent) => number
}
export function createCardTool<T extends CardItem, P extends CardItem>(
  options: CreateCardOptions<T, P>
): ToolConstructable {
  const { title, icon, pasteConfig, handlePaste, ...defaultConfig } = options
  return class extends Card<CardItem, CardItem> {
    static get toolbox() {
      return {
        title,
        icon
      }
    }
    static get pasteConfig() {
      return pasteConfig
    }
    constructor({ config, ...opts }: Options<T, P>) {
      super({ config: { ...defaultConfig, ...config }, ...opts })
    }

    protected onPaste(e: PasteEvent) {
      if (this.root != null && typeof handlePaste === 'function') {
        this.data.id = handlePaste(e)
        this.renderCard()
      }
    }
  }
}

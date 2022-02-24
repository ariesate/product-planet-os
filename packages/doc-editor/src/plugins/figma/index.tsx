import { render, createElement } from 'axii'
import {
  PasteConfig,
  PatternPasteEvent,
  ToolConstructable
} from '@editorjs/editorjs'
import icon from './icon.svg?raw'
import Input from './Input'

export interface FigmaBlockData {
  url: string
}

interface Options {
  data: FigmaBlockData
}

const Pattern = /^https?:\/\/(www\.)?figma\.com\/file\/\S+$/i

class Figma {
  static get toolbox() {
    return {
      title: 'Figma',
      icon
    }
  }

  static get isReadOnlySupported() {
    return true
  }

  static get pasteConfig(): PasteConfig {
    return {
      patterns: {
        url: Pattern
      }
    }
  }

  protected readonly data: FigmaBlockData
  protected root?: HTMLDivElement

  constructor({ data }: Options) {
    this.data = data
  }

  render() {
    const root = document.createElement('div')
    this.root = root
    if (this.data && this.data.url) {
      this.createElement(this.data.url)
    } else {
      render(
        <Input
          placeholder="请输入figma分享链接"
          onChange={(url) => {
            if (Pattern.test(url)) {
              this.data.url = url
              this.createElement(url)
            }
          }}
        />,
        root
      )
    }
    return root
  }

  save() {
    return {
      url: this.data.url
    }
  }

  validate(data: FigmaBlockData) {
    if (!data.url?.match(Pattern)) {
      return false
    }
    return true
  }

  onPaste(e: PatternPasteEvent) {
    switch (e.type) {
      case 'pattern':
        const url = e.detail.data
        this.data.url = url
        this.createElement(url)
        break
    }
  }

  protected createElement(src: string) {
    render(
      <iframe
        style={{ border: '1px solid rgba(0, 0, 0, 0.1)' }}
        width="480"
        height="320"
        src={`https://www.figma.com/embed?embed_host=share&url=${encodeURI(
          src
        )}`}
      />,
      this.root
    )
  }
}

export default Figma as unknown as ToolConstructable

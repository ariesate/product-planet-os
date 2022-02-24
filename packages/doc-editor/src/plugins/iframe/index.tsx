import { render, createElement } from 'axii'
import {
  HTMLPasteEvent,
  PasteConfig,
  PatternPasteEvent,
  ToolConstructable
} from '@editorjs/editorjs'
import icon from './icon.svg?raw'
import TextBox from './TextBox'

export interface IFrameBlockData {
  html: string
}

interface Options {
  data: IFrameBlockData
}

const Pattern = /^(?:<iframe[^>]*)(?:(?:\/>)|(?:>.*?<\/iframe>))$/i

class IFrame {
  static get toolbox() {
    return {
      title: 'iframe',
      icon
    }
  }

  static get isReadOnlySupported() {
    return true
  }

  static get pasteConfig(): PasteConfig {
    return {
      tags: ['IFRAME'],
      patterns: {
        iframe: Pattern
      }
    }
  }

  protected readonly data: IFrameBlockData
  protected root?: HTMLDivElement

  constructor({ data }: Options) {
    this.data = data
  }

  render() {
    const root = document.createElement('div')
    this.root = root
    if (this.data && this.data.html) {
      this.createElement(this.data.html)
    } else {
      render(
        <TextBox
          placeholder="请输入iframe代码"
          onChange={(html) => {
            if (Pattern.test(html)) {
              const parent = document.createElement('div')
              parent.innerHTML = html
              const tag = parent.children[0] as HTMLElement
              tag.setAttribute('width', '650px')
              tag.setAttribute('height', '320px')
              html = tag.outerHTML
              this.data.html = html
              this.createElement(html)
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
      html: this.data.html
    }
  }

  validate(data: IFrameBlockData) {
    if (!data.html?.match(Pattern)) {
      return false
    }
    return true
  }

  onPaste(e: HTMLPasteEvent | PatternPasteEvent) {
    switch (e.type) {
      case 'tag':
        {
          const tag = (e as HTMLPasteEvent).detail.data
          tag.setAttribute('width', '650px')
          tag.setAttribute('height', '320px')
          const html = tag.outerHTML
          this.data.html = html
          this.createElement(html)
        }
        break
      case 'pattern':
        {
          const parent = document.createElement('div')
          parent.innerHTML = (e as PatternPasteEvent).detail.data
          const tag = parent.children[0] as HTMLElement
          tag.setAttribute('width', '650px')
          tag.setAttribute('height', '320px')
          const html = tag.outerHTML
          this.data.html = html
          this.createElement(html)
        }
        break
    }
  }

  protected createElement(html: string) {
    this.root.innerHTML = html
  }
}

export default IFrame as unknown as ToolConstructable

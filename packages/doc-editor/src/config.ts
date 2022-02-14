type Plugins<T> = { [K in keyof T]?: EditorConfig.PluginConfig<T[K]> }
export interface EditorConfig {
  autofocus?: boolean
  placeholder?: string | false
  hideToolbar?: boolean
  minHeight?: number
  logLevel?: 'VERBOSE' | 'INFO' | 'WARN' | 'ERROR'
  readOnly?: boolean
  data?: EditorOutputData
  onReady?: () => void
  onChange?: () => void
}
export namespace EditorConfig {
  export interface PluginConfig<T> {
    config?: T
    shortcut?: string
    inlineToolbar?: boolean
  }
  export interface HeaderConfig {
    placeholder?: string
    levels?: number[]
    defaultLevel?: number
  }
  export interface LinkConfig {
    endpoint: string
    headers?: Record<string, any>
  }
  export interface TableConfig {
    rows?: number
    cols?: number
  }
  export interface AttachesConfig {
    endpoint?: string
    uploader?: AttachesConfig.Uploader
    field?: string
    types?: string
    buttonText?: string
    errorMessage?: string
    additionalRequestHeaders?: Record<string, any>
  }
  export namespace AttachesConfig {
    export interface Uploader {
      uploadByFile(file: File): Promise<Uploader.Response>
    }
    export namespace Uploader {
      export type Response =
        | { success: 0 }
        | {
            success: 1
            file: { url: string; [x: string]: any }
          }
    }
  }
  export interface ImageConfig {
    endpoints?: ImageConfig.Endpoints
    field?: string
    types?: string
    additionalRequestData?: Record<string, any>
    additionalRequestHeaders?: Record<string, any>
    captionPlaceholder?: string
    buttonContent?: string
    uploader?: ImageConfig.Uploader
    actions?: ImageConfig.Action[]
  }
  export namespace ImageConfig {
    export interface Endpoints {
      byFile?: string
      byUrl?: string
    }
    export interface Action {
      name: string
      icon: string
      title: string
      action: (name: string) => boolean
    }
    export interface Uploader {
      uploadByFile(file: File): Promise<Uploader.Response>
      uploadByUrl(url: string): Promise<Uploader.Response>
    }
    export namespace Uploader {
      export type Response =
        | { success: 0 }
        | {
            success: 1
            file: { url: string; [x: string]: any }
          }
    }
  }
}
export interface EditorOutputData {
  version?: string
  time?: number
  blocks: EditorOutputData.MixedBlock[]
}
export namespace EditorOutputData {
  export type MixedBlock =
    | LinkBlock
    | HeaderBlock
    | NestedlistBlock
    | ChecklistBlock
    | AttachesBlock
    | ParagraphBlock
    | TableBlock
    | ImageBlock
    | Block
  export interface Block {
    id?: string
    type: string
    data: any
  }
  export interface LinkBlock extends Block {
    type: 'link'
    data: {
      link: string
      meta: {
        title?: string
        image?: string
        description?: string
        [x: string]: any
      }
    }
  }
  export interface HeaderBlock extends Block {
    type: 'header'
    data: {
      text: string
      level: number
    }
  }
  export interface NestedlistBlock {
    type: 'list'
    data: {
      items: NestedlistBlock.Item[]
    }
  }
  export namespace NestedlistBlock {
    export interface Item {
      content: string
      items?: Item[]
    }
  }
  export interface ChecklistBlock extends Block {
    type: 'checklist'
    data: {
      items: Array<{ text: string; checked: boolean }>
    }
  }
  export interface AttachesBlock extends Block {
    type: 'attaches'
    data: {
      title: string
      file: {
        url: string
        size: number
        name: string
        extension: string
      }
    }
  }
  export interface ParagraphBlock extends Block {
    type: 'paragraph'
    data: {
      text: string
    }
  }
  export interface TableBlock extends Block {
    type: 'table'
    data: {
      withHeadings: boolean
      content: string[][]
    }
  }
  export interface ImageBlock extends Block {
    type: 'image'
    data: {
      caption: string
      withBorder: boolean
      withBackground: boolean
      stretched: boolean
      file: {
        url: string
        [x: string]: any
      }
    }
  }
}
export type EditorPlugins = Plugins<{
  header: EditorConfig.HeaderConfig
  link: EditorConfig.LinkConfig
  table: EditorConfig.TableConfig
  attaches: EditorConfig.AttachesConfig
  image: EditorConfig.ImageConfig
}>

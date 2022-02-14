declare namespace Store {
  export interface root {
    UserInfo: Partial<API.User.UserInfo>
    Menu: {
      collapsed: boolean
    }
    Product: {
      currentProduct?: {
        id: string
        name: string
        description: string
        product: {
          name: string
          description: string
          codebase: object
          id: string
        }
        status: {
          name: string
          id: string
          order: string
        }
      }
    }
  }

  export interface RawMenuItem {
    title: string
    path: string
    icon?: any
    children: RawMenuItem[]
  }
}

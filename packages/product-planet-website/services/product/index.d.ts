declare namespace API.Product {
  export interface UserProduct {
    product_id: string
    product_name: string
    product_logo: string
    product_description: string
    user_id: string
    user_name: string
    user_displayName: string
    id: string
    role: 'admin' | 'member'
    lastVisit: number
    last_version_id: string
  }

  export interface ProductDetail {
    id: string
    name: string
    description: string
    logo?: string
    creator_id: string
    creator_displayName: string
    members: {
      id: string
      role: 'admin' | 'member'
      lastVisit: number
    }[]
    versions: {
      id: string
      name: string
      description: string
      notice: string
    }[]
    children: unknown[]
  }
}

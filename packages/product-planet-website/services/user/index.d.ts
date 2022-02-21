declare namespace API.User {
  export interface UserInfo {
    id: string
    avatar?: string
    displayName: string
    email: string
    name: string
    org: {
      id: number
      name: string
    }
  }
}

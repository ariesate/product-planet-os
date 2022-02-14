declare namespace API.Team {
  export interface ModelInfo {
    externalTaskModelPageInfo: {
      list: Array<TaskInfo>
    }
  }
  export interface TaskInfo {
    taskName: string
    assignee: UserInfo
    taskRefCountModel: RefInfo
  }
  export interface UserInfo {
    avatar: string
    name: string
    userName: string
  }
  export interface RefInfo {
    endChildrenCount: number
    totalChildrenCount: number
  }
}

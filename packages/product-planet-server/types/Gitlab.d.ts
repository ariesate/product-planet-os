declare namespace Gitlab {
  const enum HookType {
    Push = 'Push Hook',
    Tag = 'Tag Push Hook',
    Issue = 'Issue Hook',
    Comment = 'Note Hook',
    MergeRequest = 'Merge Request Hook',
    WikiPage = 'Wiki Page Hook',
    Pipeline = 'Pipeline Hook',
    Build = 'Build Hook'
  }

  const enum ObjectKind {
    Push = 'push',
    TagPush = 'tag_push',
    Issue = 'issue',
    Note = 'note',
    MergeRequest = 'merge_request',
    WikiPage = 'wiki_page',
    Pipeline = 'pipeline',
    Build = 'build'
  }

  interface Project {
    id: number
    name: string
    description: string
    web_url: string
    avatar_url?: any
    git_ssh_url: string
    git_http_url: string
    namespace: string
    visibility_level: number
    path_with_namespace: string
    default_branch: string
    homepage: string
    url: string
    ssh_url: string
    http_url: string
  }

  interface Repository {
    name: string
    url: string
    description: string
    homepage: string
    git_http_url: string
    git_ssh_url: string
    visibility_level: number
  }

  interface Author {
    name: string
    email: string
  }

  interface Commit {
    id: string
    message: string
    timestamp: Date
    url: string
    author: Author
    added: string[]
    modified: string[]
    removed: string[]
  }

  interface Event {
    object_kind: ObjectKind
    before: string
    after: string
    ref: string
    checkout_sha: string
    user_id: number
    user_name: string
    user_username: string
    user_email: string
    user_avatar: string
    project_id: number
    project: Project
    repository: Repository
    commits: Commit[]
    total_commits_count: number
    [x: string]: any
  }
}

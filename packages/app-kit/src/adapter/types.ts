export interface DatagrokUser {
  id: string
  login: string
  displayName: string
}

export interface DatagrokContext {
  currentUser: DatagrokUser
  mode: 'standalone' | 'datagrok'
}

export interface UserContext {
  userId: string
  personalGroupId: string
}

export interface PermissionCheckResult {
  entityId: string
  permissionName: string
  allowed: boolean
}

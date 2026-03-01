export class PermissionDeniedError extends Error {
  constructor(
    public readonly entityId: string,
    public readonly requiredPermission: string,
    public readonly entityTypeName?: string,
  ) {
    super(`Permission denied: requires '${requiredPermission}' on entity ${entityId}`)
    this.name = 'PermissionDeniedError'
  }
}

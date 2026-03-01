import { useApi } from '../hooks/use-api'

interface PermissionCheckRequest {
  entityId: string
  permissionName: string
  entityTypeName: string
}

interface PermissionCheckResponse {
  allowed: boolean
}

interface BatchCheckResponse {
  results: Array<{
    entityId: string
    permissionName: string
    allowed: boolean
  }>
}

interface GrantRevokeRequest {
  entityId: string
  permissionName: string
  entityTypeName: string
  groupId: string
}

interface PermissionGrant {
  id: string
  group_id: string
  group_name: string
  permission_name: string
}

interface EntityTypeWithPermissions {
  id: string
  name: string
  permissions: Array<{ id: string; name: string }>
}

/**
 * Client-side API helpers for the /api/privileges/* endpoints.
 * Returns functions that use the current API context (user auth, base path).
 */
export function usePrivilegesApi() {
  const api = useApi()

  return {
    /** Check a single permission on an entity */
    checkPermission: (req: PermissionCheckRequest) =>
      api.post<PermissionCheckResponse>('/privileges/check', req),

    /** Check multiple permissions in one request */
    checkPermissionBatch: (checks: PermissionCheckRequest[]) =>
      api.post<BatchCheckResponse>('/privileges/check-batch', { checks }),

    /** Grant a permission to a group (requires Share on entity) */
    grantPermission: (req: GrantRevokeRequest) =>
      api.post<{ ok: boolean }>('/privileges/grant', req),

    /** Revoke a permission from a group (requires Share on entity) */
    revokePermission: (req: GrantRevokeRequest) =>
      api.post<{ ok: boolean }>('/privileges/revoke', req),

    /** List all permission grants on an entity (requires Share) */
    getEntityPermissions: (entityId: string) =>
      api.get<PermissionGrant[]>(`/privileges/entity/${entityId}/permissions`),

    /** List all entity types with their available permissions */
    getEntityTypes: () =>
      api.get<EntityTypeWithPermissions[]>('/privileges/entity-types'),
  }
}

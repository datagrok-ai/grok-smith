export { useApi, ApiRequestError } from './use-api'
export type { ApiError } from './use-api'
export { useCurrentUser } from './use-current-user'
export { ApiBasePath, useApiBasePath } from './api-base-path'
export { useCanDo, useEntityPermissions } from './use-permissions'

/**
 * Per-row permission flags returned by entity-db findMany/findUnique
 * when includePermissions is true. Matches the server-kit RowPermissions shape.
 */
export interface RowPermissions {
  canEdit: boolean
  canDelete: boolean
  canShare: boolean
}

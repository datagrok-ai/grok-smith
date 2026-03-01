export { createApp } from './create-app.js'
export { createDb } from './db/connection.js'
export { auth } from './middleware/auth.js'
export { userContext } from './middleware/user-context.js'
export { errorHandler } from './middleware/error-handler.js'
export { requestId } from './middleware/request-id.js'
export { healthRoutes } from './routes/health.js'
export { authRoutes } from './routes/auth.js'
export { privilegeRoutes } from './routes/privileges.js'
export type { AppConfig, AppVariables, ServerAppDefinition } from './types.js'

// Permissions engine
export {
  canDo,
  isAdmin,
  batchCheckPermissions,
  PermissionDeniedError,
  grantPermission,
  revokePermission,
  userGroupsCTE,
  userGroupsSubquery,
  registerEntityType,
  STANDARD_PERMISSIONS,
  visibleEntitiesSql,
  isAdminSql,
} from './permissions/index.js'
export type { UserContext, PermissionCheckResult, PermissionName } from './permissions/index.js'

// Entity DB (Prisma-shaped API)
export {
  createEntityDb,
  createSecureDb,
  createEntityAccessor,
  compileWhere,
  compileOrderBy,
  compileSelect,
} from './entity-db/index.js'
export type {
  SecureDb,
  EntityAccessor,
  EntityTableConfig,
  WhereClause,
  OrderByClause,
  SelectClause,
  FindManyArgs,
  FindUniqueArgs,
  FindFirstArgs,
  CountArgs,
  CreateArgs,
  CreateManyArgs,
  UpdateArgs,
  UpdateManyArgs,
  DeleteArgs,
  DeleteManyArgs,
  RowPermissions,
} from './entity-db/index.js'

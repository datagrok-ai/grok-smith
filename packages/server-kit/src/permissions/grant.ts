import { sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import { canDo } from './check.js'
import { PermissionDeniedError } from './errors.js'

/**
 * Grant a permission on an entity to a group. Requires 'Share' permission.
 */
export async function grantPermission(
  db: PostgresJsDatabase<Record<string, unknown>>,
  personalGroupId: string,
  entityId: string,
  permissionName: string,
  entityTypeName: string,
  targetGroupId: string,
): Promise<void> {
  const canShare = await canDo(db, personalGroupId, entityId, 'Share', entityTypeName)
  if (!canShare) {
    throw new PermissionDeniedError(entityId, 'Share', entityTypeName)
  }

  await db.execute(sql`
    INSERT INTO permissions (id, entity_id, user_group_id, permission_id)
    SELECT gen_random_uuid(), ${entityId}::uuid, ${targetGroupId}::uuid, etp.id
    FROM entity_types_permissions etp
    INNER JOIN entity_types et ON et.id = etp.entity_type_id
    WHERE etp.name = ${permissionName}
      AND et.name = ${entityTypeName}
    ON CONFLICT (entity_id, user_group_id, permission_id) DO NOTHING
  `)
}

/**
 * Revoke a permission on an entity from a group. Requires 'Share' permission.
 */
export async function revokePermission(
  db: PostgresJsDatabase<Record<string, unknown>>,
  personalGroupId: string,
  entityId: string,
  permissionName: string,
  entityTypeName: string,
  targetGroupId: string,
): Promise<void> {
  const canShare = await canDo(db, personalGroupId, entityId, 'Share', entityTypeName)
  if (!canShare) {
    throw new PermissionDeniedError(entityId, 'Share', entityTypeName)
  }

  await db.execute(sql`
    DELETE FROM permissions
    WHERE entity_id = ${entityId}::uuid
      AND user_group_id = ${targetGroupId}::uuid
      AND permission_id IN (
        SELECT etp.id
        FROM entity_types_permissions etp
        INNER JOIN entity_types et ON et.id = etp.entity_type_id
        WHERE etp.name = ${permissionName}
          AND et.name = ${entityTypeName}
      )
  `)
}

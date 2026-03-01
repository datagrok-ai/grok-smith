import { sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import { ADMIN_GROUP_ID } from '@datagrok/core-schema'

import { userGroupsSubquery } from './group-resolution.js'

/**
 * Check if a user can perform a specific action on a specific entity.
 * Admin group members bypass all checks.
 */
export async function canDo(
  db: PostgresJsDatabase<Record<string, unknown>>,
  personalGroupId: string,
  entityId: string,
  permissionName: string,
  entityTypeName: string,
): Promise<boolean> {
  const groups = userGroupsSubquery(personalGroupId)
  const result = await db.execute<{ has_permission: boolean }>(sql`
    SELECT EXISTS(
      -- Admin bypass: member of admin group can do anything
      SELECT 1 FROM ${groups} ug WHERE ug.id = ${ADMIN_GROUP_ID}::uuid
      UNION ALL
      -- Normal permission check
      SELECT 1
      FROM permissions p
      INNER JOIN entity_types_permissions etp ON etp.id = p.permission_id
      INNER JOIN entity_types et ON et.id = etp.entity_type_id
      WHERE p.entity_id = ${entityId}::uuid
        AND etp.name = ${permissionName}
        AND et.name = ${entityTypeName}
        AND p.user_group_id IN (SELECT id FROM ${groups} ug2)
    ) AS has_permission
  `)
  return result[0]?.has_permission ?? false
}

/**
 * Check if the user is a member of the admin group.
 */
export async function isAdmin(
  db: PostgresJsDatabase<Record<string, unknown>>,
  personalGroupId: string,
): Promise<boolean> {
  const groups = userGroupsSubquery(personalGroupId)
  const result = await db.execute<{ is_admin: boolean }>(sql`
    SELECT EXISTS(
      SELECT 1 FROM ${groups} ug WHERE ug.id = ${ADMIN_GROUP_ID}::uuid
    ) AS is_admin
  `)
  return result[0]?.is_admin ?? false
}

/**
 * Batch-check permissions for multiple entity IDs at once.
 * Returns a Map of entityId → Set of granted permission names.
 * Walks the group hierarchy only once, regardless of how many entities/permissions.
 */
export async function batchCheckPermissions(
  db: PostgresJsDatabase<Record<string, unknown>>,
  personalGroupId: string,
  entityIds: string[],
  permissionNames: string[],
  entityTypeName: string,
): Promise<Map<string, Set<string>>> {
  if (entityIds.length === 0) return new Map()

  const groups = userGroupsSubquery(personalGroupId)
  const rows = await db.execute<{ entity_id: string; permission_name: string }>(sql`
    SELECT p.entity_id, etp.name AS permission_name
    FROM permissions p
    INNER JOIN entity_types_permissions etp ON etp.id = p.permission_id
    INNER JOIN entity_types et ON et.id = etp.entity_type_id
    WHERE p.entity_id IN ${sql`(${sql.join(entityIds.map((id) => sql`${id}::uuid`), sql`, `)})`}
      AND et.name = ${entityTypeName}
      AND etp.name IN ${sql`(${sql.join(permissionNames.map((n) => sql`${n}`), sql`, `)})`}
      AND p.user_group_id IN (SELECT id FROM ${groups} ug)
  `)

  const result = new Map<string, Set<string>>()
  for (const row of rows) {
    let perms = result.get(row.entity_id)
    if (!perms) {
      perms = new Set()
      result.set(row.entity_id, perms)
    }
    perms.add(row.permission_name)
  }
  return result
}

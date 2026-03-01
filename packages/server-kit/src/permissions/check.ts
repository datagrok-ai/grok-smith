import { sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import { ADMIN_GROUP_ID } from '@datagrok/core-schema'

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
  const result = await db.execute<{ has_permission: boolean }>(sql`
    WITH RECURSIVE user_groups(id) AS (
      SELECT ${personalGroupId}::uuid
      UNION ALL
      SELECT r.parent_id
      FROM user_groups ug
      INNER JOIN groups_relations r ON r.child_id = ug.id
    )
    SELECT EXISTS(
      -- Admin bypass: member of admin group can do anything
      SELECT 1 FROM user_groups WHERE id = ${ADMIN_GROUP_ID}::uuid
      UNION ALL
      -- Normal permission check
      SELECT 1
      FROM permissions p
      INNER JOIN entity_types_permissions etp ON etp.id = p.permission_id
      INNER JOIN entity_types et ON et.id = etp.entity_type_id
      WHERE p.entity_id = ${entityId}::uuid
        AND etp.name = ${permissionName}
        AND et.name = ${entityTypeName}
        AND p.user_group_id IN (SELECT id FROM user_groups)
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
  const result = await db.execute<{ is_admin: boolean }>(sql`
    WITH RECURSIVE user_groups(id) AS (
      SELECT ${personalGroupId}::uuid
      UNION ALL
      SELECT r.parent_id
      FROM user_groups ug
      INNER JOIN groups_relations r ON r.child_id = ug.id
    )
    SELECT EXISTS(
      SELECT 1 FROM user_groups WHERE id = ${ADMIN_GROUP_ID}::uuid
    ) AS is_admin
  `)
  return result[0]?.is_admin ?? false
}

import { sql } from 'drizzle-orm'

import { ADMIN_GROUP_ID } from '@datagrok/core-schema'

/**
 * Returns a SQL subquery that produces entity IDs visible to the user
 * for a given entity type. Inject into WHERE clauses for read operations.
 *
 * Admin group members see all entities (no filter applied).
 */
export function visibleEntitiesSql(personalGroupId: string, entityTypeName: string) {
  return sql`(
    WITH RECURSIVE user_groups(id) AS (
      SELECT ${personalGroupId}::uuid
      UNION ALL
      SELECT r.parent_id
      FROM user_groups ug
      INNER JOIN groups_relations r ON r.child_id = ug.id
    )
    SELECT p.entity_id
    FROM permissions p
    INNER JOIN entity_types_permissions etp ON etp.id = p.permission_id
    INNER JOIN entity_types et ON et.id = etp.entity_type_id
    WHERE etp.name = 'View'
      AND et.name = ${entityTypeName}
      AND p.user_group_id IN (SELECT id FROM user_groups)
  )`
}

/**
 * Returns a SQL expression that evaluates to true if the user is an admin.
 * Use this to short-circuit visibility filters.
 */
export function isAdminSql(personalGroupId: string) {
  return sql`EXISTS(
    WITH RECURSIVE user_groups(id) AS (
      SELECT ${personalGroupId}::uuid
      UNION ALL
      SELECT r.parent_id
      FROM user_groups ug
      INNER JOIN groups_relations r ON r.child_id = ug.id
    )
    SELECT 1 FROM user_groups WHERE id = ${ADMIN_GROUP_ID}::uuid
  )`
}

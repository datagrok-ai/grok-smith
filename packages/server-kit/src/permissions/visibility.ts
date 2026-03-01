import { sql } from 'drizzle-orm'

import { ADMIN_GROUP_ID } from '@datagrok/core-schema'

import { userGroupsSubquery } from './group-resolution.js'

/**
 * Returns a SQL subquery that produces entity IDs visible to the user
 * for a given entity type. Inject into WHERE clauses for read operations.
 *
 * Admin group members see all entities (no filter applied).
 */
export function visibleEntitiesSql(personalGroupId: string, entityTypeName: string) {
  const groups = userGroupsSubquery(personalGroupId)
  return sql`(
    SELECT p.entity_id
    FROM permissions p
    INNER JOIN entity_types_permissions etp ON etp.id = p.permission_id
    INNER JOIN entity_types et ON et.id = etp.entity_type_id
    WHERE etp.name = 'View'
      AND et.name = ${entityTypeName}
      AND p.user_group_id IN (SELECT id FROM ${groups} ug)
  )`
}

/**
 * Returns a SQL expression that evaluates to true if the user is an admin.
 * Use this to short-circuit visibility filters.
 */
export function isAdminSql(personalGroupId: string) {
  const groups = userGroupsSubquery(personalGroupId)
  return sql`EXISTS(
    SELECT 1 FROM ${groups} ug WHERE ug.id = ${ADMIN_GROUP_ID}::uuid
  )`
}

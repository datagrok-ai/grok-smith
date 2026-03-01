import { sql } from 'drizzle-orm'

/**
 * Returns a SQL fragment that produces a CTE named `user_groups` containing
 * all group IDs the given user belongs to (personal group + all ancestors
 * via groups_relations).
 */
export function userGroupsCTE(personalGroupId: string) {
  return sql`
    WITH RECURSIVE user_groups(id) AS (
      SELECT ${personalGroupId}::uuid
      UNION ALL
      SELECT r.parent_id
      FROM user_groups ug
      INNER JOIN groups_relations r ON r.child_id = ug.id
    )
  `
}

/**
 * Returns a SQL subquery (no CTE wrapper) that produces all group IDs
 * for a given personal group. Use this inside IN clauses when a CTE
 * can't be used (e.g., inside subqueries).
 */
export function userGroupsSubquery(personalGroupId: string) {
  return sql`(
    WITH RECURSIVE ug(id) AS (
      SELECT ${personalGroupId}::uuid
      UNION ALL
      SELECT r.parent_id
      FROM ug
      INNER JOIN groups_relations r ON r.child_id = ug.id
    )
    SELECT id FROM ug
  )`
}

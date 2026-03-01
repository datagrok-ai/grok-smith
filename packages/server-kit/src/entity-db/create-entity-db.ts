import { getTableColumns, type Table } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import type { UserContext } from '../permissions/types.js'

import { createEntityAccessor } from './entity-accessor.js'
import type { EntityAccessor, EntityTableConfig } from './types.js'

/**
 * Scans all tables in the Drizzle schema. For each table that has an
 * `entity_id` column, creates a Prisma-shaped accessor with permission-aware
 * CRUD methods.
 *
 * @param db - Drizzle database instance
 * @param schema - Drizzle schema object (import * as schema from '...')
 * @param entityTypeMap - Maps JS table variable names to entity type names
 *                        e.g. { sendStudies: 'Study', gritIssues: 'Issue' }
 * @param getUserContext - Returns the current user's context (userId + personalGroupId)
 * @returns Object with accessors like { sendStudies: { findMany, create, ... } }
 */
export function createEntityDb(
  db: PostgresJsDatabase<Record<string, unknown>>,
  schema: Record<string, unknown>,
  entityTypeMap: Record<string, string>,
  getUserContext: () => UserContext,
): Record<string, EntityAccessor> {
  const entity: Record<string, EntityAccessor> = {}

  for (const [name, tableOrOther] of Object.entries(schema)) {
    // Skip non-table entries (relations, types, etc.)
    if (!isTable(tableOrOther)) continue

    const table = tableOrOther as PgTable
    const columns = getTableColumns(table)

    // Check if this table has an entityId column
    if (!('entityId' in columns)) continue

    // Look up the entity type name from the map
    const entityTypeName = entityTypeMap[name]
    if (!entityTypeName) continue

    const columnList = Object.values(columns)
    const config: EntityTableConfig = {
      table: table as Table,
      tableName: name,
      accessorName: name,
      columns: columnList,
      entityTypeName,
    }

    entity[name] = createEntityAccessor(db, config, getUserContext)
  }

  return entity
}

/** Duck-type check for Drizzle table objects */
function isTable(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    Symbol.for('drizzle:IsDrizzleTable') in (value as Record<symbol, unknown>)
  )
}

import { getTableColumns, type Table } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import type { UserContext } from '../permissions/types.js'

import { createEntityAccessor } from './entity-accessor.js'
import type { EntityAccessor, EntityTableConfig } from './types.js'

/**
 * Scans a Drizzle schema for entity tables (those with an `entityId` column)
 * and returns the static config for each. This is the expensive part that
 * only needs to run once per schema.
 */
export function scanEntityTables(
  schema: Record<string, unknown>,
  entityTypeMap: Record<string, string>,
): EntityTableConfig[] {
  const configs: EntityTableConfig[] = []

  for (const [name, tableOrOther] of Object.entries(schema)) {
    if (!isTable(tableOrOther)) continue

    const table = tableOrOther as PgTable
    const columns = getTableColumns(table)
    if (!('entityId' in columns)) continue

    const entityTypeName = entityTypeMap[name]
    if (!entityTypeName) continue

    configs.push({
      table: table as Table,
      tableName: name,
      entityTypeName,
    })
  }

  return configs
}

/**
 * Creates entity accessors from pre-scanned configs.
 * Cheap to call per-request since configs are cached.
 */
export function createEntityDb(
  db: PostgresJsDatabase<Record<string, unknown>>,
  schema: Record<string, unknown>,
  entityTypeMap: Record<string, string>,
  getUserContext: () => UserContext,
): Record<string, EntityAccessor> {
  const configs = scanEntityTables(schema, entityTypeMap)
  const entity: Record<string, EntityAccessor> = {}

  for (const config of configs) {
    entity[config.tableName] = createEntityAccessor(db, config, getUserContext)
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

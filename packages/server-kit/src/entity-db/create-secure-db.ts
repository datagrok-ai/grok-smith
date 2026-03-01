import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import type { UserContext } from '../permissions/types.js'

import { scanEntityTables } from './create-entity-db.js'
import { createEntityAccessor } from './entity-accessor.js'
import type { EntityAccessor, EntityTableConfig } from './types.js'

export type SecureDb<TSchema extends Record<string, unknown> = Record<string, unknown>> =
  PostgresJsDatabase<TSchema> & {
    entity: Record<string, EntityAccessor>
  }

// Module-level cache: schema identity → configs
const configCache = new WeakMap<object, EntityTableConfig[]>()

/**
 * Creates a secure database wrapper that includes both:
 * - Standard Drizzle methods (`db.select()`, `db.insert()`, etc.) for non-entity tables
 * - `db.entity.*` accessors for entity tables with automatic permission filtering
 *
 * Schema scanning is cached — only the first call per schema object pays the scan cost.
 */
export function createSecureDb<TSchema extends Record<string, unknown>>(
  drizzleDb: PostgresJsDatabase<TSchema>,
  schema: TSchema,
  entityTypeMap: Record<string, string>,
  getUserContext: () => UserContext,
): SecureDb<TSchema> {
  // Cache the schema scan (configs are static, only getUserContext varies per request)
  let configs = configCache.get(schema)
  if (!configs) {
    configs = scanEntityTables(schema as Record<string, unknown>, entityTypeMap)
    configCache.set(schema, configs)
  }

  const db = drizzleDb as PostgresJsDatabase<Record<string, unknown>>
  const entityAccessors: Record<string, EntityAccessor> = {}
  for (const config of configs) {
    entityAccessors[config.tableName] = createEntityAccessor(db, config, getUserContext)
  }

  // Create a proxy that delegates to the original Drizzle instance
  // but adds the .entity property
  const proxy = new Proxy(drizzleDb, {
    get(target, prop, receiver) {
      if (prop === 'entity') {
        return entityAccessors
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return Reflect.get(target, prop, receiver)
    },
  })

  return proxy as SecureDb<TSchema>
}

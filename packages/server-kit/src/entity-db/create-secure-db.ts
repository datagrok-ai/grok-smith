import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

import type { UserContext } from '../permissions/types.js'

import { createEntityDb } from './create-entity-db.js'
import type { EntityAccessor } from './types.js'

export type SecureDb<TSchema extends Record<string, unknown> = Record<string, unknown>> =
  PostgresJsDatabase<TSchema> & {
    entity: Record<string, EntityAccessor>
  }

/**
 * Creates a secure database wrapper that includes both:
 * - Standard Drizzle methods (`db.select()`, `db.insert()`, etc.) for non-entity tables
 * - `db.entity.*` accessors for entity tables with automatic permission filtering
 *
 * @param drizzleDb - The raw Drizzle database instance
 * @param schema - Drizzle schema object
 * @param entityTypeMap - Maps JS table names to entity type names
 * @param getUserContext - Returns current user's context
 */
export function createSecureDb<TSchema extends Record<string, unknown>>(
  drizzleDb: PostgresJsDatabase<TSchema>,
  schema: TSchema,
  entityTypeMap: Record<string, string>,
  getUserContext: () => UserContext,
): SecureDb<TSchema> {
  const entityAccessors = createEntityDb(
    drizzleDb as PostgresJsDatabase<Record<string, unknown>>,
    schema as Record<string, unknown>,
    entityTypeMap,
    getUserContext,
  )

  // Create a proxy that delegates to the original Drizzle instance
  // but adds the .entity property
  const proxy = new Proxy(drizzleDb, {
    get(target, prop, receiver) {
      if (prop === 'entity') {
        return entityAccessors
      }
      return Reflect.get(target, prop, receiver)
    },
  })

  return proxy as SecureDb<TSchema>
}

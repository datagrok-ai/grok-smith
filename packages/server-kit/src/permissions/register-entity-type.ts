import { sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

const STANDARD_PERMISSIONS = ['View', 'Edit', 'Delete', 'Share']

/**
 * Registers an entity type if it doesn't exist.
 * Creates the standard View/Edit/Delete/Share permissions for it.
 * Idempotent — safe to call on every app startup.
 *
 * @param db - Drizzle database instance
 * @param name - Entity type name, e.g. 'Study'
 * @param additionalPermissions - Extra permissions beyond the standard four
 */
export async function registerEntityType(
  db: PostgresJsDatabase<Record<string, unknown>>,
  name: string,
  additionalPermissions?: string[],
): Promise<void> {
  // Upsert entity type
  await db.execute(sql`
    INSERT INTO entity_types (id, name, is_package_entity)
    VALUES (gen_random_uuid(), ${name}, true)
    ON CONFLICT (name) DO NOTHING
  `)

  // Get the entity type ID (may have been pre-existing)
  const result = await db.execute<{ id: string }>(sql`
    SELECT id FROM entity_types WHERE name = ${name}
  `)
  const entityTypeId = result[0]?.id
  if (!entityTypeId) {
    throw new Error(`Failed to resolve entity type '${name}'`)
  }

  // Insert standard + additional permissions
  const allPerms = [...STANDARD_PERMISSIONS, ...(additionalPermissions ?? [])]
  for (const permName of allPerms) {
    await db.execute(sql`
      INSERT INTO entity_types_permissions (id, name, entity_type_id)
      VALUES (gen_random_uuid(), ${permName}, ${entityTypeId}::uuid)
      ON CONFLICT (name, entity_type_id) DO NOTHING
    `)
  }
}

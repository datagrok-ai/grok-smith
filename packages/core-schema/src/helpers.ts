import { uuid, timestamp } from 'drizzle-orm/pg-core'

import { entities, users } from './schema.js'

/**
 * Audit columns for entity tables — top-level things users create and own
 * (studies, compounds, projects). Returns:
 * - `id` — UUID PK
 * - `entityId` — FK → entities.id (links to the Datagrok privilege system)
 * - `createdAt`, `updatedAt` — timestamps
 * - `createdBy` — FK → users.id
 *
 * Do NOT use on detail/child tables (findings, trial_arms, exposures, etc.)
 * that cascade-delete with a parent. Those only need a UUID `id`.
 *
 * ```ts
 * export const studies = appSchema.table('studies', {
 *   ...auditColumns(),
 *   title: varchar('title', { length: 500 }).notNull(),
 * })
 * ```
 */
export function auditColumns() {
  return {
    id: uuid('id').primaryKey().defaultRandom(),
    entityId: uuid('entity_id').references(() => entities.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdBy: uuid('created_by').notNull().references(() => users.id),
  }
}

import { pgSchema, uuid, timestamp } from 'drizzle-orm/pg-core'

export const appSchema = pgSchema('{{APP_NAME}}')

/**
 * Helper: base columns included in every table.
 * Copy these into each table definition.
 */
export const baseColumns = {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdBy: uuid('created_by').notNull(),
}

import { pgSchema } from 'drizzle-orm/pg-core'

export { auditColumns } from '@datagrok/core-schema'

export const appSchema = pgSchema('{{APP_NAME}}')

// Define your tables here using appSchema.table() and auditColumns():
//
// import { varchar } from 'drizzle-orm/pg-core'
//
// export const myTable = appSchema.table('my_table', {
//   ...auditColumns(),
//   name: varchar('name', { length: 200 }).notNull(),
// })

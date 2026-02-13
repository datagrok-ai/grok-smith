import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './shared/schema.ts',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgresql://datagrok:datagrok_local@localhost:5433/datagrok_dev',
  },
})

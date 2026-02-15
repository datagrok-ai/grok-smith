import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import postgres from 'postgres'
import type { AppVariables } from '@datagrok/server-kit'

const DEFAULT_DATABASE_URL = 'postgresql://datagrok:datagrok_local@localhost:5433/datagrok_dev'

const sql = postgres(process.env['DATABASE_URL'] ?? DEFAULT_DATABASE_URL, {
  idle_timeout: 20,
  max_lifetime: 60 * 30,
})

interface SchemaRow {
  schema_name: string
}

interface TableRow {
  table_name: string
  table_type: string
  estimated_row_count: string | number
}

interface ColumnRow {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  ordinal_position: string | number
}

interface TableCheckRow {
  table_schema: string
  table_name: string
}

export const schemasRoute = new Hono<{ Variables: AppVariables }>()

// GET /schemas — list all user schemas
schemasRoute.get('/schemas', async (c) => {
  const rows = await sql<SchemaRow[]>`
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name NOT LIKE 'pg_%'
      AND schema_name <> 'information_schema'
    ORDER BY schema_name
  `
  return c.json(rows.map((r) => r.schema_name))
})

// GET /schemas/:schema/tables — list tables in a schema
schemasRoute.get('/schemas/:schema/tables', async (c) => {
  const schema = c.req.param('schema')

  // Validate schema exists
  const schemaCheck = await sql`
    SELECT 1 FROM information_schema.schemata
    WHERE schema_name = ${schema}
      AND schema_name NOT LIKE 'pg_%'
      AND schema_name <> 'information_schema'
  `
  if (schemaCheck.length === 0) {
    throw new HTTPException(404, { message: `Schema '${schema}' not found` })
  }

  const rows = await sql<TableRow[]>`
    SELECT
      t.table_name,
      t.table_type,
      COALESCE(s.n_live_tup, 0) AS estimated_row_count
    FROM information_schema.tables t
    LEFT JOIN pg_stat_user_tables s
      ON s.schemaname = t.table_schema AND s.relname = t.table_name
    WHERE t.table_schema = ${schema}
    ORDER BY t.table_name
  `

  return c.json(
    rows.map((r) => ({
      table_name: r.table_name,
      table_type: r.table_type,
      estimated_row_count: Number(r.estimated_row_count),
    })),
  )
})

// GET /schemas/:schema/tables/:table/columns — list columns of a table
schemasRoute.get('/schemas/:schema/tables/:table/columns', async (c) => {
  const schema = c.req.param('schema')
  const table = c.req.param('table')

  // Validate table exists in schema
  const tableCheck = await sql`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = ${schema} AND table_name = ${table}
  `
  if (tableCheck.length === 0) {
    throw new HTTPException(404, { message: `Table '${schema}.${table}' not found` })
  }

  const rows = await sql<ColumnRow[]>`
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default,
      ordinal_position
    FROM information_schema.columns
    WHERE table_schema = ${schema} AND table_name = ${table}
    ORDER BY ordinal_position
  `

  return c.json(
    rows.map((r) => ({
      column_name: r.column_name,
      data_type: r.data_type,
      is_nullable: r.is_nullable === 'YES',
      column_default: r.column_default,
      ordinal_position: Number(r.ordinal_position),
    })),
  )
})

// GET /schemas/:schema/tables/:table/data — fetch table data (SELECT * LIMIT 1000)
schemasRoute.get('/schemas/:schema/tables/:table/data', async (c) => {
  const schema = c.req.param('schema')
  const table = c.req.param('table')

  // Validate table exists in schema (prevents SQL injection)
  const tableCheck = await sql<TableCheckRow[]>`
    SELECT table_schema, table_name FROM information_schema.tables
    WHERE table_schema = ${schema} AND table_name = ${table}
  `
  if (tableCheck.length === 0) {
    throw new HTTPException(404, { message: `Table '${schema}.${table}' not found` })
  }

  // Safe to use validated identifiers in dynamic SQL
  const validatedSchema = tableCheck[0].table_schema
  const validatedTable = tableCheck[0].table_name

  const rows = await sql.unsafe(
    `SELECT * FROM "${validatedSchema}"."${validatedTable}" LIMIT 1000`,
  )

  return c.json(rows)
})

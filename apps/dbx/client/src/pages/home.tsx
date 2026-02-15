import { useCallback, useEffect, useRef, useState } from 'react'

import { View, useApi, ApiRequestError, DataGrid, Skeleton, Alert, AlertDescription } from '@datagrok/app-kit'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TableInfo {
  table_name: string
  table_type: string
  estimated_row_count: number
}

interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: boolean
  column_default: string | null
  ordinal_position: number
}

type Selection =
  | { level: 'root' }
  | { level: 'schema'; schema: string }
  | { level: 'table'; schema: string; table: string }

// ---------------------------------------------------------------------------
// Schema Tree (rendered in toolbox)
// ---------------------------------------------------------------------------

function SchemaTree({
  schemas,
  selection,
  onSelectSchema,
  onSelectTable,
}: {
  schemas: string[]
  selection: Selection
  onSelectSchema: (schema: string) => void
  onSelectTable: (schema: string, table: string) => void
}) {
  const api = useApi()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [tables, setTables] = useState<Record<string, TableInfo[]>>({})
  const [columns, setColumns] = useState<Record<string, ColumnInfo[]>>({})
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({})

  function toggleSchema(schema: string) {
    const isOpen = !expanded[schema]
    setExpanded((prev) => ({ ...prev, [schema]: isOpen }))

    if (isOpen && !tables[schema]) {
      void api.get<TableInfo[]>(`/schemas/${schema}/tables`).then((data) => {
        setTables((prev) => ({ ...prev, [schema]: data }))
      })
    }
  }

  function toggleTable(schema: string, table: string) {
    const key = `${schema}.${table}`
    const isOpen = !expandedTables[key]
    setExpandedTables((prev) => ({ ...prev, [key]: isOpen }))

    if (isOpen && !columns[key]) {
      void api.get<ColumnInfo[]>(`/schemas/${schema}/tables/${table}/columns`).then((data) => {
        setColumns((prev) => ({ ...prev, [key]: data }))
      })
    }
  }

  return (
    <div className="p-2">
      <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Schemas
      </div>
      {schemas.map((schema) => {
        const isSchemaActive =
          (selection.level === 'schema' && selection.schema === schema) ||
          (selection.level === 'table' && selection.schema === schema)

        return (
          <div key={schema}>
            {/* Schema row */}
            <div className="flex items-center">
              <button
                type="button"
                className="px-1 py-1 text-[10px] text-muted-foreground hover:text-foreground"
                onClick={() => toggleSchema(schema)}
              >
                {expanded[schema] ? '\u25BC' : '\u25B6'}
              </button>
              <button
                type="button"
                className={`flex-1 rounded px-2 py-1 text-left text-sm hover:bg-muted ${
                  selection.level === 'schema' && selection.schema === schema
                    ? 'bg-primary/10 font-medium text-primary'
                    : isSchemaActive
                      ? 'font-medium text-foreground'
                      : 'text-foreground'
                }`}
                onClick={() => onSelectSchema(schema)}
              >
                {schema}
              </button>
            </div>

            {/* Tables under schema */}
            {expanded[schema] && (
              <div className="ml-3">
                {!tables[schema] && (
                  <div className="px-3 py-1 text-xs text-muted-foreground">Loading...</div>
                )}
                {tables[schema]?.map((t) => {
                  const tableKey = `${schema}.${t.table_name}`
                  const isTableActive =
                    selection.level === 'table' &&
                    selection.schema === schema &&
                    selection.table === t.table_name

                  return (
                    <div key={t.table_name}>
                      <div className="flex items-center">
                        <button
                          type="button"
                          className="px-1 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                          onClick={() => toggleTable(schema, t.table_name)}
                        >
                          {expandedTables[tableKey] ? '\u25BC' : '\u25B6'}
                        </button>
                        <button
                          type="button"
                          className={`flex-1 rounded px-2 py-0.5 text-left text-sm hover:bg-muted ${
                            isTableActive
                              ? 'bg-primary/10 font-medium text-primary'
                              : 'text-foreground'
                          }`}
                          onClick={() => onSelectTable(schema, t.table_name)}
                        >
                          <span className="font-mono text-xs">{t.table_name}</span>
                        </button>
                      </div>

                      {/* Columns under table */}
                      {expandedTables[tableKey] && (
                        <div className="ml-5">
                          {!columns[tableKey] && (
                            <div className="px-2 py-0.5 text-xs text-muted-foreground">
                              Loading...
                            </div>
                          )}
                          {columns[tableKey]?.map((col) => (
                            <div
                              key={col.column_name}
                              className="flex items-center gap-2 px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              <span className="font-mono text-foreground">{col.column_name}</span>
                              <span>{col.data_type}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Context Panel
// ---------------------------------------------------------------------------

function ContextPanelContent({
  selection,
  tables,
  columns,
}: {
  selection: Selection
  tables: TableInfo[]
  columns: ColumnInfo[]
}) {
  if (selection.level === 'root') {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
        Select a schema or table
      </div>
    )
  }

  if (selection.level === 'schema') {
    return (
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Schema: {selection.schema}</h3>
        <DetailRow label="Tables" value={String(tables.length)} />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        {selection.schema}.{selection.table}
      </h3>
      <div className="space-y-2 pt-2">
        <DetailRow label="Schema" value={selection.schema} />
        <DetailRow label="Table" value={selection.table} />
        <DetailRow label="Columns" value={String(columns.length)} />
      </div>
      {columns.length > 0 && (
        <div className="pt-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">Columns</p>
          <div className="space-y-0.5">
            {columns.map((col) => (
              <div key={col.column_name} className="flex justify-between text-xs">
                <span className="font-mono text-foreground">{col.column_name}</span>
                <span className="text-muted-foreground">
                  {col.data_type}
                  {col.is_nullable ? '' : ' NOT NULL'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Format helpers for DataGrid
// ---------------------------------------------------------------------------

function formatHeaderName(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const api = useApi()
  const apiRef = useRef(api)
  apiRef.current = api

  const [schemas, setSchemas] = useState<string[]>([])
  const [selection, setSelection] = useState<Selection>({ level: 'root' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Grid data
  const [gridData, setGridData] = useState<Record<string, unknown>[]>([])

  // Context panel data
  const [contextTables, setContextTables] = useState<TableInfo[]>([])
  const [contextColumns, setContextColumns] = useState<ColumnInfo[]>([])

  // -------------------------------------------------------------------------
  // Fetch schemas on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    setLoading(true)
    void apiRef.current
      .get<string[]>('/schemas')
      .then((data) => {
        setSchemas(data)
        setLoading(false)
      })
      .catch((err) => {
        if (err instanceof ApiRequestError) {
          setError(`${String(err.status)}: ${err.body.error}`)
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load schemas')
        }
        setLoading(false)
      })
  }, [])

  // -------------------------------------------------------------------------
  // Selection handlers
  // -------------------------------------------------------------------------

  const handleSelectSchema = useCallback(
    (schema: string) => {
      setSelection({ level: 'schema', schema })
      setError(null)
      setLoading(true)

      void apiRef.current
        .get<TableInfo[]>(`/schemas/${schema}/tables`)
        .then((data) => {
          setGridData(data as unknown as Record<string, unknown>[])
          setContextTables(data)
          setContextColumns([])
          setLoading(false)
        })
        .catch((err) => {
          if (err instanceof ApiRequestError) {
            setError(`${String(err.status)}: ${err.body.error}`)
          } else {
            setError(err instanceof Error ? err.message : 'Failed to load tables')
          }
          setLoading(false)
        })
    },
    [],
  )

  const handleSelectTable = useCallback(
    (schema: string, table: string) => {
      setSelection({ level: 'table', schema, table })
      setError(null)
      setLoading(true)

      void Promise.all([
        apiRef.current.get<Record<string, unknown>[]>(
          `/schemas/${schema}/tables/${table}/data`,
        ),
        apiRef.current.get<ColumnInfo[]>(
          `/schemas/${schema}/tables/${table}/columns`,
        ),
      ])
        .then(([data, cols]) => {
          setGridData(data)
          setContextColumns(cols)
          setLoading(false)
        })
        .catch((err) => {
          if (err instanceof ApiRequestError) {
            setError(`${String(err.status)}: ${err.body.error}`)
          } else {
            setError(err instanceof Error ? err.message : 'Failed to load data')
          }
          setLoading(false)
        })
    },
    [],
  )

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------

  const breadcrumbs = [{ label: 'DBX' }]
  if (selection.level === 'schema' || selection.level === 'table') {
    breadcrumbs.push({ label: selection.schema })
  }
  if (selection.level === 'table') {
    breadcrumbs.push({ label: selection.table })
  }

  let status = `${String(schemas.length)} schemas`
  if (selection.level === 'schema') {
    status = `${String(contextTables.length)} tables in ${selection.schema}`
  } else if (selection.level === 'table') {
    status = `${String(gridData.length)} rows in ${selection.schema}.${selection.table}`
  }

  // Schema-level columns for the tables grid
  const tableColumnDefs = [
    { field: 'table_name', headerName: 'Name', flex: 1 },
    { field: 'table_type', headerName: 'Type', width: 140 },
    {
      field: 'estimated_row_count',
      headerName: 'Est. Rows',
      width: 120,
      align: 'right' as const,
      valueFormatter: ({ value }: { value: unknown }) =>
        Number(value).toLocaleString(),
    },
  ]

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <View
      name="Database Explorer"
      breadcrumbs={breadcrumbs}
      toolbox={
        <SchemaTree
          schemas={schemas}
          selection={selection}
          onSelectSchema={handleSelectSchema}
          onSelectTable={handleSelectTable}
        />
      }
      contextPanel={
        <ContextPanelContent
          selection={selection}
          tables={contextTables}
          columns={contextColumns}
        />
      }
      status={status}
    >
      <div className="flex flex-1 flex-col overflow-hidden" style={{ height: '100%' }}>
        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {loading && (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        )}

        {!loading && !error && selection.level === 'root' && (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Select a schema from the tree to browse tables
          </div>
        )}

        {!loading && !error && selection.level === 'schema' && (
          <DataGrid
            rowData={gridData}
            columnDefs={tableColumnDefs}
            getRowId={(r) => r.table_name as string}
            onRowClicked={(r) =>
              handleSelectTable(
                (selection as { schema: string }).schema,
                r.table_name as string,
              )
            }
          />
        )}

        {!loading && !error && selection.level === 'table' && (
          <DataGrid
            rowData={gridData}
            autoColumns
            formatHeader={formatHeaderName}
            formatCell={formatCellValue}
          />
        )}
      </div>
    </View>
  )
}

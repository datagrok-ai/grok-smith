import { useCallback, useEffect, useRef, useState } from 'react'

import { View, useApi, ApiRequestError, DataGrid, Skeleton, Alert, AlertDescription, TreeView } from '@datagrok/app-kit'
import type { TreeViewItem } from '@datagrok/app-kit'

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
// Tree data helpers (for Schema Tree in toolbox)
// ---------------------------------------------------------------------------

function buildSchemaTreeData(
  schemas: string[],
  tables: Record<string, TableInfo[]>,
  columns: Record<string, ColumnInfo[]>,
): TreeViewItem[] {
  return schemas.map((schema) => ({
    id: `schema:${schema}`,
    name: schema,
    // undefined = not loaded yet, array = loaded
    children: tables[schema]
      ? tables[schema].map((t) => {
          const tableKey = `${schema}.${t.table_name}`
          return {
            id: `table:${schema}.${t.table_name}`,
            name: t.table_name,
            children: columns[tableKey]
              ? columns[tableKey].map((col) => ({
                  id: `col:${tableKey}.${col.column_name}`,
                  name: col.column_name,
                  children: [] as TreeViewItem[],
                }))
              : undefined,
          }
        })
      : undefined,
  }))
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

  // Tree lazy-load caches
  const [treeTables, setTreeTables] = useState<Record<string, TableInfo[]>>({})
  const [treeColumns, setTreeColumns] = useState<Record<string, ColumnInfo[]>>({})

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
  // Tree handlers
  // -------------------------------------------------------------------------

  const treeData = buildSchemaTreeData(schemas, treeTables, treeColumns)

  const handleTreeExpand = useCallback(
    (item: TreeViewItem, expanded: boolean) => {
      if (!expanded) return

      if (item.id.startsWith('schema:')) {
        const schema = item.id.slice('schema:'.length)
        if (!treeTables[schema]) {
          void apiRef.current.get<TableInfo[]>(`/schemas/${schema}/tables`).then((data) => {
            setTreeTables((prev) => ({ ...prev, [schema]: data }))
          })
        }
      } else if (item.id.startsWith('table:')) {
        const tableKey = item.id.slice('table:'.length)
        if (!treeColumns[tableKey]) {
          const [schema, table] = tableKey.split('.')
          void apiRef.current.get<ColumnInfo[]>(`/schemas/${schema}/tables/${table}/columns`).then((data) => {
            setTreeColumns((prev) => ({ ...prev, [tableKey]: data }))
          })
        }
      }
    },
    [treeTables, treeColumns],
  )

  const handleTreeSelect = useCallback(
    (item: TreeViewItem) => {
      if (item.id.startsWith('schema:')) {
        handleSelectSchema(item.id.slice('schema:'.length))
      } else if (item.id.startsWith('table:')) {
        const key = item.id.slice('table:'.length)
        const dotIdx = key.indexOf('.')
        handleSelectTable(key.slice(0, dotIdx), key.slice(dotIdx + 1))
      }
    },
    [handleSelectSchema, handleSelectTable],
  )

  function getTreeSelectedId(): string | null {
    if (selection.level === 'schema') return `schema:${selection.schema}`
    if (selection.level === 'table') return `table:${selection.schema}.${selection.table}`
    return null
  }

  const renderTreeItem = useCallback(
    (item: TreeViewItem) => {
      if (item.id.startsWith('col:')) {
        // Find the column info for data type display
        const colParts = item.id.slice('col:'.length)
        const lastDot = colParts.lastIndexOf('.')
        const tableKey = colParts.slice(0, lastDot)
        const col = treeColumns[tableKey]?.find((c) => c.column_name === item.name)
        return (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono text-foreground">{item.name}</span>
            {col && <span>{col.data_type}</span>}
          </span>
        )
      }
      if (item.id.startsWith('table:')) {
        return <span className="font-mono text-xs">{item.name}</span>
      }
      return <span className="truncate">{item.name}</span>
    },
    [treeColumns],
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
        <TreeView
          data={treeData}
          selectedId={getTreeSelectedId()}
          onSelect={handleTreeSelect}
          onExpand={handleTreeExpand}
          renderItem={renderTreeItem}
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

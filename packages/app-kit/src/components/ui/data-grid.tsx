import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule } from 'ag-grid-community'
import type { ColDef, GridApi, GridReadyEvent, RowClickedEvent } from 'ag-grid-community'

import { cn } from '../../lib/cn'

export interface DataGridColumn<TData> {
  field: string
  headerName?: string
  width?: number
  minWidth?: number
  flex?: number
  cellRenderer?: (params: { data: TData; value: unknown }) => ReactNode
  cellClass?: string | string[]
  valueFormatter?: (params: { value: unknown }) => string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  resizable?: boolean
  pinned?: 'left' | 'right' | null
  sort?: 'asc' | 'desc' | null
}

export interface DataGridProps<TData> {
  rowData: TData[]
  columnDefs?: Array<DataGridColumn<TData>>
  autoColumns?: boolean
  getRowId?: (data: TData) => string
  onRowClicked?: (data: TData) => void
  height?: string | number
  className?: string
  loading?: boolean
  noRowsMessage?: string
  formatHeader?: (field: string) => string
  formatCell?: (value: unknown) => string
  onGridReady?: (api: GridApi<TData>) => void
}

function toColDefs<TData>(columns: Array<DataGridColumn<TData>>): ColDef[] {
  return columns.map((col) => {
    // Use ColDef (untyped) because our field is a plain string that may not be keyof TData
    const def: ColDef = {
      field: col.field,
      headerName: col.headerName,
      width: col.width,
      minWidth: col.minWidth,
      flex: col.flex,
      sortable: col.sortable,
      resizable: col.resizable,
      pinned: col.pinned ?? undefined,
      sort: col.sort ?? undefined,
    }

    if (col.cellRenderer) {
      const renderer = col.cellRenderer
      def.cellRenderer = (params: { data: TData; value: unknown }) => renderer(params)
    }

    if (col.cellClass) {
      def.cellClass = col.cellClass
    }

    if (col.valueFormatter) {
      const formatter = col.valueFormatter
      def.valueFormatter = (params: { value: unknown }) => formatter(params)
    }

    if (col.align === 'right') {
      def.cellClass = cn(
        typeof col.cellClass === 'string' ? col.cellClass : undefined,
        'text-right',
      )
      def.headerClass = 'ag-right-aligned-header'
    } else if (col.align === 'center') {
      def.cellClass = cn(
        typeof col.cellClass === 'string' ? col.cellClass : undefined,
        'text-center',
      )
      def.headerClass = 'ag-center-aligned-header'
    }

    return def
  })
}

function buildAutoColumns<TData>(
  data: TData[],
  formatHeader?: (field: string) => string,
  formatCell?: (value: unknown) => string,
): ColDef[] {
  if (data.length === 0) return []

  const firstRow = data[0] as Record<string, unknown>
  const visibleKeys = Object.keys(firstRow).filter((key) =>
    data.some((row) => {
      const val = (row as Record<string, unknown>)[key]
      return val != null && val !== ''
    }),
  )

  return visibleKeys.map((key) => {
    const def: ColDef = {
      field: key,
      headerName: formatHeader ? formatHeader(key) : key,
    }

    if (formatCell) {
      const formatter = formatCell
      def.valueFormatter = (params: { value: unknown }) => formatter(params.value)
    }

    return def
  })
}

export function DataGrid<TData>({
  rowData,
  columnDefs,
  autoColumns,
  getRowId,
  onRowClicked,
  height = '100%',
  className,
  loading,
  noRowsMessage,
  formatHeader,
  formatCell,
  onGridReady,
}: DataGridProps<TData>) {
  const agColDefs = useMemo(() => {
    if (columnDefs) return toColDefs(columnDefs)
    if (autoColumns) return buildAutoColumns(rowData, formatHeader, formatCell)
    return []
  }, [columnDefs, autoColumns, rowData, formatHeader, formatCell])

  const isAutoHeight = height === 'auto'

  const containerStyle = useMemo(
    () => (isAutoHeight ? undefined : { height: typeof height === 'number' ? `${String(height)}px` : height }),
    [height, isAutoHeight],
  )

  function handleGridReady(event: GridReadyEvent<TData>) {
    if (onGridReady) onGridReady(event.api)
  }

  function handleRowClicked(event: RowClickedEvent<TData>) {
    if (onRowClicked && event.data) onRowClicked(event.data)
  }

  return (
    <div className={cn('ag-theme-quartz ag-theme-datagrok', className)} style={containerStyle}>
      <AgGridReact<TData>
        modules={[AllCommunityModule]}
        rowData={rowData}
        columnDefs={agColDefs}
        getRowId={getRowId ? (params) => getRowId(params.data) : undefined}
        onRowClicked={onRowClicked ? handleRowClicked : undefined}
        onGridReady={handleGridReady}
        suppressCellFocus
        domLayout={isAutoHeight ? 'autoHeight' : 'normal'}
        loading={loading}
        overlayNoRowsTemplate={noRowsMessage ?? 'No rows to display'}
        defaultColDef={{
          sortable: true,
          resizable: true,
        }}
      />
    </div>
  )
}

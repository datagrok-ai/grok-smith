import { useState } from 'react'

import { DataGrid, Badge } from '@datagrok/app-kit'
import type { DataGridColumn } from '@datagrok/app-kit'

function DemoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">{title}</h3>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

interface Study {
  id: string
  studyId: string
  title: string
  species: string
  status: string
  subjects: number
  createdAt: string
}

const sampleStudies: Study[] = [
  { id: '1', studyId: 'XY-2024-001', title: '28-day oral toxicity in rats', species: 'Rat', status: 'active', subjects: 40, createdAt: '2024-11-15' },
  { id: '2', studyId: 'XY-2024-002', title: '13-week dermal toxicity in dogs', species: 'Dog', status: 'approved', subjects: 24, createdAt: '2024-10-22' },
  { id: '3', studyId: 'XY-2024-003', title: 'Single dose PK study', species: 'Monkey', status: 'draft', subjects: 12, createdAt: '2024-12-01' },
  { id: '4', studyId: 'XY-2024-004', title: 'Carcinogenicity study in mice', species: 'Mouse', status: 'active', subjects: 200, createdAt: '2024-09-05' },
  { id: '5', studyId: 'XY-2024-005', title: 'Reproductive toxicity', species: 'Rat', status: 'completed', subjects: 80, createdAt: '2024-08-18' },
  { id: '6', studyId: 'XY-2024-006', title: 'Acute inhalation toxicity', species: 'Rat', status: 'rejected', subjects: 16, createdAt: '2024-07-10' },
]

// ---------------------------------------------------------------------------
// DataGrid demo
// ---------------------------------------------------------------------------

export function DataGridDemo() {
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null)

  const columns: DataGridColumn<Study>[] = [
    { field: 'studyId', headerName: 'Study ID', width: 140 },
    { field: 'title', headerName: 'Title', flex: 1 },
    { field: 'species', headerName: 'Species', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      cellRenderer: ({ data }: { data: Study }) => (
        <Badge variant={data.status as 'active' | 'draft' | 'approved'}>{data.status}</Badge>
      ),
    },
    {
      field: 'subjects',
      headerName: 'Subjects',
      width: 90,
      align: 'right',
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 110,
      valueFormatter: ({ value }: { value: unknown }) =>
        new Date(value as string).toLocaleDateString(),
    },
  ]

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        AG Grid Community wrapper with Datagrok theme. Supports sorting, resizing, custom cell
        renderers, value formatters, and auto-generated columns.
      </p>

      <DemoSection title="Explicit columns with cell renderers">
        <div style={{ height: 280 }}>
          <DataGrid
            rowData={sampleStudies}
            columnDefs={columns}
            getRowId={(s: Study) => s.id}
            onRowClicked={(s: Study) => setSelectedStudy(s)}
          />
        </div>
        {selectedStudy && (
          <p className="text-xs text-muted-foreground">
            Clicked: <strong>{selectedStudy.studyId}</strong> &mdash; {selectedStudy.title}
          </p>
        )}
      </DemoSection>

      <DemoSection title="Auto columns">
        <p className="text-xs text-muted-foreground mb-2">
          Pass <code className="bg-muted px-1 rounded">autoColumns</code> to generate columns from data.
        </p>
        <div style={{ height: 200 }}>
          <DataGrid
            rowData={sampleStudies.slice(0, 3)}
            autoColumns
            formatHeader={(field: string) =>
              field.replace(/([A-Z])/g, ' $1').replace(/^./, (c: string) => c.toUpperCase())
            }
          />
        </div>
      </DemoSection>

      <DemoSection title="Empty + loading states">
        <div className="flex gap-4">
          <div className="flex-1" style={{ height: 160 }}>
            <p className="text-xs text-muted-foreground mb-1">Loading</p>
            <DataGrid rowData={[]} columnDefs={columns} loading />
          </div>
          <div className="flex-1" style={{ height: 160 }}>
            <p className="text-xs text-muted-foreground mb-1">Empty</p>
            <DataGrid
              rowData={[]}
              columnDefs={columns}
              noRowsMessage="No studies match your criteria"
            />
          </div>
        </div>
      </DemoSection>
    </div>
  )
}

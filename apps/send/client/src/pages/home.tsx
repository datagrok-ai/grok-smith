import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  View,
  useApi,
  ApiRequestError,
  Button,
  Badge,
  Skeleton,
  Alert,
  AlertDescription,
  EmptyState,
  DataGrid,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@datagrok/app-kit'
import type { BadgeVariant, DataGridColumn } from '@datagrok/app-kit'

import type { StudyStatus } from '../../../shared/constants'

import { SendNav } from '../components/send-nav'

interface StudyRow {
  id: string
  studyId: string
  title: string
  status: StudyStatus
  species: string | null
  strain: string | null
  route: string | null
  testArticle: string | null
  subjectCount: number
  createdAt: string
}

const STATUS_LABELS: Record<StudyStatus, string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  completed: 'Completed',
  archived: 'Archived',
}

export default function HomePage() {
  const api = useApi()
  const navigate = useNavigate()
  const [studies, setStudies] = useState<StudyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StudyRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchStudies() {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<StudyRow[]>('/studies')
      setStudies(data)
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(`${String(err.status)}: ${err.body.error}`)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load studies')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchStudies()
  }, [])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.del<{ success: boolean }>(`/studies/${deleteTarget.id}`)
      setStudies((prev) => prev.filter((s) => s.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete study')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }, [deleteTarget, api])

  const columns: DataGridColumn<StudyRow>[] = [
    {
      field: 'actions',
      headerName: '',
      width: 50,
      sortable: false,
      resizable: false,
      cellRenderer: ({ data }: { data: StudyRow; value: unknown }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
              &#x22EE;
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => void navigate(`/study/${data.id}`)}>
              Open
            </DropdownMenuItem>
            <DropdownMenuItem destructive onSelect={() => setDeleteTarget(data)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    {
      field: 'studyId',
      headerName: 'Study ID',
      width: 140,
      cellRenderer: ({ data }: { data: StudyRow; value: unknown }) => (
        <Link to={`/study/${data.id}`} className="font-medium text-primary hover:underline">
          {data.studyId}
        </Link>
      ),
    },
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      cellRenderer: ({ data }: { data: StudyRow; value: unknown }) => (
        <Badge variant={data.status as BadgeVariant}>
          {STATUS_LABELS[data.status]}
        </Badge>
      ),
    },
    {
      field: 'species',
      headerName: 'Species',
      width: 120,
      valueFormatter: ({ value }: { value: unknown }) => (value as string | null) ?? '\u2014',
    },
    {
      field: 'subjectCount',
      headerName: 'Subjects',
      width: 100,
      align: 'right',
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      valueFormatter: ({ value }: { value: unknown }) =>
        new Date(value as string).toLocaleDateString(),
    },
  ]

  return (
    <View
      name="Studies"
      breadcrumbs={[{ label: 'SEND' }, { label: 'Studies' }]}
      toolbox={<SendNav />}
      ribbon={
        <Button asChild>
          <Link to="/upload">Upload Study</Link>
        </Button>
      }
      status={`${String(studies.length)} studies`}
    >
      <div className="p-4 space-y-4">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="text-center">
            <AlertDescription>{error}</AlertDescription>
            <button
              type="button"
              onClick={() => void fetchStudies()}
              className="mt-3 text-sm font-medium text-primary hover:underline"
            >
              Retry
            </button>
          </Alert>
        )}

        {!loading && !error && studies.length === 0 && (
          <EmptyState
            icon="📋"
            title="No studies yet"
            action={
              <Button asChild>
                <Link to="/upload">Upload Your First Study</Link>
              </Button>
            }
          />
        )}

        {!loading && !error && studies.length > 0 && (
          <DataGrid
            rowData={studies}
            columnDefs={columns}
            getRowId={(s) => s.id}
            height="auto"
          />
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Study</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete study &ldquo;{deleteTarget?.studyId}&rdquo;? This
              will permanently remove all associated data including subjects, findings, and other
              domain records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={deleting} onClick={() => void handleDelete()}>
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  )
}

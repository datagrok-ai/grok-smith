import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  PageLayout,
  useApi,
  ApiRequestError,
  Button,
  Badge,
  Skeleton,
  Alert,
  AlertDescription,
  EmptyState,
  DataTable,
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
import type { BadgeVariant, ColumnDef } from '@datagrok/app-kit'

import type { StudyStatus } from '../../../shared/constants'

import { nav } from '../nav'

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

  const columns: ColumnDef<StudyRow>[] = [
    {
      key: 'actions',
      header: '',
      className: 'w-10 px-2',
      cell: (study) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
              ⋮
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => void navigate(`/study/${study.id}`)}>
              Open
            </DropdownMenuItem>
            <DropdownMenuItem destructive onSelect={() => setDeleteTarget(study)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    {
      key: 'studyId',
      header: 'Study ID',
      cell: (study) => (
        <Link to={`/study/${study.id}`} className="font-medium text-primary hover:underline">
          {study.studyId}
        </Link>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      cell: (study) => study.title,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (study) => (
        <Badge variant={study.status as BadgeVariant}>
          {STATUS_LABELS[study.status]}
        </Badge>
      ),
    },
    {
      key: 'species',
      header: 'Species',
      className: 'text-muted-foreground',
      cell: (study) => study.species ?? '\u2014',
    },
    {
      key: 'subjects',
      header: 'Subjects',
      className: 'text-right tabular-nums',
      cell: (study) => study.subjectCount,
    },
    {
      key: 'created',
      header: 'Created',
      className: 'text-muted-foreground',
      cell: (study) => new Date(study.createdAt).toLocaleDateString(),
    },
  ]

  return (
    <PageLayout title="SEND — Animal Studies" nav={nav}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Studies</h2>
          <Button asChild>
            <Link to="/upload">Upload Study</Link>
          </Button>
        </div>

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
          <DataTable
            columns={columns}
            data={studies}
            rowKey={(s) => s.id}
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
    </PageLayout>
  )
}

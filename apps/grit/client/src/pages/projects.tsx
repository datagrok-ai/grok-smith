import { useEffect, useRef, useState } from 'react'

import {
  View,
  useApi,
  ApiRequestError,
  Button,
  Skeleton,
  Alert,
  AlertDescription,
  EmptyState,
  DataGrid,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  Textarea,
  FormField,
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
import type { DataGridColumn } from '@datagrok/app-kit'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProjectRow {
  id: string
  name: string
  key: string
  description: string | null
  issueCount: number
  createdAt: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProjectsPage() {
  const api = useApi()
  const apiRef = useRef(api)
  apiRef.current = api

  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create dialog
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', key: '', description: '' })

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<ProjectRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchProjects() {
    setLoading(true)
    setError(null)
    try {
      const data = await apiRef.current.get<ProjectRow[]>('/projects')
      setProjects(data)
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(`${String(err.status)}: ${err.body.error}`)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load projects')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchProjects()
  }, [])

  async function handleCreate() {
    setCreating(true)
    try {
      await apiRef.current.post<unknown>('/projects', {
        name: newProject.name,
        key: newProject.key.toUpperCase(),
        description: newProject.description || undefined,
      })
      setShowCreate(false)
      setNewProject({ name: '', key: '', description: '' })
      void fetchProjects()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(`${String(err.status)}: ${err.body.error}`)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create project')
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await apiRef.current.del<{ success: boolean }>(`/projects/${deleteTarget.id}`)
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const columns: DataGridColumn<ProjectRow>[] = [
    {
      field: 'actions',
      headerName: '',
      width: 50,
      sortable: false,
      resizable: false,
      cellRenderer: ({ data }: { data: ProjectRow; value: unknown }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
              &#x22EE;
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem destructive onSelect={() => setDeleteTarget(data)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    {
      field: 'key',
      headerName: 'Key',
      width: 100,
      cellClass: 'font-mono font-bold',
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      valueFormatter: ({ value }: { value: unknown }) => (value as string | null) ?? '\u2014',
    },
    {
      field: 'issueCount',
      headerName: 'Issues',
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
      name="Projects"
      breadcrumbs={[{ label: 'GRIT' }, { label: 'Projects' }]}
      ribbon={<Button onClick={() => setShowCreate(true)}>New Project</Button>}
      status={`${String(projects.length)} projects`}
    >
      <div className="p-4 space-y-4">

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
            <button
              type="button"
              onClick={() => {
                setError(null)
                void fetchProjects()
              }}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              Retry
            </button>
          </Alert>
        )}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <EmptyState
            icon="#"
            title="No projects yet"
            action={<Button onClick={() => setShowCreate(true)}>Create Your First Project</Button>}
          />
        )}

        {!loading && !error && projects.length > 0 && (
          <DataGrid
            rowData={projects}
            columnDefs={columns}
            getRowId={(p) => p.id}
            height="auto"
          />
        )}
      </div>

      {/* Create Project Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormField label="Name" required>
              <Input
                value={newProject.name}
                onChange={(e) => setNewProject((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Project name"
              />
            </FormField>
            <FormField label="Key" required>
              <Input
                value={newProject.key}
                onChange={(e) =>
                  setNewProject((prev) => ({ ...prev, key: e.target.value.toUpperCase() }))
                }
                placeholder="PROJ"
                maxLength={10}
                className="font-mono uppercase"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Short uppercase identifier (e.g. GRIT, DG)
              </p>
            </FormField>
            <FormField label="Description">
              <Textarea
                value={newProject.description}
                onChange={(e) =>
                  setNewProject((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Optional description"
                rows={3}
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowCreate(false)} disabled={creating}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleCreate()}
              disabled={creating || !newProject.name || !newProject.key}
            >
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete project &ldquo;{deleteTarget?.key}&rdquo;? This will
              permanently remove all associated issues.
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

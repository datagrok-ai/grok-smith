import { useEffect, useRef, useState } from 'react'

import {
  PageLayout,
  useApi,
  ApiRequestError,
  Button,
  Skeleton,
  Alert,
  AlertDescription,
  EmptyState,
  DataTable,
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
import type { ColumnDef } from '@datagrok/app-kit'

import { nav } from '../nav'

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

  const columns: ColumnDef<ProjectRow>[] = [
    {
      key: 'actions',
      header: '',
      className: 'w-10 px-2',
      cell: (project) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
              &#x22EE;
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem destructive onSelect={() => setDeleteTarget(project)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    {
      key: 'key',
      header: 'Key',
      className: 'font-mono font-bold',
      cell: (p) => p.key,
    },
    {
      key: 'name',
      header: 'Name',
      cell: (p) => p.name,
    },
    {
      key: 'description',
      header: 'Description',
      className: 'text-muted-foreground',
      cell: (p) => p.description ?? '\u2014',
    },
    {
      key: 'issues',
      header: 'Issues',
      className: 'text-right tabular-nums',
      cell: (p) => p.issueCount,
    },
    {
      key: 'created',
      header: 'Created',
      className: 'text-muted-foreground',
      cell: (p) => new Date(p.createdAt).toLocaleDateString(),
    },
  ]

  return (
    <PageLayout title="GRIT — Issue Tracking" nav={nav}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Projects</h2>
          <Button onClick={() => setShowCreate(true)}>New Project</Button>
        </div>

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
          <DataTable columns={columns} data={projects} rowKey={(p) => p.id} />
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
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>
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
    </PageLayout>
  )
}

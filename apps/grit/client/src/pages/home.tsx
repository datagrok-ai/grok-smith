import { useEffect, useRef, useState } from 'react'

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
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  Textarea,
  FormField,
} from '@datagrok/app-kit'
import type { DataGridColumn, BadgeVariant } from '@datagrok/app-kit'

import type { IssueType, IssuePriority, IssueStatus } from '../../../shared/constants'
import {
  ISSUE_TYPE_LABELS,
  ISSUE_PRIORITY_LABELS,
  ISSUE_STATUS_LABELS,
  ISSUE_TYPES,
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
} from '../../../shared/constants'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IssueRow {
  id: string
  projectId: string
  projectKey: string
  name: string
  description: string | null
  type: IssueType
  priority: IssuePriority
  status: IssueStatus
  reporterId: string
  reporterName: string
  assigneeId: string | null
  assigneeName: string | null
  parentIssueId: string | null
  createdAt: string
  updatedAt: string
}

interface ProjectOption {
  id: string
  name: string
  key: string
  description?: string | null
  issueCount?: number
  createdAt?: string
}

interface UserOption {
  id: string
  login: string
  displayName: string
}

type SelectedItem =
  | { type: 'issue'; data: IssueRow }
  | { type: 'project'; data: ProjectOption }
  | { type: 'user'; data: UserOption }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PRIORITY_VARIANTS: Record<IssuePriority, BadgeVariant> = {
  low: 'draft',
  medium: 'active',
  high: 'rejected',
}

const TYPE_ICONS: Record<IssueType, string> = {
  bug: 'B',
  feature: 'F',
  task: 'T',
}

// ---------------------------------------------------------------------------
// Tree Panel (rendered in Shell toolbox)
// ---------------------------------------------------------------------------

function TreePanel({
  projects,
  users,
  activeProjectId,
  selectedItem,
  onSelectProject,
  onSelectAllProjects,
  onSelectUser,
}: {
  projects: ProjectOption[]
  users: UserOption[]
  activeProjectId: string
  selectedItem: SelectedItem | null
  onSelectProject: (p: ProjectOption) => void
  onSelectAllProjects: () => void
  onSelectUser: (u: UserOption) => void
}) {
  const [projectsOpen, setProjectsOpen] = useState(true)
  const [usersOpen, setUsersOpen] = useState(true)

  return (
    <div className="p-2">
      {/* Projects section */}
      <button
        type="button"
        className="flex w-full items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted"
        onClick={() => setProjectsOpen(!projectsOpen)}
      >
        <span className="text-[10px]">{projectsOpen ? '\u25BC' : '\u25B6'}</span>
        Projects
      </button>
      {projectsOpen && (
        <div className="ml-1">
          <button
            type="button"
            className={`flex w-full items-center rounded px-3 py-1 text-sm hover:bg-muted ${
              activeProjectId === 'all' && selectedItem?.type !== 'project' && selectedItem?.type !== 'user'
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-foreground'
            }`}
            onClick={onSelectAllProjects}
          >
            All Issues
          </button>
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`flex w-full items-center rounded px-3 py-1 text-sm hover:bg-muted ${
                selectedItem?.type === 'project' && selectedItem.data.id === p.id
                  ? 'bg-primary/10 font-medium text-primary'
                  : activeProjectId === p.id
                    ? 'font-medium text-foreground'
                    : 'text-foreground'
              }`}
              onClick={() => onSelectProject(p)}
            >
              <span className="mr-1.5 font-mono text-xs text-muted-foreground">{p.key}</span>
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Users section */}
      <button
        type="button"
        className="mt-3 flex w-full items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted"
        onClick={() => setUsersOpen(!usersOpen)}
      >
        <span className="text-[10px]">{usersOpen ? '\u25BC' : '\u25B6'}</span>
        Users
      </button>
      {usersOpen && (
        <div className="ml-1">
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              className={`flex w-full items-center rounded px-3 py-1 text-sm hover:bg-muted ${
                selectedItem?.type === 'user' && selectedItem.data.id === u.id
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-foreground'
              }`}
              onClick={() => onSelectUser(u)}
            >
              {u.displayName}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Context Panel (rendered in Shell context panel)
// ---------------------------------------------------------------------------

function ContextPanelContent({ item }: { item: SelectedItem | null }) {
  if (!item) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
        Select an item to view details
      </div>
    )
  }

  return (
    <div className="p-4">
      {item.type === 'issue' && <IssueDetail issue={item.data} />}
      {item.type === 'project' && <ProjectDetail project={item.data} />}
      {item.type === 'user' && <UserDetail user={item.data} />}
    </div>
  )
}

function IssueDetail({ issue }: { issue: IssueRow }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-primary-foreground"
          style={{
            backgroundColor:
              issue.type === 'bug'
                ? 'var(--color-destructive)'
                : issue.type === 'feature'
                  ? 'var(--color-primary)'
                  : 'var(--color-muted-foreground)',
          }}
        >
          {TYPE_ICONS[issue.type]}
        </span>
        <Badge variant={PRIORITY_VARIANTS[issue.priority]}>
          {ISSUE_PRIORITY_LABELS[issue.priority]}
        </Badge>
      </div>
      <h3 className="text-sm font-semibold text-foreground">{issue.name}</h3>
      <span className="text-xs font-mono text-muted-foreground">{issue.projectKey}</span>

      <div className="space-y-2 pt-2">
        <DetailRow label="Status" value={ISSUE_STATUS_LABELS[issue.status]} />
        <DetailRow label="Type" value={ISSUE_TYPE_LABELS[issue.type]} />
        <DetailRow label="Priority" value={ISSUE_PRIORITY_LABELS[issue.priority]} />
        <DetailRow label="Assignee" value={issue.assigneeName ?? 'Unassigned'} />
        <DetailRow label="Reporter" value={issue.reporterName} />
        <DetailRow label="Created" value={new Date(issue.createdAt).toLocaleDateString()} />
        <DetailRow label="Updated" value={new Date(issue.updatedAt).toLocaleDateString()} />
      </div>

      {issue.description && (
        <div className="pt-2">
          <p className="text-xs font-medium text-muted-foreground">Description</p>
          <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{issue.description}</p>
        </div>
      )}
    </div>
  )
}

function ProjectDetail({ project }: { project: ProjectOption }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{project.name}</h3>
      <span className="font-mono text-xs text-muted-foreground">{project.key}</span>

      <div className="space-y-2 pt-2">
        {project.description && <DetailRow label="Description" value={project.description} />}
        {project.issueCount != null && (
          <DetailRow label="Issues" value={String(project.issueCount)} />
        )}
        {project.createdAt && (
          <DetailRow label="Created" value={new Date(project.createdAt).toLocaleDateString()} />
        )}
      </div>
    </div>
  )
}

function UserDetail({ user }: { user: UserOption }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{user.displayName}</h3>
      <div className="space-y-2 pt-2">
        <DetailRow label="Login" value={user.login} />
      </div>
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
// Component
// ---------------------------------------------------------------------------

export default function HomePage() {
  const api = useApi()
  const apiRef = useRef(api)
  apiRef.current = api

  const [issues, setIssues] = useState<IssueRow[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('all')

  // Selection
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null)

  // New issue dialog
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newIssue, setNewIssue] = useState({
    name: '',
    description: '',
    type: 'task' as IssueType,
    priority: 'medium' as IssuePriority,
    projectId: '',
    assigneeId: '',
  })

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  async function fetchIssues(s: string, pf: string) {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (s) params.set('search', s)
      if (pf && pf !== 'all') params.set('projectId', pf)
      const qs = params.toString()
      const data = await apiRef.current.get<IssueRow[]>(`/issues${qs ? `?${qs}` : ''}`)
      setIssues(data)
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(`${String(err.status)}: ${err.body.error}`)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load issues')
      }
    } finally {
      setLoading(false)
    }
  }

  async function fetchMeta() {
    try {
      const [p, u] = await Promise.all([
        apiRef.current.get<ProjectOption[]>('/projects'),
        apiRef.current.get<UserOption[]>('/users'),
      ])
      setProjects(p)
      setUsers(u)
    } catch {
      // Non-fatal
    }
  }

  useEffect(() => {
    void fetchMeta()
  }, [])

  useEffect(() => {
    void fetchIssues(search, projectFilter)
  }, [search, projectFilter])

  // -------------------------------------------------------------------------
  // Inline updates
  // -------------------------------------------------------------------------

  async function updateIssue(issueId: string, patch: Record<string, unknown>) {
    // Optimistic update — apply locally first to avoid flicker
    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id !== issueId) return issue
        const updated = { ...issue, ...patch } as IssueRow
        // If assignee changed, resolve the display name
        if ('assigneeId' in patch) {
          const user = users.find((u) => u.id === patch.assigneeId)
          updated.assigneeName = user?.displayName ?? null
        }
        return updated
      }),
    )
    // Also update the context panel if this issue is selected
    setSelectedItem((prev) => {
      if (prev?.type === 'issue' && prev.data.id === issueId) {
        const updated = { ...prev.data, ...patch } as IssueRow
        if ('assigneeId' in patch) {
          const user = users.find((u) => u.id === patch.assigneeId)
          updated.assigneeName = user?.displayName ?? null
        }
        return { type: 'issue', data: updated }
      }
      return prev
    })

    try {
      await apiRef.current.put<unknown>(`/issues/${issueId}`, patch)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update issue')
      // Revert on failure
      void fetchIssues(search, projectFilter)
    }
  }

  // -------------------------------------------------------------------------
  // Create issue
  // -------------------------------------------------------------------------

  async function handleCreate() {
    setCreating(true)
    try {
      await apiRef.current.post<unknown>('/issues', {
        projectId: newIssue.projectId,
        name: newIssue.name,
        description: newIssue.description || undefined,
        type: newIssue.type,
        priority: newIssue.priority,
        assigneeId: newIssue.assigneeId || undefined,
      })
      setShowCreate(false)
      setNewIssue({ name: '', description: '', type: 'task', priority: 'medium', projectId: '', assigneeId: '' })
      void fetchIssues(search, projectFilter)
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(`${String(err.status)}: ${err.body.error}`)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create issue')
      }
    } finally {
      setCreating(false)
    }
  }

  // -------------------------------------------------------------------------
  // Tree handlers
  // -------------------------------------------------------------------------

  function handleSelectProject(p: ProjectOption) {
    setProjectFilter(p.id)
    setSelectedItem({ type: 'project', data: p })
  }

  function handleSelectAllProjects() {
    setProjectFilter('all')
    setSelectedItem(null)
  }

  function handleSelectUser(u: UserOption) {
    setSelectedItem({ type: 'user', data: u })
  }

  function handleRowClick(row: IssueRow) {
    setSelectedItem({ type: 'issue', data: row })
  }

  // -------------------------------------------------------------------------
  // Columns
  // -------------------------------------------------------------------------

  const columns: DataGridColumn<IssueRow>[] = [
    {
      field: 'type',
      headerName: 'Type',
      width: 70,
      sortable: false,
      cellRenderer: ({ data }: { data: IssueRow; value: unknown }) => (
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-primary-foreground"
          style={{
            backgroundColor: data.type === 'bug' ? 'var(--color-destructive)' : data.type === 'feature' ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
          }}
          title={ISSUE_TYPE_LABELS[data.type]}
        >
          {TYPE_ICONS[data.type]}
        </span>
      ),
    },
    {
      field: 'projectKey',
      headerName: 'Key',
      width: 100,
      cellClass: 'font-mono text-xs text-muted-foreground',
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      cellRenderer: ({ data }: { data: IssueRow; value: unknown }) => (
        <span className="font-medium">{data.name}</span>
      ),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      cellRenderer: ({ data }: { data: IssueRow; value: unknown }) => (
        <Badge variant={PRIORITY_VARIANTS[data.priority]}>
          {ISSUE_PRIORITY_LABELS[data.priority]}
        </Badge>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 160,
      cellRenderer: ({ data }: { data: IssueRow; value: unknown }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            value={data.status}
            onValueChange={(value) => void updateIssue(data.id, { status: value })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ISSUE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {ISSUE_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      field: 'assigneeId',
      headerName: 'Assignee',
      width: 176,
      cellRenderer: ({ data }: { data: IssueRow; value: unknown }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            value={data.assigneeId ?? 'unassigned'}
            onValueChange={(value) =>
              void updateIssue(data.id, { assigneeId: value === 'unassigned' ? null : value })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      field: 'reporterName',
      headerName: 'Reporter',
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      valueFormatter: ({ value }: { value: unknown }) =>
        new Date(value as string).toLocaleDateString(),
    },
  ]

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <View
      name="Issues"
      breadcrumbs={[{ label: 'GRIT' }, { label: 'Issues' }]}
      toolbox={
        <TreePanel
          projects={projects}
          users={users}
          activeProjectId={projectFilter}
          selectedItem={selectedItem}
          onSelectProject={handleSelectProject}
          onSelectAllProjects={handleSelectAllProjects}
          onSelectUser={handleSelectUser}
        />
      }
      contextPanel={<ContextPanelContent item={selectedItem} />}
      ribbon={
        <>
          <Input
            placeholder="Search by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Button
            onClick={() => {
              setNewIssue((prev) => ({
                ...prev,
                projectId: projectFilter !== 'all' ? projectFilter : (projects[0]?.id ?? ''),
              }))
              setShowCreate(true)
            }}
            disabled={projects.length === 0}
          >
            New Issue
          </Button>
        </>
      }
      status={`${String(issues.length)} issues`}
    >
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  void fetchIssues(search, projectFilter)
                }}
                className="mt-2 text-sm font-medium text-primary hover:underline"
              >
                Retry
              </button>
            </Alert>
          )}

          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && issues.length === 0 && (
            <EmptyState
              icon="!"
              title="No issues found"
              action={
                projects.length > 0 ? (
                  <Button onClick={() => setShowCreate(true)}>Create First Issue</Button>
                ) : undefined
              }
            />
          )}

          {/* Data table */}
          {!loading && !error && issues.length > 0 && (
            <DataGrid
              rowData={issues}
              columnDefs={columns}
              getRowId={(r) => r.id}
              onRowClicked={handleRowClick}
              height="auto"
            />
          )}
        </div>
      </div>

      {/* Create Issue Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Issue</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <FormField label="Project" required>
              <Select
                value={newIssue.projectId}
                onValueChange={(v) => setNewIssue((prev) => ({ ...prev, projectId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.key} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Name" required>
              <Input
                value={newIssue.name}
                onChange={(e) => setNewIssue((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Issue title"
              />
            </FormField>

            <FormField label="Description">
              <Textarea
                value={newIssue.description}
                onChange={(e) => setNewIssue((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the issue..."
                rows={3}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Type">
                <Select
                  value={newIssue.type}
                  onValueChange={(v) => setNewIssue((prev) => ({ ...prev, type: v as IssueType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {ISSUE_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Priority">
                <Select
                  value={newIssue.priority}
                  onValueChange={(v) => setNewIssue((prev) => ({ ...prev, priority: v as IssuePriority }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {ISSUE_PRIORITY_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <FormField label="Assignee">
              <Select
                value={newIssue.assigneeId || 'unassigned'}
                onValueChange={(v) =>
                  setNewIssue((prev) => ({ ...prev, assigneeId: v === 'unassigned' ? '' : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowCreate(false)} disabled={creating}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleCreate()}
              disabled={creating || !newIssue.name || !newIssue.projectId}
            >
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  )
}

import { useEffect, useRef, useState } from 'react'

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
import type { ColumnDef, BadgeVariant } from '@datagrok/app-kit'

import type { IssueType, IssuePriority, IssueStatus } from '../../../shared/constants'
import {
  ISSUE_TYPE_LABELS,
  ISSUE_PRIORITY_LABELS,
  ISSUE_STATUS_LABELS,
  ISSUE_TYPES,
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
} from '../../../shared/constants'

import { nav } from '../nav'

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
// Tree Panel
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
    <div className="flex h-full w-[200px] min-w-[200px] flex-col border-r border-border bg-muted/30">
      <div className="flex-1 overflow-y-auto p-2">
        {/* Projects section */}
        <button
          type="button"
          className="flex w-full items-center gap-1 rounded px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted"
          onClick={() => setProjectsOpen(!projectsOpen)}
        >
          <span className="text-[10px]">{projectsOpen ? '▼' : '▶'}</span>
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
          <span className="text-[10px]">{usersOpen ? '▼' : '▶'}</span>
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
    </div>
  )
}

// ---------------------------------------------------------------------------
// Context Panel
// ---------------------------------------------------------------------------

function ContextPanel({ item }: { item: SelectedItem | null }) {
  if (!item) {
    return (
      <div className="flex h-full w-[300px] min-w-[300px] flex-col border-l border-border bg-muted/20">
        <div className="flex flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
          Select an item to view details
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-[300px] min-w-[300px] flex-col border-l border-border bg-muted/20">
      <div className="flex-1 overflow-y-auto p-4">
        {item.type === 'issue' && <IssueDetail issue={item.data} />}
        {item.type === 'project' && <ProjectDetail project={item.data} />}
        {item.type === 'user' && <UserDetail user={item.data} />}
      </div>
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
    try {
      await apiRef.current.put<unknown>(`/issues/${issueId}`, patch)
      void fetchIssues(search, projectFilter)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update issue')
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

  const columns: ColumnDef<IssueRow>[] = [
    {
      key: 'type',
      header: 'Type',
      className: 'w-16',
      cell: (row) => (
        <span
          className="inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-primary-foreground"
          style={{
            backgroundColor: row.type === 'bug' ? 'var(--color-destructive)' : row.type === 'feature' ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
          }}
          title={ISSUE_TYPE_LABELS[row.type]}
        >
          {TYPE_ICONS[row.type]}
        </span>
      ),
    },
    {
      key: 'key',
      header: 'Key',
      className: 'w-24 font-mono text-xs text-muted-foreground',
      cell: (row) => row.projectKey,
    },
    {
      key: 'name',
      header: 'Name',
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'priority',
      header: 'Priority',
      className: 'w-24',
      cell: (row) => (
        <Badge variant={PRIORITY_VARIANTS[row.priority]}>
          {ISSUE_PRIORITY_LABELS[row.priority]}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-40',
      cell: (row) => (
        <Select
          value={row.status}
          onValueChange={(value) => void updateIssue(row.id, { status: value })}
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
      ),
    },
    {
      key: 'assignee',
      header: 'Assignee',
      className: 'w-44',
      cell: (row) => (
        <Select
          value={row.assigneeId ?? 'unassigned'}
          onValueChange={(value) =>
            void updateIssue(row.id, { assigneeId: value === 'unassigned' ? null : value })
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
      ),
    },
    {
      key: 'reporter',
      header: 'Reporter',
      className: 'text-muted-foreground',
      cell: (row) => row.reporterName,
    },
    {
      key: 'created',
      header: 'Created',
      className: 'text-muted-foreground',
      cell: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ]

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <PageLayout title="GRIT — Issue Tracking" nav={nav}>
      <div className="flex h-full -m-6">
        {/* Left: Tree panel */}
        <TreePanel
          projects={projects}
          users={users}
          activeProjectId={projectFilter}
          selectedItem={selectedItem}
          onSelectProject={handleSelectProject}
          onSelectAllProjects={handleSelectAllProjects}
          onSelectUser={handleSelectUser}
        />

        {/* Center: Issues grid */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              {/* Toolbar: search + create */}
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Search by name or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-sm"
                />

                <div className="flex-1" />

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
              </div>

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
                <DataTable
                  columns={columns}
                  data={issues}
                  rowKey={(r) => r.id}
                  onRowClick={handleRowClick}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right: Context panel */}
        <ContextPanel item={selectedItem} />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Create Issue Dialog                                                */}
      {/* ----------------------------------------------------------------- */}
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
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>
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
    </PageLayout>
  )
}

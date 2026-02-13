import { Hono } from 'hono'
import { eq, desc, sql, ilike, or, and } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import type { AppVariables } from '@datagrok/server-kit'

import { users } from '@datagrok/core-schema'

import { db } from '../db/client'
import { issues, projects } from '../../shared/schema'
import { issueTypeSchema, issuePrioritySchema, issueStatusSchema } from '../../shared/schema'

export const issuesRoute = new Hono<{ Variables: AppVariables }>()

// ---------------------------------------------------------------------------
// GET /issues — list issues with search and project filter
// ---------------------------------------------------------------------------

issuesRoute.get('/issues', async (c) => {
  const search = c.req.query('search')
  const projectId = c.req.query('projectId')

  const conditions = []

  if (projectId) {
    conditions.push(eq(issues.projectId, projectId))
  }

  if (search) {
    conditions.push(
      or(
        ilike(issues.name, `%${search}%`),
        ilike(issues.description, `%${search}%`),
      ),
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  // Use SQL subqueries to resolve reporter and assignee names
  const rows = await db
    .select({
      id: issues.id,
      projectId: issues.projectId,
      projectKey: projects.key,
      name: issues.name,
      description: issues.description,
      type: issues.type,
      priority: issues.priority,
      status: issues.status,
      reporterId: issues.reporterId,
      reporterName: sql<string>`(select friendly_name from users where id = ${issues.reporterId})`.as('reporter_name'),
      assigneeId: issues.assigneeId,
      assigneeName: sql<string | null>`(select friendly_name from users where id = ${issues.assigneeId})`.as('assignee_name'),
      parentIssueId: issues.parentIssueId,
      createdAt: issues.createdAt,
      updatedAt: issues.updatedAt,
    })
    .from(issues)
    .innerJoin(projects, eq(issues.projectId, projects.id))
    .where(where)
    .orderBy(desc(issues.createdAt))

  return c.json(rows)
})

// ---------------------------------------------------------------------------
// POST /issues — create a new issue
// ---------------------------------------------------------------------------

const createIssueBody = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(500),
  description: z.string().optional(),
  type: issueTypeSchema.default('task'),
  priority: issuePrioritySchema.default('medium'),
  assigneeId: z.string().uuid().optional(),
  parentIssueId: z.string().uuid().optional(),
})

issuesRoute.post('/issues', async (c) => {
  const body = createIssueBody.parse(await c.req.json())
  const userId = c.get('userId')

  // Verify project exists
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, body.projectId))

  if (!project) {
    throw new HTTPException(404, { message: 'Project not found' })
  }

  const [issue] = await db
    .insert(issues)
    .values({
      projectId: body.projectId,
      name: body.name,
      description: body.description ?? null,
      type: body.type,
      priority: body.priority,
      status: 'open',
      reporterId: userId,
      assigneeId: body.assigneeId ?? null,
      parentIssueId: body.parentIssueId ?? null,
      createdBy: userId,
    })
    .returning()

  return c.json(issue, 201)
})

// ---------------------------------------------------------------------------
// PUT /issues/:id — update issue fields (status, assignee, etc.)
// ---------------------------------------------------------------------------

const updateIssueBody = z.object({
  name: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  type: issueTypeSchema.optional(),
  priority: issuePrioritySchema.optional(),
  status: issueStatusSchema.optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  parentIssueId: z.string().uuid().nullable().optional(),
})

issuesRoute.put('/issues/:id', async (c) => {
  const issueId = c.req.param('id')
  const body = updateIssueBody.parse(await c.req.json())

  const [existing] = await db
    .select({ id: issues.id })
    .from(issues)
    .where(eq(issues.id, issueId))

  if (!existing) {
    throw new HTTPException(404, { message: 'Issue not found' })
  }

  const [updated] = await db
    .update(issues)
    .set(body)
    .where(eq(issues.id, issueId))
    .returning()

  return c.json(updated)
})

// ---------------------------------------------------------------------------
// DELETE /issues/:id — delete an issue
// ---------------------------------------------------------------------------

issuesRoute.delete('/issues/:id', async (c) => {
  const issueId = c.req.param('id')

  const [existing] = await db
    .select({ id: issues.id })
    .from(issues)
    .where(eq(issues.id, issueId))

  if (!existing) {
    throw new HTTPException(404, { message: 'Issue not found' })
  }

  await db.delete(issues).where(eq(issues.id, issueId))

  return c.json({ success: true })
})

// ---------------------------------------------------------------------------
// GET /users — list users for assignee picker
// ---------------------------------------------------------------------------

issuesRoute.get('/users', async (c) => {
  const rows = await db
    .select({
      id: users.id,
      login: users.login,
      displayName: users.friendlyName,
    })
    .from(users)
    .orderBy(users.friendlyName)

  return c.json(rows)
})

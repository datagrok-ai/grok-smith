import { Hono } from 'hono'
import { eq, desc, sql } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import type { AppVariables } from '@datagrok/server-kit'

import { db } from '../db/client'
import { projects, issues } from '../../shared/schema'

export const projectsRoute = new Hono<{ Variables: AppVariables }>()

// ---------------------------------------------------------------------------
// GET /projects — list all projects with issue counts
// ---------------------------------------------------------------------------

projectsRoute.get('/projects', async (c) => {
  const issueCountSq = db
    .select({
      projectId: issues.projectId,
      count: sql<number>`count(*)::int`.as('issue_count'),
    })
    .from(issues)
    .groupBy(issues.projectId)
    .as('ic')

  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      key: projects.key,
      description: projects.description,
      issueCount: sql<number>`coalesce(${issueCountSq.count}, 0)`.as('issue_count'),
      createdAt: projects.createdAt,
    })
    .from(projects)
    .leftJoin(issueCountSq, eq(projects.id, issueCountSq.projectId))
    .orderBy(desc(projects.createdAt))

  return c.json(rows)
})

// ---------------------------------------------------------------------------
// POST /projects — create a new project
// ---------------------------------------------------------------------------

const createProjectBody = z.object({
  name: z.string().min(1).max(200),
  key: z.string().min(1).max(10).regex(/^[A-Z][A-Z0-9]*$/, 'Key must be uppercase letters/digits, starting with a letter'),
  description: z.string().optional(),
})

projectsRoute.post('/projects', async (c) => {
  const body = createProjectBody.parse(await c.req.json())
  const userId = c.get('userId')

  const [project] = await db
    .insert(projects)
    .values({
      name: body.name,
      key: body.key,
      description: body.description ?? null,
      createdBy: userId,
    })
    .returning()

  return c.json(project, 201)
})

// ---------------------------------------------------------------------------
// DELETE /projects/:id — delete a project and all its issues (cascades)
// ---------------------------------------------------------------------------

projectsRoute.delete('/projects/:id', async (c) => {
  const projectId = c.req.param('id')

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId))

  if (!project) {
    throw new HTTPException(404, { message: 'Project not found' })
  }

  await db.delete(projects).where(eq(projects.id, projectId))

  return c.json({ success: true })
})

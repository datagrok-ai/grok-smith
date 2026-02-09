import { Hono } from 'hono'
import { eq, sql, desc } from 'drizzle-orm'

import { db } from '../db/client'
import { studies, subjects } from '../../shared/schema'

export const studiesRoute = new Hono()

studiesRoute.get('/studies', async (c) => {
  const subjectCountSq = db
    .select({
      studyId: subjects.studyId,
      count: sql<number>`count(*)::int`.as('subject_count'),
    })
    .from(subjects)
    .groupBy(subjects.studyId)
    .as('sc')

  const rows = await db
    .select({
      id: studies.id,
      studyId: studies.studyId,
      title: studies.title,
      status: studies.status,
      species: studies.species,
      strain: studies.strain,
      route: studies.route,
      testArticle: studies.testArticle,
      subjectCount: sql<number>`coalesce(${subjectCountSq.count}, 0)`.as('subject_count'),
      createdAt: studies.createdAt,
    })
    .from(studies)
    .leftJoin(subjectCountSq, eq(studies.id, subjectCountSq.studyId))
    .orderBy(desc(studies.createdAt))

  return c.json(rows)
})

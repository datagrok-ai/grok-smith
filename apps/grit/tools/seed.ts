import { sql } from 'drizzle-orm'
import { ADMIN_USER_ID } from '@datagrok/core-schema'

import { db } from '../server/db/client'
import { projects, issues } from '../shared/schema'
import type { IssueType, IssuePriority, IssueStatus } from '../shared/constants'

const userId = ADMIN_USER_ID

interface SeedIssue {
  name: string
  description: string
  type: IssueType
  priority: IssuePriority
  status: IssueStatus
  assignee: boolean
}

const seedData: Array<{ name: string; key: string; description: string; issues: SeedIssue[] }> = [
  {
    name: 'Datagrok Platform',
    key: 'DG',
    description: 'Core Datagrok platform issues and improvements',
    issues: [
      { name: 'Grid scrolling freezes on large datasets', description: 'When loading a dataset with 1M+ rows, the grid becomes unresponsive for several seconds during horizontal scrolling.', type: 'bug', priority: 'high', status: 'open', assignee: true },
      { name: 'Add dark mode support', description: 'Users have requested a dark theme option for extended usage sessions.', type: 'feature', priority: 'medium', status: 'in_progress', assignee: true },
      { name: 'Update onboarding tutorial', description: 'The getting-started tutorial references deprecated menu items. Needs a refresh.', type: 'task', priority: 'low', status: 'open', assignee: false },
      { name: 'Memory leak in scatter plot viewer', description: 'Scatter plot viewer accumulates memory when switching between datasets without closing the viewer.', type: 'bug', priority: 'high', status: 'in_progress', assignee: true },
      { name: 'Implement column-level permissions', description: 'Allow project admins to restrict visibility of specific columns based on user groups.', type: 'feature', priority: 'medium', status: 'open', assignee: false },
      { name: 'Migrate CI pipeline to GitHub Actions', description: 'Move from Jenkins to GitHub Actions for faster feedback and easier maintenance.', type: 'task', priority: 'medium', status: 'done', assignee: true },
      { name: 'CSV import fails with BOM-encoded files', description: 'Files saved from Excel with UTF-8 BOM encoding cause a parse error on the first column header.', type: 'bug', priority: 'medium', status: 'open', assignee: true },
    ],
  },
  {
    name: 'GRIT Issue Tracker',
    key: 'GRIT',
    description: 'Issues for the GRIT application itself',
    issues: [
      { name: 'Add issue detail view page', description: 'Clicking an issue in the grid should open a detail page with full description and activity history.', type: 'feature', priority: 'high', status: 'open', assignee: true },
      { name: 'Support bulk status change', description: 'Allow selecting multiple issues and changing their status in one action.', type: 'feature', priority: 'medium', status: 'open', assignee: false },
      { name: 'Add comment thread on issues', description: 'Users should be able to add comments and have threaded discussions on each issue.', type: 'feature', priority: 'medium', status: 'open', assignee: false },
      { name: 'Project key shown twice in grid', description: 'The Key column displays the project key, but it also appears in the issue name for some rows.', type: 'bug', priority: 'low', status: 'open', assignee: true },
      { name: 'Write initial seed data script', description: 'Create a seed script with sample projects and issues for development and demos.', type: 'task', priority: 'medium', status: 'done', assignee: true },
      { name: 'Add keyboard shortcuts for common actions', description: 'N for new issue, / for search focus, Esc to clear.', type: 'feature', priority: 'low', status: 'open', assignee: false },
    ],
  },
  {
    name: 'SEND Nonclinical Studies',
    key: 'SEND',
    description: 'Issues related to the SEND study management app',
    issues: [
      { name: 'Support SAS XPORT v8 format', description: 'The current XPT parser only handles v5 transport files. Newer studies use v8 format which fails to import.', type: 'feature', priority: 'high', status: 'open', assignee: true },
      { name: 'Study deletion leaves orphaned entities', description: 'When a study is deleted, the corresponding row in the entities table is not cleaned up.', type: 'bug', priority: 'medium', status: 'in_progress', assignee: true },
      { name: 'Add study comparison view', description: 'Allow side-by-side comparison of findings across two studies for the same test article.', type: 'feature', priority: 'medium', status: 'open', assignee: false },
      { name: 'Improve upload progress feedback', description: 'Large ZIP files show no progress during upload. Add a progress bar or percentage indicator.', type: 'task', priority: 'low', status: 'open', assignee: true },
      { name: 'Findings table sort order inconsistent', description: 'Sorting by USUBJID in the findings tab does not respect natural sort order for numeric subject IDs.', type: 'bug', priority: 'low', status: 'done', assignee: true },
      { name: 'Add export to CSV for domain data', description: 'Users want to download domain data grids as CSV files for offline analysis.', type: 'feature', priority: 'medium', status: 'open', assignee: false },
      { name: 'Validate SEND controlled terminology on import', description: 'Check uploaded data against CDISC controlled terminology and flag non-conformant values.', type: 'feature', priority: 'high', status: 'open', assignee: false },
      { name: 'Document supported SEND domains', description: 'Add a help page listing which SEND domains are supported and their mapping to database tables.', type: 'task', priority: 'low', status: 'done', assignee: true },
    ],
  },
]

async function seed() {
  console.log('Seeding GRIT database...')

  // Ensure schema exists
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS grit`)

  // Create tables if they don't exist
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS grit.projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_id UUID REFERENCES public.entities(id),
      name VARCHAR(200) NOT NULL,
      key VARCHAR(10) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_by UUID NOT NULL REFERENCES public.users(id)
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS grit.issues (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_id UUID REFERENCES public.entities(id),
      project_id UUID NOT NULL REFERENCES grit.projects(id) ON DELETE CASCADE,
      name VARCHAR(500) NOT NULL,
      description TEXT,
      type VARCHAR(20) NOT NULL DEFAULT 'task',
      priority VARCHAR(20) NOT NULL DEFAULT 'medium',
      status VARCHAR(20) NOT NULL DEFAULT 'open',
      reporter_id UUID NOT NULL REFERENCES public.users(id),
      assignee_id UUID REFERENCES public.users(id),
      parent_issue_id UUID REFERENCES grit.issues(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_by UUID NOT NULL REFERENCES public.users(id)
    )
  `)

  // Clear existing data
  await db.delete(issues)
  await db.delete(projects)

  for (const proj of seedData) {
    const [inserted] = await db
      .insert(projects)
      .values({
        name: proj.name,
        key: proj.key,
        description: proj.description,
        createdBy: userId,
      })
      .returning()

    console.log(`  Project: ${proj.key} — ${proj.name} (${proj.issues.length} issues)`)

    for (const issue of proj.issues) {
      await db.insert(issues).values({
        projectId: inserted.id,
        name: issue.name,
        description: issue.description,
        type: issue.type,
        priority: issue.priority,
        status: issue.status,
        reporterId: userId,
        assigneeId: issue.assignee ? userId : null,
        createdBy: userId,
      })
    }
  }

  console.log('Done! Seeded 3 projects with 21 issues.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})

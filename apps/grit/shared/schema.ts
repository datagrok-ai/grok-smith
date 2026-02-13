import {
  pgSchema,
  uuid,
  varchar,
  text,
  index,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod'
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { z } from 'zod'

import { users } from '@datagrok/core-schema'
import { auditColumns } from '@datagrok/core-schema'

import { ISSUE_TYPES, ISSUE_PRIORITIES, ISSUE_STATUSES } from './constants'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const gritSchema = pgSchema('grit')

// ---------------------------------------------------------------------------
// Zod validation schemas for enum-like fields
// ---------------------------------------------------------------------------

export const issueTypeSchema = z.enum(ISSUE_TYPES)
export const issuePrioritySchema = z.enum(ISSUE_PRIORITIES)
export const issueStatusSchema = z.enum(ISSUE_STATUSES)

// ---------------------------------------------------------------------------
// projects — containers for grouping issues
// ---------------------------------------------------------------------------

export const projects = gritSchema.table('projects', {
  ...auditColumns(),
  name: varchar('name', { length: 200 }).notNull(),
  key: varchar('key', { length: 10 }).notNull().unique(),
  description: text('description'),
})

// ---------------------------------------------------------------------------
// issues — individual trackable items within a project
// ---------------------------------------------------------------------------

export const issues = gritSchema.table(
  'issues',
  {
    ...auditColumns(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 500 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 20 }).notNull().default('task'),
    priority: varchar('priority', { length: 20 }).notNull().default('medium'),
    status: varchar('status', { length: 20 }).notNull().default('open'),
    reporterId: uuid('reporter_id')
      .notNull()
      .references(() => users.id),
    assigneeId: uuid('assignee_id').references(() => users.id),
    parentIssueId: uuid('parent_issue_id'),
  },
  (table) => [
    index('idx_issues_project_id').on(table.projectId),
    index('idx_issues_assignee_id').on(table.assigneeId),
    index('idx_issues_status').on(table.status),
    index('idx_issues_parent_issue_id').on(table.parentIssueId),
  ],
)

// ---------------------------------------------------------------------------
// Zod Schemas & TypeScript Types
// ---------------------------------------------------------------------------

// Projects
export const insertProjectSchema = createInsertSchema(projects)
export const selectProjectSchema = createSelectSchema(projects)
export type InsertProject = InferInsertModel<typeof projects>
export type Project = InferSelectModel<typeof projects>

// Issues
export const insertIssueSchema = createInsertSchema(issues)
export const selectIssueSchema = createSelectSchema(issues)
export type InsertIssue = InferInsertModel<typeof issues>
export type Issue = InferSelectModel<typeof issues>

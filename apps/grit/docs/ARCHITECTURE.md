# GRIT Architecture

## Database
- Schema: `grit`
- Tables: `projects` (entity), `issues` (entity)
- Both use `auditColumns()` from core-schema

## Server
- Hono via `createApp()` from server-kit
- Routes: `/api/projects`, `/api/issues`, `/api/users`
- DB: Drizzle via `createDb()` from server-kit

## Client
- React + React Router
- Pages: home (issues grid), projects (project management)
- Components from `@datagrok/app-kit`
- Inline editing for status and assignee via Select dropdowns in the data table

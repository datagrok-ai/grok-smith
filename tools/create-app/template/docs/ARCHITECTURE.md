# {{APP_NAME_PASCAL}} Architecture

## Stack
- Client: React + Tailwind + app-kit components
- Server: Hono API on port 3000
- Database: PostgreSQL, schema `{{APP_NAME}}`
- Local dev: Vite dev server proxies /api to Hono

## Data Flow
<!-- TODO: Describe the data flow -->

## API Design (planned)
<!-- TODO: List planned API endpoints -->

## Integration Points
- Datagrok: embedded as panel
- app-kit: provides Shell, View, DataGrid, theme, auth context
- server-kit: provides createApp(), createDb(), standard middleware and routes
- core-schema: provides auditColumns(), shared Drizzle types for core tables

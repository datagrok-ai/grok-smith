# @datagrok/app-core

Non-UI client infrastructure for grok-smith apps. Provides auth context, API hooks, mock adapters, and cross-cutting logic.

For full conventions, see `/docs/CODING.md`, `/docs/DATABASE.md`, `/docs/DESIGN.md`.

## What belongs here (app-core)
- Auth context (`DatagrokProvider`, `useDatagrok`)
- API hooks (`useApi`, `useCurrentUser`, `ApiBasePath`)
- Mock adapters and mock data (`createMockAdapter`, `mockUsers`)
- Permissions and cross-cutting non-UI logic
- Domain types (`User`, `ClientAppDefinition`)

## What belongs in app-kit (not here)
- UI components (`Shell`, `View`, `DataGrid`, `Button`, etc.)
- Theme, design tokens, CSS
- Layout primitives

## Rules
- No DOM rendering or routing — this package has no `react-dom` or `react-router-dom` dependency
- Mock UUIDs must match `@datagrok/core-schema` seed data — do not invent new fake UUIDs
- Changes here affect all apps — test carefully
- Run `npm run typecheck` from the repo root after changes
- app-kit re-exports everything from app-core, so apps can import from either package

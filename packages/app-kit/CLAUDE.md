# @datagrok/app-kit

Client-side UI library for grok-smith apps. Provides components and theme. Non-UI infrastructure (auth context, API hooks, mock adapters) lives in `@datagrok/app-core` and is re-exported from here for convenience.

For full conventions, see `/docs/CODING.md`, `/docs/DATABASE.md`, `/docs/DESIGN.md`.

## What it provides

### Layout
- `Shell` — App-level frame wrapping the router. Manages toolbox, context panel, status bar, resize handles, keyboard shortcuts.
- `View` — Per-page component that declares slot content (toolbox, ribbon, contextPanel, breadcrumbs, status) for Shell.
- `useShell()` — Hook for accessing panel state and actions from any component inside Shell.

### Components
- `DataGrid` — AG Grid Community wrapper with Datagrok theme. Use `columnDefs` for explicit columns, `autoColumns` for dynamic data. Supports sorting, filtering, column resize, and virtual scrolling out of the box.

### Hooks
- `useApi()` — Thin fetch wrapper: prefixes `/api`, sends `X-User-Id` header, returns typed JSON, throws `ApiRequestError` on failure
- `useCurrentUser()` — Calls `GET /api/auth/me` (from server-kit), returns `{ user, loading, error, refetch }`

### Adapter
- `DatagrokProvider` / `useDatagrok()` — React context for current user and mode (standalone vs datagrok)
- `createMockAdapter()` — Returns a mock context with the admin user for local dev

### Mock data
- `mockUsers` — Array of mock users matching core-schema seed data
- `ADMIN_USER_ID` — `878c42b0-9a50-11e6-c537-6bf8e9ab02ee` (matches core-schema)
- `SYSTEM_USER_ID` — `3e32c5fa-ac9c-4d39-8b4b-4db3e576b3c3` (matches core-schema)

### Theme
- `tailwind-preset` — Tailwind config preset with Datagrok brand tokens
- `tokens.css` — CSS custom properties for the design system

## Rules
- App code imports from `@datagrok/app-kit`, never from Shadcn directly
- Mock UUIDs must match `@datagrok/core-schema` seed data — do not invent new fake UUIDs
- Changes here affect all apps — test carefully
- Run `npm run typecheck` from the repo root after changes

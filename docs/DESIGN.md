# Design Conventions

## General
- All apps must feel like part of Datagrok — consistent spacing, colors, typography
- Use @datagrok/app-kit components as the primary building blocks
- Underneath, app-kit uses Shadcn/ui — never import Shadcn directly in app code

## Layout
- Every app uses `<PageLayout>` from app-kit for the shell
- Standard structure: sidebar nav (collapsible) + header with breadcrumbs + main content
- Max content width: 1200px for forms, full width for data grids

## Forms
- Labels above inputs
- Required fields: red asterisk
- Validation errors: inline below the field, red text
- Group related fields with section headings
- Save/Cancel buttons fixed at bottom of form

## Data Display
- Use `<DataGrid>` from app-kit for any tabular data
- Default sort: most recently created first
- Always show created_at and created_by in list views
- Empty states: icon + message + primary action button

## Colors
- Primary: use Datagrok brand color (configured in app-kit theme)
- Status colors: Draft=gray, Active=blue, Approved=green, Rejected=red, Archived=muted
- Never hardcode colors — use CSS variables from app-kit theme

## Feedback
- Mutations: show toast on success, inline error on failure
- Loading: skeleton placeholders for initial load, spinner for actions
- Destructive actions: confirmation dialog with explicit name of what's being deleted

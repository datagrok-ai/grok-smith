# Design Conventions

## General
- All apps must feel like part of Datagrok — consistent spacing, colors, typography
- Use @datagrok/app-kit components as the primary building blocks
- Underneath, app-kit uses Shadcn/ui — never import Shadcn directly in app code

## App Layout
- Every app uses `<Shell appName="...">` from app-kit, wrapping the router in App.tsx.
- Each page uses `<View>` to declare its slots (toolbox, ribbon, contextPanel, breadcrumbs, status).
- The shell consists of the following: (toolbox, view, context panel) left to right, and (status bar) at the bottom
  - sidebar nav (resizable, 160–400px). This is also called 'toolbox'.
    'Datagrok / {appName}' label in the top left corner.
    Typically, an app has a tree there - clicking on the item changes the view.
    Toggle via Ctrl+B or status bar icon.
  - view that occupies all available area. Top to bottom:
    - header (40px): breadcrumbs left, ribbon controls right
    - main area (no padding — views control their own)
  - resizable context panel on the right (200–500px). When you click on stuff, details are often shown there.
    Toggle via Ctrl+I or status bar icon.
  - status bar (24px) at the bottom. Has three zones:
    - result of last operation, or progress of the ongoing operation
    - quick summary of the current view (like number of subjects we are currently looking at in the SEND app)
    - global tool icons on the right
      - toggle toolbox visibility
      - toggle context panel visibility
      - bring current view to full screen

View
Each `<View>` provides optional slot props: `toolbox`, `ribbon`, `contextPanel`, `breadcrumbs`, `status`.
Shell conditionally renders panels based on which slots the current view provides.

## Forms
- Labels above inputs
- Required fields: red asterisk
- Validation errors: inline below the field, red text
- Group related fields with section headings
- Save/Cancel buttons fixed at bottom of form

## Data Display
- Use `<DataGrid>` from app-kit for any tabular data (powered by AG Grid Community)
- Use `<DataGrid autoColumns>` for dynamic/unknown schemas (e.g. SEND domain data)
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

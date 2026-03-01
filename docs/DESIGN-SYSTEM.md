# Grok Smith Design System

> **For AI agents (Claude Code):** Read this BEFORE generating any UI code for a grok-smith app.
> These rules are derived from actual Datagrok screenshots and must be followed exactly.

## Design Philosophy

Grok Smith apps are **pharma/biotech enterprise tools**. The UI must:
1. **Match Datagrok's visual language** — so apps feel native when deployed inside the platform
2. **Be consistent across all apps** in the suite (compound reg, bio reg, inventory, plate management, hit triage, clinical trials, etc.)
3. **Be compact and data-dense** — pharma users work with large datasets and expect information density
4. **Use light, neutral colors** — white panels, light gray headers, cool grays. NOT dark themes.

**Aesthetic:** Clinical data workbench. Think scientific desktop application, not consumer SaaS.

---

## Tech Stack (Mandatory)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Components | `@datagrok/app-kit` | Wraps shadcn/ui + Radix primitives. Never import shadcn directly. |
| Styling | `Tailwind CSS` | Use `@datagrok/app-kit/theme/tailwind-preset` preset + `@datagrok/app-kit/theme/tokens.css` |
| Data Grid | `ag-grid-react` + `ag-grid-community` | **ONLY** grid component. NEVER build custom tables. Wrapped by `<DataGrid>` from app-kit. |
| Icons | `lucide-react` | Consistent icon set |
| Charts | `recharts` | When visualization is needed |
| Forms | `react-hook-form` + `zod` | Validation and form state |

### What NOT to use
- ❌ Custom table/grid components — use `<DataGrid>` from app-kit (AG Grid underneath)
- ❌ Material UI, Ant Design, Chakra — use `@datagrok/app-kit` components
- ❌ Direct shadcn/ui imports — always import from `@datagrok/app-kit`
- ❌ CSS modules or styled-components — Tailwind only
- ❌ Dark sidebars or dark themes — Datagrok uses LIGHT panels
- ❌ Uppercase column headers — Datagrok uses normal-case headers
- ❌ Decorative gradients, heavy shadows, or animations

---

## Color System

Colors are defined as CSS custom properties in `@datagrok/app-kit/theme/tokens.css` and mapped to Tailwind tokens via `@datagrok/app-kit/theme/tailwind-preset`. Never hardcode color values — use the Tailwind classes.

### Core Palette
| CSS Variable | Tailwind Class | Value | Usage |
|-------------|---------------|-------|-------|
| `--color-primary` | `text-primary`, `bg-primary` | #2196f3 | Datagrok brand, links, focus rings |
| `--color-primary-hover` | `bg-primary-hover` | #1976d2 | Button/link hover |
| `--color-primary-light` | `bg-primary-light` | #e3f2fd | Selected row bg, active highlight |
| `--color-primary-foreground` | `text-primary-foreground` | #ffffff | Text on primary backgrounds |

### Backgrounds
| CSS Variable | Tailwind Class | Value | Usage |
|-------------|---------------|-------|-------|
| `--color-background` | `bg-background` | #ffffff | Content areas, panels |
| `--color-muted` | `bg-muted` | #f5f5f5 | Headers, toolbars, column headers |
| `--color-neutral-50` | `bg-neutral-50` | #fafafa | Row hover, alternating rows |
| `--color-accent` | `bg-accent` | #f5f5f5 | Subtle highlight |

### Text
| CSS Variable | Tailwind Class | Value | Usage |
|-------------|---------------|-------|-------|
| `--color-foreground` | `text-foreground` | #212121 | Primary text, headings, cell values |
| `--color-muted-foreground` | `text-muted-foreground` | #757575 | Column headers, form labels, section headers |
| `--color-neutral-500` | `text-neutral-500` | #9e9e9e | Placeholders, disabled text |

### Semantic / Action Colors
| CSS Variable | Tailwind Class | Value | Usage |
|-------------|---------------|-------|-------|
| `--color-success` | `text-success`, `bg-success` | #4caf50 | Success states |
| `--color-warning` | `text-warning`, `bg-warning` | #ff9800 | Warning states |
| `--color-destructive` | `text-destructive`, `bg-destructive` | #f44336 | Errors, destructive actions |
| `--color-info` | `text-info`, `bg-info` | #2196f3 | Informational states |

### Borders
| CSS Variable | Tailwind Class | Value | Usage |
|-------------|---------------|-------|-------|
| `--color-border` | `border-border` | #e0e0e0 | Panel borders, grid borders, dividers |
| `--color-input` | `border-input` | #e0e0e0 | Input borders |

### Status Colors (for `<Badge>` variants)
| CSS Variable | Tailwind Class | Value | Usage |
|-------------|---------------|-------|-------|
| `--color-status-draft` | `text-status-draft` | #9e9e9e | Draft status |
| `--color-status-active` | `text-status-active` | #2196f3 | Active status |
| `--color-status-approved` | `text-status-approved` | #4caf50 | Approved status |
| `--color-status-rejected` | `text-status-rejected` | #f44336 | Rejected status |
| `--color-status-archived` | `text-status-archived` | #bdbdbd | Archived status |

### Neutral Scale
Full scale available: `neutral-50` through `neutral-900` (mapped from `--color-neutral-*`). Use for fine-grained grays.

---

## Typography

**Font (--font-sans):** `'Inter', system-ui, -apple-system, sans-serif`
**Mono (--font-mono):** `'JetBrains Mono', 'Fira Code', monospace`

### Scale (strict)

| Role | Class | Size | Weight | Color | Example |
|------|-------|------|--------|-------|---------|
| Entity/page title | `text-sm font-semibold` | 14px | 600 | `text-foreground` | Breadcrumb title, panel title |
| Body / cell values | `text-sm` | 14px | 400 | `text-foreground` | Grid cells, form values |
| Column headers | `text-xs font-medium` | 12px | 500 | `text-muted-foreground` | AG Grid headers (NOT uppercase!) |
| Form labels | `text-sm` | 14px | 400 | `text-muted-foreground` | Form labels (above inputs) |
| Section headers | `text-xs font-semibold` | 12px | 600 | `text-muted-foreground` | Accordion section titles |
| Helper / metadata | `text-xs` | 12px | 400 | `text-muted-foreground` | Status bar, counts, timestamps |
| Muted / counts | `text-xs` | 12px | 400 | `text-neutral-500` | Row counts, disabled states |
| Monospace data | `text-xs font-mono` | 12px | 400 | `text-foreground` | SMILES, IDs, MW, formulas |

### Critical Rules
- **text-base (16px) and above:** NEVER use in app UI content
- **text-sm (14px):** Maximum size for any text. Used for main content.
- **text-xs (12px):** Headers, labels, metadata, all supporting text
- **Column headers:** Normal case. NOT uppercase. NOT tracking-wider.

---

## Layout Architecture

### Shell + View Pattern

Every app uses `<Shell appName="...">` from `@datagrok/app-kit`, wrapping the router. Each page uses `<View>` to declare its slot content. The Shell conditionally renders panels based on which slots the current View provides.

```
┌────────────┬─────────────────────────────────────┬────────────┐
│ Toolbox    │ View Content                        │ Context    │
│ (200px)    │ ┌───────────────────────────────────┤ Panel      │
│            │ │ Header: Breadcrumbs | Ribbon      │ (280px)    │
│ ▸ Section  │ ├───────────────────────────────────┤            │
│   item     │ │                                   │ Accordion  │
│   item     │ │     Main Content                  │ Sections   │
│ ▸ Section  │ │     (no padding — views control)  │ label: val │
│   item     │ │                                   │ label: val │
│            │ ├───────────────────────────────────┤            │
│            │ │ Status Bar (24px)                 │            │
└────────────┴───────────────────────────────────────┴────────────┘
  160–400px            flexible                       200–500px
```

### View Slot Props

Each `<View>` provides optional slot props that the Shell renders:

```tsx
<View
  name="Studies"
  breadcrumbs={[{ label: 'Studies' }]}
  toolbox={<SendNav />}           // Left sidebar content
  ribbon={<Button>+ New</Button>} // Top-right actions
  contextPanel={<DetailPanel />}  // Right sidebar
  status="42 studies"             // Status bar text
>
  <DataGrid ... />                // Main content area
</View>
```

- **toolbox**: Left sidebar (resizable, 160–400px). Toggle: Ctrl+B or status bar icon.
- **ribbon**: Top-right action area (buttons, toolbar icons).
- **contextPanel**: Right sidebar (resizable, 200–500px). Toggle: Ctrl+I or status bar icon.
- **breadcrumbs**: `BreadcrumbItem[]` — `{ label, href }`. Last item is current page (bold).
- **status**: Status bar text. Three zones: operation result | view summary | toggle icons.

### Layout Specs

**Toolbox (left sidebar):** White bg (`bg-background`), right border. Collapsible sections. Active item highlighted with `bg-primary-light`. Typically uses `<TreeView>` for navigation.

**Header (~40px):** Breadcrumbs on the left, ribbon controls on the right.

**Context Panel (right sidebar):** White bg, left border. Accordion sections with ▸/▾. Label:value pairs. Labels: `text-xs text-muted-foreground`. Values: `text-xs text-foreground`.

**Status Bar (24px):** `bg-muted`, top border. Left: operation result. Center: view summary. Right: toolbox/context panel toggle icons + fullscreen.

---

## AG Grid Configuration

Use `<DataGrid>` from `@datagrok/app-kit` — it wraps AG Grid Community with the Datagrok theme applied automatically. The theme CSS is in `@datagrok/app-kit/theme/ag-grid-theme.css`.

### Theme: `ag-theme-datagrok`

```css
.ag-theme-datagrok {
  --ag-header-background-color: var(--color-muted);          /* #f5f5f5 */
  --ag-header-foreground-color: var(--color-muted-foreground); /* #757575 */
  --ag-header-cell-hover-background-color: var(--color-neutral-200);
  --ag-background-color: var(--color-background);             /* #ffffff */
  --ag-row-hover-color: var(--color-neutral-50);              /* #fafafa */
  --ag-selected-row-background-color: var(--color-primary-light); /* #e3f2fd */
  --ag-font-family: var(--font-sans);
  --ag-font-size: var(--text-sm);                             /* 0.875rem */
  --ag-border-color: var(--color-border);                     /* #e0e0e0 */
  --ag-row-border-color: var(--color-border);
  --ag-wrapper-border-radius: var(--radius-lg);
  --ag-cell-horizontal-padding: 16px;
  --ag-range-selection-border-color: var(--color-primary);    /* #2196f3 */
}
```

**Key rules:** All values reference CSS custom properties from `tokens.css` for consistency. Headers are normal-case. Column borders are subtle. NEVER build custom tables — always use `<DataGrid>`.

---

## Forms & Dialogs

### Form Layout: Labels Above Inputs

Use `<FormField>` from `@datagrok/app-kit` for label + input + error wrapper. Use `<Label>`, `<Input>`, `<Textarea>`, `<Select>` for individual controls.

**Labels:** Above input, `text-sm text-muted-foreground`. Required fields show a red asterisk.
**Inputs:** Bordered (`border-input`), `bg-background`, `text-sm text-foreground`.
**Validation errors:** Inline below the field, red text (`text-destructive`).
**Group related fields** with section headings. Save/Cancel buttons at bottom of form.

### Dialog Structure

Use `<Dialog>` + `<DialogContent>`, `<DialogHeader>`, `<DialogTitle>`, `<DialogFooter>` from `@datagrok/app-kit`.

- Header: title (`text-sm font-semibold`), border-bottom
- Body: form fields with standard spacing
- Footer: Cancel (secondary) + primary action button (right-aligned)

### Destructive Actions

Use `<AlertDialog>` for destructive confirmations. Require the user to see the name of what they're deleting.

### Button Variants

The `<Button>` component supports these variants:

| Variant | Usage | Example |
|---------|-------|---------|
| `default` (primary) | Primary actions | Save, Create, Submit |
| `secondary` | Secondary actions | Cancel, Export |
| `ghost` | Toolbar icons, subtle actions | Icon buttons in ribbon |
| `destructive` | Destructive actions | Delete |

Sizes: `sm`, `md` (default), `icon` (square, for icon-only buttons).

---

## Package: `@datagrok/app-kit`

All UI components are imported from `@datagrok/app-kit`. It re-exports `@datagrok/app-core` (auth, hooks, permissions) for convenience.

```typescript
// Layout
import { Shell, View, useShell } from '@datagrok/app-kit'

// Display
import { Button, Badge, Card, Alert, Skeleton, Spinner, EmptyState } from '@datagrok/app-kit'

// Data
import { DataGrid } from '@datagrok/app-kit'

// Dialogs & Menus
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@datagrok/app-kit'
import { AlertDialog, AlertDialogContent, AlertDialogAction, AlertDialogCancel } from '@datagrok/app-kit'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@datagrok/app-kit'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@datagrok/app-kit'

// Form
import { Label, Input, Textarea, Select, SelectTrigger, SelectContent, SelectItem, FormField } from '@datagrok/app-kit'

// Navigation
import { TreeView } from '@datagrok/app-kit'

// Infrastructure (re-exported from @datagrok/app-core)
import { useApi, useCurrentUser, useCanDo, DatagrokProvider } from '@datagrok/app-kit'

// Utility
import { cn } from '@datagrok/app-kit'  // clsx + tailwind-merge
```

### Theme Exports

```typescript
// In tailwind.config.ts:
import datagrokPreset from '@datagrok/app-kit/theme/tailwind-preset'

// In CSS:
@import '@datagrok/app-kit/theme/tokens.css';
@import '@datagrok/app-kit/theme/ag-grid-theme.css';
```

---

## Checklist for AI-Generated Apps

**Layout:**
- [ ] `<Shell appName="...">` wrapping router
- [ ] Each page uses `<View>` with appropriate slot props
- [ ] Toolbox (left sidebar) for navigation, context panel (right) for details
- [ ] Status bar with view summary
- [ ] NO dark sidebars — all panels are light

**Grid:**
- [ ] `<DataGrid>` from `@datagrok/app-kit` only (NEVER custom tables)
- [ ] Headers: normal case, NOT uppercase
- [ ] Show `created_at` and `created_by` in list views

**Forms:**
- [ ] Labels above inputs, using `<FormField>` or `<Label>` + `<Input>`
- [ ] Required fields: red asterisk
- [ ] Validation errors: inline below field, `text-destructive`
- [ ] Destructive actions: `<AlertDialog>` with explicit name

**Colors:**
- [ ] Never hardcode colors — use Tailwind classes from app-kit theme
- [ ] `bg-muted` for headers/toolbars, `bg-background` for content panels
- [ ] Status badges use `<Badge variant="...">` with predefined variants

**Imports:**
- [ ] All components from `@datagrok/app-kit` — never from shadcn or Radix directly
- [ ] `useApi()` for API calls, `useCurrentUser()` for auth
- [ ] `cn()` for composing Tailwind classes

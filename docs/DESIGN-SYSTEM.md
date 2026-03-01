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
| Components | `shadcn/ui` | Primitives only (Button, Dialog, Toast). Restyle to match Datagrok. |
| Styling | `Tailwind CSS` | Use `@grok-smith/tailwind-config` preset |
| Data Grid | `ag-grid-react` + `ag-grid-community` | **ONLY** grid component. NEVER build custom tables. |
| Icons | `lucide-react` | Consistent icon set |
| Charts | `recharts` | When visualization is needed |
| Forms | `react-hook-form` + `zod` | Validation and form state |

### What NOT to use
- ❌ Custom table/grid components — use AG Grid exclusively
- ❌ Material UI, Ant Design, Chakra — use shadcn/ui restyled to Datagrok
- ❌ CSS modules or styled-components — Tailwind only
- ❌ Dark sidebars or dark themes — Datagrok uses LIGHT panels
- ❌ Blue selection highlighting — Datagrok uses GREEN selection
- ❌ Label-above form layouts — Datagrok uses label-LEFT, input-RIGHT
- ❌ Filled dialog buttons — Datagrok uses text-style CANCEL/OK buttons
- ❌ Uppercase column headers — Datagrok uses normal-case headers
- ❌ Decorative gradients, heavy shadows, or animations

---

## Color System (from Datagrok screenshots)

### Backgrounds
| Token | Value | Usage |
|-------|-------|-------|
| `gs-bg` | #FFFFFF | Content areas, panels, tree panel |
| `gs-bgAlt` | #F5F6F8 | Headers, toolbars, column headers, panel headers |
| `gs-bgMuted` | #FAFBFC | Alternating grid rows |
| `gs-bgSelect` | #E8F5E9 | **Selected row (GREEN!)** |
| `gs-bgActive` | #E3EDF7 | Active tree item, active nav highlight |
| `gs-iconStrip` | #3D4F5F | Far-left Datagrok icon strip (dark slate) |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| `gs-text` | #2D3748 | Primary text, headings, cell values |
| `gs-textSec` | #4A5568 | Column headers, form labels, section headers |
| `gs-textTer` | #718096 | Accordion headers, tree icons, helper text |
| `gs-textMuted` | #A0AEC0 | Placeholders, counts, disabled text |
| `gs-link` | #2B6CB0 | Links, clickable IDs (deeper blue than typical) |

### Semantic / Action Colors
| Token | Value | Usage |
|-------|-------|-------|
| `gs-success` | #48BB78 | Green — SAVE button, success states |
| `gs-successBg` | #C6F6D5 | Success badge/notification background |
| `gs-warning` | #D69E2E | Warning states |
| `gs-warningBg` | #FEFCBF | Warning badge/notification background |
| `gs-danger` | #E53E3E | Errors, destructive actions |
| `gs-dangerBg` | #FED7D7 | Error badge/notification background |
| `gs-info` | #3182CE | Informational states |
| `gs-infoBg` | #BEE3F8 | Info badge/notification background |

### Borders
| Token | Value | Usage |
|-------|-------|-------|
| `gs-borderLight` | #EDF2F7 | Between grid rows, inner dividers |
| `gs-border` | #E2E8F0 | Panel borders, main dividers |
| `gs-borderStr` | #CBD5E0 | Outer borders, strong dividers |
| `gs-borderSel` | #A5D6A7 | Selected row border (green) |

### Badge / Status Variants
- **Active/Success:** `bg: #C6F6D5, text: #276749`
- **Pending/Warning:** `bg: #FEFCBF, text: #744210`
- **Error/Failed:** `bg: #FED7D7, text: #9B2C2C`
- **Default/Inactive:** `bg: #EDF2F7, text: #4A5568`
- **Info:** `bg: #BEE3F8, text: #2A4365`

---

## Typography

**Font:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
**Mono:** `'SF Mono', 'Fira Code', 'Fira Mono', Menlo, monospace`

### Scale (strict)

| Role | Class | Size | Weight | Color | Example |
|------|-------|------|--------|-------|---------|
| Entity/page title | `text-sm font-semibold` | 14px | 600 | gs-text | Breadcrumb title, panel title |
| Body / cell values | `text-sm` | 14px | 400 | gs-text | Grid cells, form values |
| Column headers | `text-xs font-medium` | 12px | 500 | gs-textSec | AG Grid headers (NOT uppercase!) |
| Form labels | `text-sm` | 14px | 400 | gs-textSec | Left-side form labels |
| Section headers | `text-xs font-semibold` | 12px | 600 | gs-textSec | Accordion section titles |
| Helper / metadata | `text-xs` | 12px | 400 | gs-textTer | Status bar, counts, timestamps |
| Muted / counts | `text-xs` | 12px | 400 | gs-textMuted | Row counts, disabled states |
| Monospace data | `text-xs font-mono` | 12px | 400 | gs-text | SMILES, IDs, MW, formulas |

### Critical Rules
- **text-base (16px) and above:** NEVER use in app UI content
- **text-sm (14px):** Maximum size for any text. Used for main content.
- **text-xs (12px):** Headers, labels, metadata, all supporting text
- **Column headers:** Normal case. NOT uppercase. NOT tracking-wider.

---

## Layout Architecture

### Datagrok's Four-Zone Pattern

```
┌──┬────────────┬─────────────────────────────────────┬────────────┐
│  │ Tree/Nav   │ Content Area                        │ Context    │
│I │ Panel      │                                     │ Panel      │
│c │            │ ┌─────────────────────────────────┐  │            │
│o │ ▸ Section  │ │ Top Bar (nav + breadcrumb + save)│  │ Entity     │
│n │   item     │ ├─────────────────────────────────┤  │ ▾ Details  │
│  │   item     │ │                                 │  │   l: v     │
│S │   item     │ │                                 │  │   l: v     │
│t │ ▸ Section  │ │     Grid / Content              │  │ ▸ Props    │
│r │   item     │ │                                 │  │ ▸ Desc.    │
│i │            │ │                                 │  │ ▸ Biology  │
│p │            │ │                                 │  │ ▾ DBs      │
│  │            │ ├─────────────────────────────────┤  │   l: v     │
│  │ [Toolbox]  │ │ Status Bar (name + cols + rows) │  │   l: v     │
│⚙ │ [Browse ]  │ └─────────────────────────────────┘  │            │
└──┴────────────┴─────────────────────────────────────┴────────────┘
 28    200px              flexible                        280px
```

### Standalone vs Embedded

**Standalone (outside Datagrok):** Omit the icon strip. Tree panel = app sidebar. Rest identical.
**Embedded in Datagrok:** Datagrok provides icon strip + may replace tree panel. Content + context panel must work independently.

### Component Specs

**Tree/Nav Panel (200px):** White bg, right border #E2E8F0. Collapsible sections (▸/▾). Active item: bg #E3EDF7, text #2B6CB0. Bottom tabs pattern ("Toolbox | Browse").

**Top Bar (~32px):** Bg #F5F6F8, bottom border. Left: nav icons + breadcrumb (segments / separated, last bold, others blue links). Right: SAVE (green filled) + toolbar icons (ghost).

**Context Panel (280px):** White bg, left border. Accordion sections with ▸/▾. Label:value pairs (flex justify-between). Labels: text-xs #718096. Values: text-xs #2D3748 (or #2B6CB0 if link).

**Status Bar (~28px):** Bg #F5F6F8, top border. Left: entity name + "Columns: N" + "Rows: N". Right: view toggle icons. Text-xs #718096.

---

## AG Grid Configuration

### Theme: `ag-theme-grok-smith`

```css
.ag-theme-grok-smith {
  --ag-header-height: 32px;
  --ag-row-height: 32px;
  --ag-font-size: 13px;
  --ag-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --ag-header-background-color: #F5F6F8;
  --ag-header-foreground-color: #4A5568;
  --ag-odd-row-background-color: #FFFFFF;
  --ag-even-row-background-color: #FAFBFC;
  --ag-row-hover-color: #F0FFF4;
  --ag-selected-row-background-color: #E8F5E9;   /* GREEN! */
  --ag-range-selection-border-color: #A5D6A7;
  --ag-border-color: #E2E8F0;
  --ag-row-border-color: #EDF2F7;
  --ag-header-column-separator-color: #E2E8F0;
  --ag-cell-horizontal-padding: 12px;
}
```

**Key rules:** Selection is GREEN. Headers are normal-case. Column borders are subtle. NEVER build custom tables.

---

## Forms & Dialogs (Datagrok Style)

### Form Layout: LABEL-LEFT, INPUT-RIGHT

```
     Table │ smiles        ▼  ↗ 📋 📋
  Molecules │ canonical_smiles  ▼
  Threshold │ 0.55________________________
Fprint type │ Morgan           ▼
```

**Labels:** LEFT of input, right-aligned, min-width 120px, text-sm, color #4A5568
**Inputs:** Underline only (border-bottom), bg-transparent, text-sm, color #2D3748
**Selects:** Same underline style + optional action icons (↗, 📋) to the right
**Focus:** border-bottom turns #2B6CB0
**Error:** border-bottom turns #E53E3E + text-xs error below

### Dialog Structure
- Header: title (text-sm font-semibold), border-bottom
- Body: label-left fields, py-1 spacing (compact)
- Footer: ↻ reset (left) + CANCEL / OK text buttons (right)
- Buttons: **text-style**, uppercase, font-semibold, color #2B6CB0. NO filled buttons.

### Button Types Across the App
| Context | Style | Example |
|---------|-------|---------|
| Dialog actions | Text (CANCEL/OK) | `CANCEL  OK` |
| Save action (top bar) | Green filled | `💾 SAVE` |
| Primary page action | Green filled | `➕ NEW` |
| Toolbar | Ghost icons | `⊞ ⊟ ▦ ☰` |
| Secondary | Outlined | `Export` |

---

## Shared Package (`@grok-smith/ui`)

```typescript
// Layouts
export { AppShell, TopBar, TreePanel, ContextPanel, StatusBar }
// Data
export { DataGrid, EmptyState }
// Primitives (restyled for Datagrok)
export { DgButton, DgInput, DgSelect, DgDialog, Badge }
```

---

## Checklist for AI-Generated Apps

**Layout:**
- [ ] Tree panel + content + context panel (NO dark sidebar)
- [ ] Top bar with breadcrumb + green SAVE + toolbar icons
- [ ] Context panel: accordion sections (▸/▾), label:value pairs
- [ ] Status bar: entity + columns + rows

**Grid:**
- [ ] AG Grid only (NEVER custom tables)
- [ ] Selection: GREEN (#E8F5E9)
- [ ] Headers: normal case, NOT uppercase

**Forms:**
- [ ] Label-LEFT, input-RIGHT (NOT label above)
- [ ] Underline inputs (border-bottom only)
- [ ] Dialog buttons: text-style CANCEL/OK
- [ ] Reset icon ↻ bottom-left

**Colors:**
- [ ] Selection: GREEN  |  Links: #2B6CB0  |  Save: #48BB78
- [ ] Light panels, #F5F6F8 headers, no dark sidebars

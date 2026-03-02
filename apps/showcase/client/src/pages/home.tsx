import { useState, useMemo, type ComponentType } from 'react'

import { View, TreeView } from '@datagrok/app-kit'
import type { TreeViewItem } from '@datagrok/app-kit'

import { ShellDemo, ViewDemo } from '../demos/layout-demos'
import { ButtonDemo, BadgeDemo, SkeletonDemo, SpinnerDemo, AlertDemo, CardDemo, EmptyStateDemo } from '../demos/display-demos'
import { DataGridDemo } from '../demos/data-demos'
import { DialogDemo, AlertDialogDemo, DropdownMenuDemo } from '../demos/dialog-demos'
import { AccordionDemo, ButtonGroupDemo, ContextMenuDemo } from '../demos/interactive-demos'
import { BreadcrumbDemo, TabsDemo, TreeViewDemo } from '../demos/navigation-demos'
import { FormFieldDemo, LabelDemo, InputDemo, TextareaDemo, SelectDemo } from '../demos/form-demos'

// ---------------------------------------------------------------------------
// Component registry
// ---------------------------------------------------------------------------

interface ComponentEntry {
  id: string
  name: string
  category: string
  description: string
  component: ComponentType
}

const components: ComponentEntry[] = [
  // Layout
  { id: 'Shell', name: 'Shell', category: 'Layout', description: 'Top-level app frame with toolbox, view, context panel, and status bar.', component: ShellDemo },
  { id: 'View', name: 'View', category: 'Layout', description: 'Per-page slot provider for breadcrumbs, toolbox, ribbon, context panel, and status.', component: ViewDemo },

  // Display
  { id: 'Accordion', name: 'Accordion', category: 'Display', description: 'Collapsible sections for organizing content. Supports single or multiple open items.', component: AccordionDemo },
  { id: 'Button', name: 'Button', category: 'Display', description: 'Flexible button with primary, secondary, ghost, and destructive variants.', component: ButtonDemo },
  { id: 'ButtonGroup', name: 'ButtonGroup', category: 'Display', description: 'Groups related buttons with collapsed borders and shared border-radius.', component: ButtonGroupDemo },
  { id: 'Badge', name: 'Badge', category: 'Display', description: 'Inline status indicator with semantic color variants.', component: BadgeDemo },
  { id: 'Skeleton', name: 'Skeleton', category: 'Display', description: 'Loading placeholder with pulse animation.', component: SkeletonDemo },
  { id: 'Spinner', name: 'Spinner', category: 'Display', description: 'Animated loading spinner in three sizes.', component: SpinnerDemo },
  { id: 'Alert', name: 'Alert', category: 'Display', description: 'Alert container with info, success, warning, and destructive variants.', component: AlertDemo },
  { id: 'Card', name: 'Card', category: 'Display', description: 'Container with border, shadow, header, content, and footer sections.', component: CardDemo },
  { id: 'EmptyState', name: 'EmptyState', category: 'Display', description: 'Centered placeholder for empty data views.', component: EmptyStateDemo },

  // Data
  { id: 'DataGrid', name: 'DataGrid', category: 'Data', description: 'AG Grid wrapper with Datagrok theme, sorting, and custom renderers.', component: DataGridDemo },

  // Dialogs & Overlays
  { id: 'Dialog', name: 'Dialog', category: 'Overlays', description: 'Modal dialog for focused content and forms.', component: DialogDemo },
  { id: 'AlertDialog', name: 'AlertDialog', category: 'Overlays', description: 'Confirmation dialog for destructive actions.', component: AlertDialogDemo },
  { id: 'ContextMenu', name: 'ContextMenu', category: 'Overlays', description: 'Right-click context menu with items, separators, and destructive styling.', component: ContextMenuDemo },
  { id: 'DropdownMenu', name: 'DropdownMenu', category: 'Overlays', description: 'Action menu with items, separators, and destructive styling.', component: DropdownMenuDemo },

  // Navigation
  { id: 'Breadcrumb', name: 'Breadcrumb', category: 'Navigation', description: 'Composable breadcrumb navigation for in-page use.', component: BreadcrumbDemo },
  { id: 'Tabs', name: 'Tabs', category: 'Navigation', description: 'Tabbed interface for switching between views.', component: TabsDemo },
  { id: 'TreeView', name: 'TreeView', category: 'Navigation', description: 'Hierarchical tree with expand/collapse and selection.', component: TreeViewDemo },

  // Forms
  { id: 'FormField', name: 'FormField', category: 'Forms', description: 'Label + input + error wrapper for building forms.', component: FormFieldDemo },
  { id: 'Label', name: 'Label', category: 'Forms', description: 'Form label with optional required asterisk.', component: LabelDemo },
  { id: 'Input', name: 'Input', category: 'Forms', description: 'Text input field with multiple types and states.', component: InputDemo },
  { id: 'Textarea', name: 'Textarea', category: 'Forms', description: 'Resizable multi-line text input.', component: TextareaDemo },
  { id: 'Select', name: 'Select', category: 'Forms', description: 'Dropdown select with custom styling.', component: SelectDemo },
]

// ---------------------------------------------------------------------------
// Build tree from registry
// ---------------------------------------------------------------------------

const categories = ['Layout', 'Display', 'Data', 'Overlays', 'Navigation', 'Forms']

function buildTree(): TreeViewItem[] {
  return categories.map((cat) => ({
    id: `cat:${cat}`,
    name: cat,
    children: components
      .filter((c) => c.category === cat)
      .map((c) => ({ id: c.id, name: c.name, children: [] as TreeViewItem[] })),
  }))
}

// ---------------------------------------------------------------------------
// Context panel
// ---------------------------------------------------------------------------

function ComponentInfo({ entry }: { entry: ComponentEntry | null }) {
  if (!entry) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
        Select a component
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{entry.name}</h3>
      <p className="text-sm text-muted-foreground">{entry.description}</p>
      <div className="space-y-1 pt-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Category</span>
          <span>{entry.category}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Import</span>
          <code className="text-xs font-mono">@datagrok/app-kit</code>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Home page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const [selectedId, setSelectedId] = useState<string | null>('Button')
  const treeData = useMemo(buildTree, [])

  const selectedEntry = components.find((c) => c.id === selectedId) ?? null
  const DemoComponent = selectedEntry?.component ?? null

  const handleSelect = (item: TreeViewItem) => {
    // Only select leaf items (components, not categories)
    if (!item.id.startsWith('cat:')) {
      setSelectedId(item.id)
    }
  }

  const breadcrumbs = [{ label: 'Showcase' }]
  if (selectedEntry) {
    breadcrumbs.push({ label: selectedEntry.category })
    breadcrumbs.push({ label: selectedEntry.name })
  }

  return (
    <View
      name="Showcase"
      breadcrumbs={breadcrumbs}
      toolbox={
        <TreeView
          data={treeData}
          selectedId={selectedId}
          defaultExpandedIds={new Set(categories.map((c) => `cat:${c}`))}
          onSelect={handleSelect}
        />
      }
      contextPanel={<ComponentInfo entry={selectedEntry} />}
      status={`${String(components.length)} components`}
    >
      <div className="flex-1 overflow-auto p-6">
        {DemoComponent ? (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-1">{selectedEntry?.name}</h2>
            <p className="text-sm text-muted-foreground mb-6">
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                {'import { '}{selectedEntry?.name}{' } from \'@datagrok/app-kit\''}
              </code>
            </p>
            <DemoComponent />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground h-full">
            Select a component from the tree
          </div>
        )}
      </div>
    </View>
  )
}

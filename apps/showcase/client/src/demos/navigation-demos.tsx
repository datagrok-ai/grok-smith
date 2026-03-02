import { useState } from 'react'

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TreeView,
  Badge,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@datagrok/app-kit'
import type { TreeViewItem } from '@datagrok/app-kit'

function DemoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">{title}</h3>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Breadcrumb
// ---------------------------------------------------------------------------

export function BreadcrumbDemo() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Composable breadcrumb navigation. Separate from Shell&apos;s built-in breadcrumbs —
        use this when you need breadcrumbs inside page content.
      </p>

      <DemoSection title="Basic breadcrumb">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Studies</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>XY-2024-001</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </DemoSection>

      <DemoSection title="Deep path">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Studies</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">XY-2024-001</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Findings</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Microscopic</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </DemoSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

export function TabsDemo() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Tabbed interface for switching between views. Composed of Tabs, TabsList,
        TabsTrigger, and TabsContent.
      </p>

      <DemoSection title="Basic tabs">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="findings">Findings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="p-4 border border-border rounded-b-lg text-sm">
              Overview tab content. Shows study summary information.
            </div>
          </TabsContent>
          <TabsContent value="subjects">
            <div className="p-4 border border-border rounded-b-lg text-sm">
              Subjects tab content. Shows enrolled subjects in the study.
            </div>
          </TabsContent>
          <TabsContent value="findings">
            <div className="p-4 border border-border rounded-b-lg text-sm">
              Findings tab content. Shows clinical and pathological findings.
            </div>
          </TabsContent>
        </Tabs>
      </DemoSection>

      <DemoSection title="Controlled tabs">
        <ControlledTabsExample />
      </DemoSection>
    </div>
  )
}

function ControlledTabsExample() {
  const [tab, setTab] = useState('bw')

  return (
    <div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="bw">Body Weight</TabsTrigger>
          <TabsTrigger value="cl">Clinical Lab</TabsTrigger>
          <TabsTrigger value="mi">Microscopic</TabsTrigger>
        </TabsList>
        <TabsContent value="bw">
          <div className="p-4 border border-border rounded-b-lg text-sm">
            Body weight measurements over time.
          </div>
        </TabsContent>
        <TabsContent value="cl">
          <div className="p-4 border border-border rounded-b-lg text-sm">
            Clinical laboratory parameters.
          </div>
        </TabsContent>
        <TabsContent value="mi">
          <div className="p-4 border border-border rounded-b-lg text-sm">
            Microscopic examination results.
          </div>
        </TabsContent>
      </Tabs>
      <p className="text-xs text-muted-foreground mt-2">
        Active tab: <code className="bg-muted px-1 rounded">{tab}</code>
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TreeView
// ---------------------------------------------------------------------------

const sampleTree: TreeViewItem[] = [
  {
    id: 'studies',
    name: 'Studies',
    children: [
      {
        id: 'study-1',
        name: 'XY-2024-001',
        children: [
          { id: 'bw-1', name: 'Body Weight', children: [] },
          { id: 'cl-1', name: 'Clinical Lab', children: [] },
          { id: 'mi-1', name: 'Microscopic', children: [] },
        ],
      },
      {
        id: 'study-2',
        name: 'XY-2024-002',
        children: [
          { id: 'bw-2', name: 'Body Weight', children: [] },
          { id: 'fw-2', name: 'Food/Water', children: [] },
        ],
      },
    ],
  },
  {
    id: 'reports',
    name: 'Reports',
    children: [
      { id: 'summary', name: 'Summary Report', children: [] },
      { id: 'individual', name: 'Individual Data', children: [] },
    ],
  },
]

export function TreeViewDemo() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Hierarchical tree with expand/collapse, selection, and custom rendering.
        Typically used in the toolbox for navigation.
      </p>

      <DemoSection title="Basic tree">
        <div className="border border-border rounded-lg p-2 max-w-sm">
          <TreeView
            data={sampleTree}
            selectedId={selected}
            defaultExpandedIds={new Set(['studies'])}
            onSelect={(item: TreeViewItem) => setSelected(item.id)}
          />
        </div>
        {selected && (
          <p className="text-xs text-muted-foreground">
            Selected: <code className="bg-muted px-1 rounded">{selected}</code>
          </p>
        )}
      </DemoSection>

      <DemoSection title="Custom render">
        <div className="border border-border rounded-lg p-2 max-w-sm">
          <TreeView
            data={[
              {
                id: 'active',
                name: 'Active',
                children: [
                  { id: 'a1', name: 'XY-2024-001', children: [] },
                  { id: 'a2', name: 'XY-2024-004', children: [] },
                ],
              },
              {
                id: 'completed',
                name: 'Completed',
                children: [
                  { id: 'c1', name: 'XY-2024-005', children: [] },
                ],
              },
            ]}
            defaultExpandedIds={new Set(['active', 'completed'])}
            renderItem={(item: TreeViewItem) => {
              if (item.id === 'active') return <span className="flex items-center gap-1.5">{item.name} <Badge variant="active">2</Badge></span>
              if (item.id === 'completed') return <span className="flex items-center gap-1.5">{item.name} <Badge variant="completed">1</Badge></span>
              return <span className="font-mono text-xs">{item.name}</span>
            }}
          />
        </div>
      </DemoSection>
    </div>
  )
}

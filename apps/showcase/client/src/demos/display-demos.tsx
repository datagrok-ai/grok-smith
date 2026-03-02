import { useState } from 'react'

import {
  Button,
  Badge,
  Skeleton,
  Spinner,
  Alert,
  AlertTitle,
  AlertDescription,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  EmptyState,
} from '@datagrok/app-kit'

function DemoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">{title}</h3>
      {children}
    </div>
  )
}

function DemoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-wrap">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

export function ButtonDemo() {
  const [count, setCount] = useState(0)

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Flexible button with multiple variants and sizes.
      </p>

      <DemoSection title="Variants">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </DemoSection>

      <DemoSection title="Sizes">
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="icon">+</Button>
        </div>
      </DemoSection>

      <DemoSection title="States">
        <div className="flex items-center gap-2 flex-wrap">
          <Button disabled>Disabled</Button>
          <Button variant="secondary" disabled>Disabled Secondary</Button>
        </div>
      </DemoSection>

      <DemoSection title="Interactive">
        <div className="flex items-center gap-3">
          <Button onClick={() => setCount((c) => c + 1)}>Clicked {count} times</Button>
          <Button variant="secondary" onClick={() => setCount(0)}>Reset</Button>
        </div>
      </DemoSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

export function BadgeDemo() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Inline status or category indicator with semantic color variants.
      </p>

      <DemoSection title="Status variants">
        <div className="space-y-2">
          <DemoRow label="Neutral">
            <Badge variant="default">Default</Badge>
            <Badge variant="draft">Draft</Badge>
            <Badge variant="archived">Archived</Badge>
          </DemoRow>
          <DemoRow label="Active">
            <Badge variant="active">Active</Badge>
            <Badge variant="in_progress">In Progress</Badge>
          </DemoRow>
          <DemoRow label="Positive">
            <Badge variant="approved">Approved</Badge>
            <Badge variant="completed">Completed</Badge>
            <Badge variant="success">Success</Badge>
          </DemoRow>
          <DemoRow label="Negative">
            <Badge variant="rejected">Rejected</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </DemoRow>
        </div>
      </DemoSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function SkeletonDemo() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Loading placeholder with pulse animation. Use for initial data loading.
      </p>

      <DemoSection title="Basic shapes">
        <div className="space-y-3 max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </DemoSection>

      <DemoSection title="Card skeleton">
        <div className="max-w-sm space-y-3 p-4 border border-border rounded-lg">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </DemoSection>

      <DemoSection title="Avatar + text">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </DemoSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

export function SpinnerDemo() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Animated loading indicator. Use for action-triggered loading (button clicks, form submissions).
      </p>

      <DemoSection title="Sizes">
        <div className="flex items-end gap-6">
          <div className="flex flex-col items-center gap-2">
            <Spinner size="sm" />
            <span className="text-xs text-muted-foreground">sm</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Spinner size="md" />
            <span className="text-xs text-muted-foreground">md</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Spinner size="lg" />
            <span className="text-xs text-muted-foreground">lg</span>
          </div>
        </div>
      </DemoSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Alert
// ---------------------------------------------------------------------------

export function AlertDemo() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Container for alert messages with semantic variants.
      </p>

      <DemoSection title="Variants">
        <div className="space-y-3 max-w-lg">
          <Alert variant="info">
            <AlertTitle>Info</AlertTitle>
            <AlertDescription>This is an informational message.</AlertDescription>
          </Alert>
          <Alert variant="success">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Operation completed successfully.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>Please review before proceeding.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Something went wrong. Please try again.</AlertDescription>
          </Alert>
        </div>
      </DemoSection>

      <DemoSection title="Without title">
        <div className="max-w-lg">
          <Alert variant="info">
            <AlertDescription>A simple alert with only a description.</AlertDescription>
          </Alert>
        </div>
      </DemoSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export function CardDemo() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Container with border, shadow, and rounded corners. Composed of Header, Title,
        Description, Content, and Footer subcomponents.
      </p>

      <DemoSection title="Full card">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Study XY-2024-001</CardTitle>
            <CardDescription>28-day repeated dose toxicity study in rats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Species</span>
              <span>Rat</span>
              <span className="text-muted-foreground">Duration</span>
              <span>28 days</span>
              <span className="text-muted-foreground">Status</span>
              <Badge variant="active">Active</Badge>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button size="sm">Open</Button>
            <Button size="sm" variant="secondary">Export</Button>
          </CardFooter>
        </Card>
      </DemoSection>

      <DemoSection title="Minimal card">
        <Card className="max-w-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">A card with only content, no header or footer.</p>
          </CardContent>
        </Card>
      </DemoSection>

      <DemoSection title="Card grid">
        <div className="grid grid-cols-3 gap-3 max-w-2xl">
          {['Studies', 'Subjects', 'Findings'].map((title) => (
            <Card key={title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">{Math.floor(Math.random() * 100)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </DemoSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

export function EmptyStateDemo() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Centered placeholder for empty data views. Shows an icon, title, optional description,
        and optional action button.
      </p>

      <DemoSection title="With action">
        <div className="border border-border rounded-lg p-8">
          <EmptyState
            icon="📋"
            title="No studies yet"
            description="Upload your first SEND study to get started"
            action={<Button>Upload Study</Button>}
          />
        </div>
      </DemoSection>

      <DemoSection title="Minimal">
        <div className="border border-border rounded-lg p-8">
          <EmptyState
            title="No results found"
            description="Try adjusting your search filters"
          />
        </div>
      </DemoSection>
    </div>
  )
}

import { useState } from 'react'

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Button,
  ButtonGroup,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@datagrok/app-kit'

function DemoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">{title}</h3>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Accordion
// ---------------------------------------------------------------------------

export function AccordionDemo() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Collapsible sections for organizing content. Supports single or multiple open items.
      </p>

      <DemoSection title="Single open">
        <Accordion type="single" collapsible className="max-w-md">
          <AccordionItem value="overview">
            <AccordionTrigger>Study Overview</AccordionTrigger>
            <AccordionContent>
              General information about the study including protocol number, title, and phase.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="subjects">
            <AccordionTrigger>Subjects</AccordionTrigger>
            <AccordionContent>
              Subject enrollment, demographics, and disposition data across all treatment groups.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="findings">
            <AccordionTrigger>Findings</AccordionTrigger>
            <AccordionContent>
              Clinical observations, body weight, food consumption, and laboratory results.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DemoSection>

      <DemoSection title="Multiple open">
        <Accordion type="multiple" defaultValue={['bw', 'cl']} className="max-w-md">
          <AccordionItem value="bw">
            <AccordionTrigger>Body Weight</AccordionTrigger>
            <AccordionContent>
              Individual and summary body weight data collected at weekly intervals.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="cl">
            <AccordionTrigger>Clinical Lab</AccordionTrigger>
            <AccordionContent>
              Hematology, clinical chemistry, and urinalysis parameters.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="mi">
            <AccordionTrigger>Microscopic</AccordionTrigger>
            <AccordionContent>
              Histopathological examination findings from terminal necropsy.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DemoSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ButtonGroup
// ---------------------------------------------------------------------------

export function ButtonGroupDemo() {
  const [view, setView] = useState('table')

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Groups related buttons together with collapsed borders and shared border-radius.
      </p>

      <DemoSection title="View switcher">
        <div className="flex items-center gap-3">
          <ButtonGroup>
            <Button
              variant={view === 'table' ? 'primary' : 'secondary'}
              onClick={() => setView('table')}
            >
              Table
            </Button>
            <Button
              variant={view === 'chart' ? 'primary' : 'secondary'}
              onClick={() => setView('chart')}
            >
              Chart
            </Button>
            <Button
              variant={view === 'summary' ? 'primary' : 'secondary'}
              onClick={() => setView('summary')}
            >
              Summary
            </Button>
          </ButtonGroup>
          <span className="text-sm text-muted-foreground">Active: {view}</span>
        </div>
      </DemoSection>

      <DemoSection title="Secondary group">
        <ButtonGroup>
          <Button variant="secondary">Copy</Button>
          <Button variant="secondary">Cut</Button>
          <Button variant="secondary">Paste</Button>
        </ButtonGroup>
      </DemoSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ContextMenu
// ---------------------------------------------------------------------------

export function ContextMenuDemo() {
  const [lastAction, setLastAction] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Right-click menu for contextual actions. Same styling as DropdownMenu but triggered
        by right-click instead of a button.
      </p>

      <DemoSection title="Right-click area">
        <div className="flex items-center gap-3">
          <ContextMenu>
            <ContextMenuTrigger className="flex h-32 w-64 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
              Right-click here
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onSelect={() => setLastAction('View details')}>
                View details
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => setLastAction('Edit')}>Edit</ContextMenuItem>
              <ContextMenuItem onSelect={() => setLastAction('Duplicate')}>
                Duplicate
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem destructive onSelect={() => setLastAction('Delete')}>
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          {lastAction && (
            <span className="text-sm text-muted-foreground">Last action: {lastAction}</span>
          )}
        </div>
      </DemoSection>
    </div>
  )
}

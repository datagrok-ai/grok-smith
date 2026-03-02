import { useState } from 'react'

import {
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  FormField,
  Input,
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
// Dialog
// ---------------------------------------------------------------------------

export function DialogDemo() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Modal dialog for focused content. Radix-based with animated overlay.
        Composed of Trigger, Content, Header, Footer, Title, Description, and Close.
      </p>

      <DemoSection title="Basic dialog">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Study</DialogTitle>
              <DialogDescription>Make changes to the study and save when done.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <FormField label="Study ID" required>
                <Input defaultValue="XY-2024-001" />
              </FormField>
              <FormField label="Title">
                <Input defaultValue="28-day oral toxicity in rats" />
              </FormField>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>Save</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DemoSection>

      <DemoSection title="Minimal dialog">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">Info Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>About Showcase</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              This app demonstrates all Datagrok app-kit components.
            </p>
          </DialogContent>
        </Dialog>
      </DemoSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AlertDialog
// ---------------------------------------------------------------------------

export function AlertDialogDemo() {
  const [deleted, setDeleted] = useState(false)
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Confirmation dialog for destructive actions. Forces the user to explicitly confirm
        before proceeding.
      </p>

      <DemoSection title="Delete confirmation">
        <div className="flex items-center gap-3">
          <Button variant="destructive" onClick={() => setOpen(true)}>
            Delete Study
          </Button>
          {deleted && (
            <span className="text-sm text-muted-foreground">(Study deleted — not really!)</span>
          )}
        </div>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete study XY-2024-001?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the study and all associated data including subjects,
                findings, and exposures. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => setDeleted(true)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DemoSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DropdownMenu
// ---------------------------------------------------------------------------

export function DropdownMenuDemo() {
  const [lastAction, setLastAction] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Context menu or action menu. Supports items, groups, separators, and destructive actions.
      </p>

      <DemoSection title="Action menu">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setLastAction('Edit')}>Edit</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setLastAction('Duplicate')}>Duplicate</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setLastAction('Export')}>Export</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={() => setLastAction('Delete')}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {lastAction && (
            <span className="text-sm text-muted-foreground">Last action: {lastAction}</span>
          )}
        </div>
      </DemoSection>

      <DemoSection title="Icon button trigger">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">&#8942;</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Copy link</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive>Remove</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </DemoSection>
    </div>
  )
}

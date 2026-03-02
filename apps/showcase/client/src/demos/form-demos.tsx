import { useState } from 'react'

import {
  Button,
  Label,
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  FormField,
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
// FormField
// ---------------------------------------------------------------------------

export function FormFieldDemo() {
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const nameError = submitted && !name ? 'Study ID is required' : undefined

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Wrapper combining Label, input, and error message. The standard way to build forms.
      </p>

      <DemoSection title="With validation">
        <div className="max-w-sm space-y-4">
          <FormField label="Study ID" required error={nameError}>
            <Input
              placeholder="e.g. XY-2024-001"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
          </FormField>
          <FormField label="Description">
            <Textarea placeholder="Optional description..." />
          </FormField>
          <FormField label="Species" required>
            <Select defaultValue="rat">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rat">Rat</SelectItem>
                <SelectItem value="mouse">Mouse</SelectItem>
                <SelectItem value="dog">Dog</SelectItem>
                <SelectItem value="monkey">Monkey</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => setSubmitted(true)}>Submit</Button>
            <Button variant="secondary" onClick={() => { setSubmitted(false); setName('') }}>
              Reset
            </Button>
          </div>
        </div>
      </DemoSection>

      <DemoSection title="Error state">
        <div className="max-w-sm">
          <FormField label="Email" required error="Please enter a valid email address">
            <Input type="email" defaultValue="invalid" />
          </FormField>
        </div>
      </DemoSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

export function LabelDemo() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Form label with optional required indicator (red asterisk).
      </p>

      <DemoSection title="Variants">
        <div className="space-y-3 max-w-sm">
          <div>
            <Label>Optional field</Label>
            <Input placeholder="No asterisk" />
          </div>
          <div>
            <Label required>Required field</Label>
            <Input placeholder="Red asterisk shown" />
          </div>
        </div>
      </DemoSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export function InputDemo() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Text input field with focus ring and disabled state.
      </p>

      <DemoSection title="Types">
        <div className="space-y-3 max-w-sm">
          <Input type="text" placeholder="Text input" />
          <Input type="email" placeholder="Email input" />
          <Input type="number" placeholder="Number input" />
          <Input type="password" placeholder="Password input" />
          <Input type="date" />
        </div>
      </DemoSection>

      <DemoSection title="States">
        <div className="space-y-3 max-w-sm">
          <Input placeholder="Default" />
          <Input defaultValue="With value" />
          <Input disabled placeholder="Disabled" />
          <Input disabled defaultValue="Disabled with value" />
        </div>
      </DemoSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Textarea
// ---------------------------------------------------------------------------

export function TextareaDemo() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Multi-line text input. Resizable by the user, minimum height 80px.
      </p>

      <DemoSection title="Variants">
        <div className="space-y-3 max-w-sm">
          <Textarea placeholder="Enter description..." />
          <Textarea defaultValue="This textarea already has content. It can be resized by dragging the bottom-right corner." />
          <Textarea disabled placeholder="Disabled textarea" />
        </div>
      </DemoSection>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

export function SelectDemo() {
  const [value, setValue] = useState<string>('')

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Dropdown select component. Radix-based with custom styling. Composed of Select,
        SelectTrigger, SelectValue, SelectContent, and SelectItem.
      </p>

      <DemoSection title="Basic select">
        <div className="max-w-sm">
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger>
              <SelectValue placeholder="Select species..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rat">Rat</SelectItem>
              <SelectItem value="mouse">Mouse</SelectItem>
              <SelectItem value="dog">Dog</SelectItem>
              <SelectItem value="monkey">Monkey</SelectItem>
              <SelectItem value="rabbit">Rabbit</SelectItem>
            </SelectContent>
          </Select>
          {value && (
            <p className="text-xs text-muted-foreground mt-2">
              Selected: <code className="bg-muted px-1 rounded">{value}</code>
            </p>
          )}
        </div>
      </DemoSection>

      <DemoSection title="With disabled items">
        <div className="max-w-sm">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select route..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oral">Oral</SelectItem>
              <SelectItem value="dermal">Dermal</SelectItem>
              <SelectItem value="inhalation">Inhalation</SelectItem>
              <SelectItem value="iv" disabled>Intravenous (unavailable)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </DemoSection>
    </div>
  )
}

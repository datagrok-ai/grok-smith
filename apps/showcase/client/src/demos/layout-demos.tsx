import { useShell } from '@datagrok/app-kit'

function DemoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">{title}</h3>
      {children}
    </div>
  )
}

export function ShellDemo() {
  const { panelState, actions } = useShell()

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        The Shell component is the top-level app frame. It manages the toolbox (left panel),
        main view area, context panel (right panel), and status bar. You're inside one right now.
      </p>

      <DemoSection title="Panel state (live)">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Toolbox visible:</span>
          <span className="font-mono">{String(panelState.toolboxVisible)}</span>
          <span className="text-muted-foreground">Toolbox width:</span>
          <span className="font-mono">{panelState.toolboxWidth}px</span>
          <span className="text-muted-foreground">Context panel visible:</span>
          <span className="font-mono">{String(panelState.contextPanelVisible)}</span>
          <span className="text-muted-foreground">Context panel width:</span>
          <span className="font-mono">{panelState.contextPanelWidth}px</span>
        </div>
      </DemoSection>

      <DemoSection title="Keyboard shortcuts">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <kbd className="px-2 py-0.5 bg-muted rounded text-xs font-mono w-fit">Ctrl+B</kbd>
          <span className="text-muted-foreground">Toggle toolbox</span>
          <kbd className="px-2 py-0.5 bg-muted rounded text-xs font-mono w-fit">Ctrl+I</kbd>
          <span className="text-muted-foreground">Toggle context panel</span>
        </div>
      </DemoSection>

      <DemoSection title="Actions">
        <div className="flex gap-2 flex-wrap">
          <button
            className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded"
            onClick={actions.toggleToolbox}
          >
            Toggle Toolbox
          </button>
          <button
            className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded"
            onClick={actions.toggleContextPanel}
          >
            Toggle Context Panel
          </button>
          <button
            className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded"
            onClick={actions.requestFullscreen}
          >
            Fullscreen
          </button>
        </div>
      </DemoSection>
    </div>
  )
}

export function ViewDemo() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        The View component declares slot content for the Shell. Each page uses View to populate
        breadcrumbs, toolbox, ribbon, context panel, and status bar.
      </p>

      <DemoSection title="Slot props">
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">breadcrumbs</code>
            <span className="text-muted-foreground">Navigation path at the top left</span>
          </div>
          <div className="flex gap-2">
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">toolbox</code>
            <span className="text-muted-foreground">Left sidebar content (the tree you see now)</span>
          </div>
          <div className="flex gap-2">
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">ribbon</code>
            <span className="text-muted-foreground">Action buttons at the top right</span>
          </div>
          <div className="flex gap-2">
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">contextPanel</code>
            <span className="text-muted-foreground">Right sidebar (component info shown there now)</span>
          </div>
          <div className="flex gap-2">
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">status</code>
            <span className="text-muted-foreground">Text in the bottom status bar</span>
          </div>
        </div>
      </DemoSection>

      <DemoSection title="Usage pattern">
        <pre className="text-xs bg-muted p-3 rounded font-mono overflow-x-auto">{`<View
  name="My Page"
  breadcrumbs={[{ label: 'App' }, { label: 'Page' }]}
  toolbox={<Navigation />}
  ribbon={<Button>Action</Button>}
  contextPanel={<Details />}
  status="42 items"
>
  {/* Page content */}
</View>`}</pre>
      </DemoSection>
    </div>
  )
}

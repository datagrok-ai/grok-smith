import { useCallback, useEffect } from 'react'

import { ShellProvider, useShell } from './shell-context'
import { Breadcrumbs } from './breadcrumbs'
import { ResizeHandle } from './resize-handle'
import { StatusBar } from './status-bar'
import type { ShellProps } from './shell-types'

function ShellInner({ appName, children }: ShellProps) {
  const { panelState, actions, viewSlots } = useShell()

  const hasToolbox = viewSlots?.toolbox != null
  const hasContextPanel = viewSlots?.contextPanel != null
  const showToolbox = hasToolbox && panelState.toolboxVisible
  const showContextPanel = hasContextPanel && panelState.contextPanelVisible

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault()
        actions.toggleToolbox()
      } else if (e.ctrlKey && e.key === 'i') {
        e.preventDefault()
        actions.toggleContextPanel()
      }
    },
    [actions],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="flex h-screen flex-col bg-background font-sans text-foreground">
      {/* Body: toolbox + view area + context panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Toolbox */}
        {showToolbox && (
          <>
            <aside
              className="flex flex-col overflow-hidden border-r border-border bg-muted/30"
              style={{ width: panelState.toolboxWidth }}
            >
              {/* Branding header */}
              <div className="flex h-10 shrink-0 items-center gap-1.5 border-b border-border px-3">
                <span className="text-sm font-semibold text-primary">Datagrok</span>
                <span className="text-sm text-muted-foreground">/ {appName}</span>
              </div>
              {/* Toolbox content */}
              <div className="flex-1 overflow-y-auto">
                {viewSlots?.toolbox}
              </div>
            </aside>
            <ResizeHandle
              side="left"
              currentWidth={panelState.toolboxWidth}
              onResize={actions.setToolboxWidth}
            />
          </>
        )}

        {/* View area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* View header: breadcrumbs + ribbon */}
          {(viewSlots?.breadcrumbs || viewSlots?.ribbon) && (
            <header className="flex h-10 shrink-0 items-center gap-4 border-b border-border px-3">
              {viewSlots?.breadcrumbs && viewSlots.breadcrumbs.length > 0 && (
                <Breadcrumbs items={viewSlots.breadcrumbs} />
              )}
              <div className="flex-1" />
              {viewSlots?.ribbon && (
                <div className="flex items-center gap-2">
                  {viewSlots.ribbon}
                </div>
              )}
            </header>
          )}

          {/* Main content - no padding, views control their own */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>

        {/* Context panel */}
        {showContextPanel && (
          <>
            <ResizeHandle
              side="right"
              currentWidth={panelState.contextPanelWidth}
              onResize={actions.setContextPanelWidth}
            />
            <aside
              className="flex flex-col overflow-hidden border-l border-border bg-muted/20"
              style={{ width: panelState.contextPanelWidth }}
            >
              <div className="flex-1 overflow-y-auto">
                {viewSlots?.contextPanel}
              </div>
            </aside>
          </>
        )}
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  )
}

export function Shell({ appName, children }: ShellProps) {
  return (
    <ShellProvider>
      <ShellInner appName={appName}>{children}</ShellInner>
    </ShellProvider>
  )
}

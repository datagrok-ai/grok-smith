import { useShell } from './shell-context'

export function StatusBar() {
  const { panelState, actions, viewSlots } = useShell()

  return (
    <div className="flex h-6 shrink-0 items-center border-t border-border bg-muted px-2 text-xs text-muted-foreground">
      {/* Left zone: operation status */}
      <div className="flex-1 truncate" />

      {/* Center zone: view status */}
      <div className="flex-1 truncate text-center">
        {viewSlots?.status ?? ''}
      </div>

      {/* Right zone: toggle icons */}
      <div className="flex flex-1 items-center justify-end gap-1">
        {/* Toggle toolbox */}
        <button
          type="button"
          className={`rounded p-0.5 hover:bg-background transition-colors ${panelState.toolboxVisible ? 'text-foreground' : ''}`}
          onClick={actions.toggleToolbox}
          title="Toggle toolbox (Ctrl+B)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="18" rx="1" />
            <rect x="14" y="3" width="7" height="18" rx="1" opacity="0.3" />
          </svg>
        </button>

        {/* Toggle context panel */}
        <button
          type="button"
          className={`rounded p-0.5 hover:bg-background transition-colors ${panelState.contextPanelVisible ? 'text-foreground' : ''}`}
          onClick={actions.toggleContextPanel}
          title="Toggle context panel (Ctrl+I)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="18" rx="1" opacity="0.3" />
            <rect x="14" y="3" width="7" height="18" rx="1" />
          </svg>
        </button>

        {/* Fullscreen */}
        <button
          type="button"
          className="rounded p-0.5 hover:bg-background transition-colors"
          onClick={actions.requestFullscreen}
          title="Fullscreen"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
      </div>
    </div>
  )
}

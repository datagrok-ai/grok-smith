import { createContext, useCallback, useContext, useState } from 'react'

import type { ReactNode } from 'react'

import type { ShellContextValue, ShellPanelState, ViewSlots } from './shell-types'

const TOOLBOX_MIN = 160
const TOOLBOX_MAX = 400
const TOOLBOX_DEFAULT = 240

const CONTEXT_PANEL_MIN = 200
const CONTEXT_PANEL_MAX = 500
const CONTEXT_PANEL_DEFAULT = 300

const ShellContext = createContext<ShellContextValue | null>(null)

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext)
  if (!ctx) throw new Error('useShell must be used within a <Shell>')
  return ctx
}

export function ShellProvider({ children }: { children: ReactNode }) {
  const [panelState, setPanelState] = useState<ShellPanelState>({
    toolboxVisible: true,
    toolboxWidth: TOOLBOX_DEFAULT,
    contextPanelVisible: true,
    contextPanelWidth: CONTEXT_PANEL_DEFAULT,
  })

  const [viewSlots, setViewSlots] = useState<ViewSlots | null>(null)

  const toggleToolbox = useCallback(() => {
    setPanelState((s) => ({ ...s, toolboxVisible: !s.toolboxVisible }))
  }, [])

  const toggleContextPanel = useCallback(() => {
    setPanelState((s) => ({ ...s, contextPanelVisible: !s.contextPanelVisible }))
  }, [])

  const setToolboxWidth = useCallback((width: number) => {
    setPanelState((s) => ({
      ...s,
      toolboxWidth: Math.min(TOOLBOX_MAX, Math.max(TOOLBOX_MIN, width)),
    }))
  }, [])

  const setContextPanelWidth = useCallback((width: number) => {
    setPanelState((s) => ({
      ...s,
      contextPanelWidth: Math.min(CONTEXT_PANEL_MAX, Math.max(CONTEXT_PANEL_MIN, width)),
    }))
  }, [])

  const requestFullscreen = useCallback(() => {
    void document.documentElement.requestFullscreen()
  }, [])

  const registerView = useCallback((slots: ViewSlots) => {
    setViewSlots(slots)
  }, [])

  const unregisterView = useCallback(() => {
    setViewSlots(null)
  }, [])

  const value: ShellContextValue = {
    panelState,
    actions: {
      toggleToolbox,
      toggleContextPanel,
      setToolboxWidth,
      setContextPanelWidth,
      requestFullscreen,
    },
    viewSlots,
    registerView,
    unregisterView,
  }

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
}

import { createContext, useContext } from 'react'

import type { ReactNode } from 'react'
import type { DatagrokContext } from './types'

const DatagrokCtx = createContext<DatagrokContext | null>(null)

export interface DatagrokProviderProps {
  context: DatagrokContext
  children: ReactNode
}

export function DatagrokProvider({ context, children }: DatagrokProviderProps) {
  return <DatagrokCtx.Provider value={context}>{children}</DatagrokCtx.Provider>
}

export function useDatagrok(): DatagrokContext {
  const ctx = useContext(DatagrokCtx)
  if (!ctx) {
    throw new Error('useDatagrok must be used within a <DatagrokProvider>')
  }
  return ctx
}

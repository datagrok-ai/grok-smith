import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DatagrokProvider, createMockAdapter } from '@datagrok/app-kit'

import '@datagrok/app-kit/theme/tokens.css'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import '@datagrok/app-kit/theme/ag-grid-theme.css'
import './index.css'
import { App } from './App'

const context = createMockAdapter()

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <DatagrokProvider context={context}>
      <App />
    </DatagrokProvider>
  </StrictMode>,
)

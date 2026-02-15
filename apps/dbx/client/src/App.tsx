import { BrowserRouter } from 'react-router-dom'

import { Shell } from '@datagrok/app-kit'

import { DbxRoutes } from './routes'

export function App() {
  return (
    <BrowserRouter>
      <Shell appName="DBX">
        <DbxRoutes />
      </Shell>
    </BrowserRouter>
  )
}

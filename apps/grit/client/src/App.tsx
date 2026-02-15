import { BrowserRouter } from 'react-router-dom'

import { Shell } from '@datagrok/app-kit'

import { GritRoutes } from './routes'

export function App() {
  return (
    <BrowserRouter>
      <Shell appName="GRIT">
        <GritRoutes />
      </Shell>
    </BrowserRouter>
  )
}

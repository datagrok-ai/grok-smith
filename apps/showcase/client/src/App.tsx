import { BrowserRouter } from 'react-router-dom'

import { Shell } from '@datagrok/app-kit'

import { ShowcaseRoutes } from './routes'

export function App() {
  return (
    <BrowserRouter>
      <Shell appName="Showcase">
        <ShowcaseRoutes />
      </Shell>
    </BrowserRouter>
  )
}

import { BrowserRouter } from 'react-router-dom'

import { Shell } from '@datagrok/app-kit'

import { SendRoutes } from './routes'

export function App() {
  return (
    <BrowserRouter>
      <Shell appName="SEND">
        <SendRoutes />
      </Shell>
    </BrowserRouter>
  )
}

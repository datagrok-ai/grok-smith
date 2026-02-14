import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { Shell } from '@datagrok/app-kit'

import HomePage from './pages/home'

export function App() {
  return (
    <BrowserRouter>
      <Shell appName="GRIT">
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}

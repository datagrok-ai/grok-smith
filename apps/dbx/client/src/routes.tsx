import { Routes, Route } from 'react-router-dom'

import HomePage from './pages/home'

export function DbxRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}

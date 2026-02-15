import { Routes, Route } from 'react-router-dom'

import HomePage from './pages/home'

export function GritRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}

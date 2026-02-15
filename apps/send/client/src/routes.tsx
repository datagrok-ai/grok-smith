import { Routes, Route } from 'react-router-dom'

import HomePage from './pages/home'
import StudyPage from './pages/study'
import UploadPage from './pages/upload'

export function SendRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/study/:id" element={<StudyPage />} />
      <Route path="/upload" element={<UploadPage />} />
    </Routes>
  )
}

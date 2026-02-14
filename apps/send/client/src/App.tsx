import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { Shell } from '@datagrok/app-kit'

import HomePage from './pages/home'
import StudyPage from './pages/study'
import UploadPage from './pages/upload'

export function App() {
  return (
    <BrowserRouter>
      <Shell appName="SEND">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/study/:id" element={<StudyPage />} />
          <Route path="/upload" element={<UploadPage />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}

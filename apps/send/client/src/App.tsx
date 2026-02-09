import { BrowserRouter, Routes, Route } from 'react-router-dom'

import HomePage from './pages/home'
import UploadPage from './pages/upload'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/upload" element={<UploadPage />} />
      </Routes>
    </BrowserRouter>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Shell, ApiBasePath } from '@datagrok/app-kit'

import { sendApp } from '@datagrok/send/client/app-definition'
import { gritApp } from '@datagrok/grit/client/app-definition'
import { dbxApp } from '@datagrok/dbx/client/app-definition'

import { AppBar } from './components/app-bar'

const apps = [sendApp, gritApp, dbxApp]

export function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen">
        <AppBar apps={apps} />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to={`/${apps[0].id}`} replace />} />
            {apps.map((a) => (
              <Route
                key={a.id}
                path={`/${a.id}/*`}
                element={
                  <ApiBasePath value={`/api/${a.id}`}>
                    <Shell appName={a.name}>
                      <a.routes />
                    </Shell>
                  </ApiBasePath>
                }
              />
            ))}
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

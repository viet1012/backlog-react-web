import { CssBaseline, ThemeProvider } from '@mui/material'
import type { PaletteMode } from '@mui/material/styles'
import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import { DashboardPage } from './pages/DashboardPage'
import { ExportListPage } from './pages/ExportListPage'
import { OdbfPage } from './pages/OdbfPage'
import { SalesStatusPage } from './pages/SalesStatusPage'
import { createDashboardTheme } from './theme/dashboardTheme'
import { ShipmentPage } from './pages/ShipmentPage'
const THEME_STORAGE_KEY = 'backlog-theme-mode'

function App() {
  const [mode, setMode] = useState<PaletteMode>(() => {
    const savedMode = localStorage.getItem(THEME_STORAGE_KEY)
    return savedMode === 'dark' ? 'dark' : 'light'
  })
  const theme = useMemo(() => createDashboardTheme(mode), [mode])

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, mode)
  }, [mode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="/backlog" replace />} />
            <Route
              path="backlog"
              element={
                <DashboardPage
                  mode={mode}
                  onToggleMode={() =>
                    setMode((current) =>
                      current === 'light' ? 'dark' : 'light',
                    )
                  }
                />
              }
            />
            <Route path="odbf" element={<OdbfPage />} />
            <Route path="export-list" element={<ExportListPage />} />
            <Route path="sales-status" element={<SalesStatusPage />} />
            <Route
              path="/shipment"
              element={<ShipmentPage />}
            />
            <Route path="*" element={<Navigate to="/backlog" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App

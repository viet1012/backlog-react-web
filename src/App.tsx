import { CssBaseline, ThemeProvider } from '@mui/material'
import { useMemo, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import { DashboardPage } from './pages/DashboardPage'
import { ExportListPage } from './pages/ExportListPage'
import { OdbfPage } from './pages/OdbfPage'
import { SalesStatusPage } from './pages/SalesStatusPage'
import { createDashboardTheme } from './theme/dashboardTheme'
import { ShipmentPage } from './pages/ShipmentPage'

type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'themeMode'
const DEFAULT_THEME_MODE: ThemeMode = 'light'

function getInitialThemeMode(): ThemeMode {
  try {
    const storedMode = localStorage.getItem(THEME_STORAGE_KEY)

    if (storedMode === 'light' || storedMode === 'dark') {
      return storedMode
    }
  } catch {
    // Keep the application's default when storage is unavailable.
  }

  return DEFAULT_THEME_MODE
}

function App() {
  const [mode, setMode] = useState<ThemeMode>(getInitialThemeMode)
  const theme = useMemo(() => createDashboardTheme(mode), [mode])

  function toggleThemeMode() {
    const nextMode: ThemeMode = mode === 'light' ? 'dark' : 'light'

    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextMode)
    } catch {
      // Theme switching should still work when storage is unavailable.
    }

    setMode(nextMode)
  }

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
                  onToggleMode={toggleThemeMode}
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

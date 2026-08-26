import {
  CssBaseline,
  ThemeProvider,
} from '@mui/material'

import {
  useMemo,
  useState,
} from 'react'

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import { MainLayout } from './components/layout/MainLayout'

import { BacklogPage } from './pages/BacklogPage'
import { ExportListPage } from './pages/ExportListPage'
import { OdbfPage } from './pages/OdbfPage'
import { SalesStatusPage } from './pages/SalesStatusPage'
import { ShipmentPage } from './pages/ShipmentPage'

import {
  createDashboardTheme,
} from './theme/dashboardTheme'


type ThemeMode =
  | 'light'
  | 'dark'


const THEME_STORAGE_KEY =
  'themeMode'

const DEFAULT_THEME_MODE:
  ThemeMode =
  'light'


function getInitialThemeMode():
  ThemeMode {

  try {

    const storedMode =
      localStorage.getItem(
        THEME_STORAGE_KEY,
      )

    if (
      storedMode === 'light'
      || storedMode === 'dark'
    ) {
      return storedMode
    }

  } catch {
    // ignore
  }

  return DEFAULT_THEME_MODE
}


function App() {

  const [mode, setMode] =
    useState<ThemeMode>(
      getInitialThemeMode,
    )

  const theme =
    useMemo(
      () =>
        createDashboardTheme(
          mode,
        ),
      [mode],
    )


  function toggleThemeMode() {

    const nextMode:
      ThemeMode =
      mode === 'light'
        ? 'dark'
        : 'light'

    try {

      localStorage.setItem(
        THEME_STORAGE_KEY,
        nextMode,
      )

    } catch {
      // ignore
    }

    setMode(nextMode)
  }


  return (
    <ThemeProvider theme={theme}>

      <CssBaseline />

      <BrowserRouter>

        <Routes>

          <Route
            element={<MainLayout />}
          >

            {/* =========================
                DEFAULT
            ========================= */}

            <Route
              index
              element={
                <Navigate
                  to="/backlog"
                  replace
                />
              }
            />


            {/* =========================
                PLANNING
            ========================= */}

            <Route
              path="backlog"
              element={
                <BacklogPage
                  mode={mode}
                  onToggleMode={
                    toggleThemeMode
                  }
                />
              }
            />

            <Route
              path="odbf"
              element={<OdbfPage />}
            />

            <Route
              path="export-list"
              element={<ExportListPage />}
            />

            <Route
              path="sales-status"
              element={<SalesStatusPage />}
            />


            {/* =========================
                SHIPPING SCHEDULE
            ========================= */}

            <Route
              path="shipping-schedule"
              element={<ShipmentPage />}
            />


            {/* =========================
                FALLBACK
            ========================= */}

            <Route
              path="*"
              element={
                <Navigate
                  to="/backlog"
                  replace
                />
              }
            />

          </Route>

        </Routes>

      </BrowserRouter>

    </ThemeProvider>
  )
}


export default App
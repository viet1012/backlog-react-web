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
import { AsakaiPage } from './pages/AsakaiPage'
import { BosbPage } from './pages/BosbPage'
import { CostMonitoringPage } from './pages/CostMonitoringPage'
import { DeadstockPage } from './pages/DeadstockPage'
import { ExportListPage } from './pages/ExportListPage'
import { FacConfirmPage } from './pages/FacConfirmPage'
import { KpiPage } from './pages/KpiPage'
import { OdbfPage } from './pages/OdbfPage'
import { OtPage } from './pages/OtPage'
import { PackingListPage } from './pages/PackingListPage'
import { PlPage } from './pages/PlPage'
import { SalesStatusPage } from './pages/SalesStatusPage'
import { ShipmentPage } from './pages/ShipmentPage'
import { SphPage } from './pages/SphPage'
import { PcTrainingPage } from './pages/training/PcTrainingPage'

import {
  createDashboardTheme,
} from './theme/dashboardTheme'
import {
  loadThemeMode,
  saveThemeMode,
  type ThemeMode,
} from './utils/uiPreferences'

const DEFAULT_THEME_MODE:
  ThemeMode =
  'light'


function App() {

  const [mode, setMode] =
    useState<ThemeMode>(
      () => loadThemeMode(DEFAULT_THEME_MODE),
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

    saveThemeMode(nextMode)
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
                PRODUCTION
            ========================= */}

            <Route path="sph" element={<SphPage />} />
            <Route path="asakai" element={<AsakaiPage />} />
            <Route path="cost-monitoring" element={<CostMonitoringPage />} />
            <Route path="pc-training" element={<PcTrainingPage />} />


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

            <Route path="fac-confirm" element={<FacConfirmPage />} />

            <Route
              path="export-list"
              element={<ExportListPage />}
            />

            <Route path="packing-list" element={<PackingListPage />} />

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
                MANAGEMENT
            ========================= */}

            <Route path="bosb" element={<BosbPage />} />
            <Route path="deadstock" element={<DeadstockPage />} />
            <Route path="pl" element={<PlPage />} />
            <Route path="kpi" element={<KpiPage />} />
            <Route path="ot" element={<OtPage />} />


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

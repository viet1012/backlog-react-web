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
  useLocation,
} from 'react-router-dom'

import { MainLayout } from './components/layout/MainLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { RoleRoute } from './components/auth/RoleRoute'

import { BacklogPage } from './pages/BacklogPage'
import { AsakaiPage } from './pages/AsakaiPage'
import { BosbPage } from './pages/BosbPage'
import { CostMonitoringPage } from './pages/CostMonitoringPage'
import { DeadstockPage } from './pages/DeadstockPage'
import { ExportListPage } from './pages/ExportListPage'
import { FacConfirmPage } from './pages/FacConfirmPage'
import { KpiPage } from './pages/KpiPage'
import { LoginPage } from './pages/LoginPage'
import { MachineLocatorPage } from './pages/MachineLocatorPage'
import { MachineMonitorPage } from './pages/MachineMonitorPage'
import { UserHomePage } from './pages/UserHomePage'
import { OdbfPage } from './pages/OdbfPage'
import { OtPage } from './pages/OtPage'
import { PackingListPage } from './pages/PackingListPage'
import { PlPage } from './pages/PlPage'
import { RemainPoControlPage } from './pages/RemainPoControlPage'
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

import {
  LocalizationProvider,
} from '@mui/x-date-pickers/LocalizationProvider'

import {
  AdapterDayjs,
} from '@mui/x-date-pickers/AdapterDayjs'
import { getDefaultAuthRoute } from './services/authService'

const DEFAULT_THEME_MODE:
  ThemeMode =
  'light'


function MachineLocatorRedirect() {
  const { hash } = useLocation()

  return (
    <Navigate
      to={{ pathname: '/settings/machine-locator', hash }}
      replace
    />
  )
}


function MachineMonitorRedirect() {
  const { search, hash } = useLocation()

  return (
    <Navigate
      to={{ pathname: '/monitoring/machine', search, hash }}
      replace
    />
  )
}


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

      <LocalizationProvider
        dateAdapter={AdapterDayjs}
      >

        <CssBaseline />

        <BrowserRouter>

          <Routes>

            <Route
              path="login"
              element={<LoginPage />}
            />

            <Route element={<ProtectedRoute />}>

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
                      to={getDefaultAuthRoute()}
                      replace
                    />
                  }
                />

                {/* =========================
                PRODUCTION
            ========================= */}

                <Route
                  path="sph"
                  element={<SphPage />}
                />

                <Route
                  path="asakai"
                  element={<AsakaiPage />}
                />

                <Route
                  path="cost-monitoring"
                  element={<CostMonitoringPage />}
                />

                <Route
                  path="pc-training"
                  element={
                    <PcTrainingPage
                      mode={mode}
                      onToggleMode={toggleThemeMode}
                    />
                  }
                />

                {/* =========================
                PLANNING
            ========================= */}

                <Route element={<RoleRoute roles={['PC']} />}>
                  <Route path="backlog" element={<BacklogPage mode={mode} onToggleMode={toggleThemeMode} />} />
                  <Route path="remain-po-control" element={<RemainPoControlPage mode={mode} />} />
                  <Route path="export-list" element={<ExportListPage />} />
                </Route>

                <Route element={<RoleRoute roles={['PC', 'PRO']} />}>
                  <Route path="fac-confirm" element={<FacConfirmPage mode={mode} onToggleMode={toggleThemeMode} />} />
                  <Route path="packing-list" element={<PackingListPage />} />
                </Route>

                <Route element={<RoleRoute roles={['PC', 'PRO']} />}>
                  <Route path="odbf" element={<OdbfPage mode={mode} onToggleMode={toggleThemeMode} />} />
                  <Route path="shipping-schedule" element={<ShipmentPage mode={mode} onToggleMode={toggleThemeMode} />} />
                </Route>

                <Route
                  path="user-home"
                  element={
                    <RoleRoute roles={['USER']} />
                  }
                >
                  <Route index element={<UserHomePage mode={mode} onToggleMode={toggleThemeMode} />} />
                </Route>

                <Route
                  path="sales-status"
                  element={<SalesStatusPage />}
                />

                {/* =========================
                SHIPPING SCHEDULE
            ========================= */}

                {/* =========================
                MANAGEMENT
            ========================= */}

                <Route
                  path="bosb"
                  element={<BosbPage />}
                />

                <Route
                  path="deadstock"
                  element={<DeadstockPage />}
                />

                <Route
                  path="pl"
                  element={<PlPage />}
                />

                <Route
                  path="kpi"
                  element={<KpiPage />}
                />

                <Route
                  path="ot"
                  element={<OtPage />}
                />

                {/* =========================
                MONITORING
            ========================= */}

                <Route
                  path="monitoring/machine"
                  element={
                    <MachineMonitorPage
                      mode={mode}
                      onToggleMode={toggleThemeMode}
                    />
                  }
                />

                {/* route cũ, giữ để link đã chia sẻ (kèm ?tab=&layout=) vẫn mở được */}
                <Route
                  path="machine-monitor"
                  element={<MachineMonitorRedirect />}
                />

                {/* =========================
                SETTING
            ========================= */}

                <Route
                  path="settings/machine-locator"
                  element={
                    <MachineLocatorPage
                      mode={mode}
                      onToggleMode={toggleThemeMode}
                    />
                  }
                />

                {/* route cũ, giữ để link đã chia sẻ (kèm #mã máy) vẫn mở được */}
                <Route
                  path="machine-locator"
                  element={<MachineLocatorRedirect />}
                />

                {/* =========================
                FALLBACK
            ========================= */}

                <Route
                  path="*"
                  element={
                    <Navigate
                      to={getDefaultAuthRoute()}
                      replace
                    />
                  }
                />

              </Route>

            </Route>

          </Routes>

        </BrowserRouter>

      </LocalizationProvider>

    </ThemeProvider>
  )
}


export default App

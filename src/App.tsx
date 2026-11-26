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
import { AuthProvider } from './components/auth/AuthProvider'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PermRoute } from './components/auth/PermRoute'
import { ClockInOverlay } from './components/shift/ClockInOverlay'
import { NotifyHost } from './components/common/notify'

import { LoginPage } from './pages/auth/LoginPage'
import { appPages } from './routes/appPages'

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
import { useI18n } from './i18n/useI18n'

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


function AdminRedirect() {
  const { search, hash } = useLocation()

  return (
    <Navigate
      to={{ pathname: '/settings/admin', search, hash }}
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

  const { language } = useI18n()

  const theme =
    useMemo(
      () =>
        createDashboardTheme(
          mode,
          language,
        ),
      [mode, language],
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

  const pageContext = { mode, onToggleMode: toggleThemeMode }


  return (
    <ThemeProvider theme={theme}>

      <LocalizationProvider
        dateAdapter={AdapterDayjs}
        adapterLocale={language}
      >

        {/* color-scheme theo theme: ở chế độ tối, control gốc của trình duyệt
            (lịch của input date, thanh cuộn, dropdown, ô autofill) cũng tối.
            Chế độ sáng = mặc định của trình duyệt, không đổi gì. */}
        <CssBaseline enableColorScheme />

        <ClockInOverlay />

        {/* Toasts from notify.* (save / import / export feedback on every page) */}
        <NotifyHost />

        {/* Có token: gọi /me lấy quyền, trong lúc chờ chưa render route */}
        <AuthProvider>

          <BrowserRouter>

            <Routes>

              <Route
                path="login"
                element={<LoginPage />}
              />

              <Route element={<ProtectedRoute />}>

                <Route
                  element={<MainLayout onToggleMode={toggleThemeMode} />}
                >

                  <Route
                    index
                    element={
                      <Navigate
                        to={getDefaultAuthRoute()}
                        replace
                      />
                    }
                  />

                  {/* Route + quyền xem sinh từ routes/appPages.tsx (cùng nguồn với sidebar) */}
                  {appPages
                    .filter((page) => page.element)
                    .map((page) => (
                      <Route
                        key={page.path}
                        element={<PermRoute perm={page.perm} />}
                      >
                        <Route
                          path={page.path.replace(/^\//, '')}
                          element={page.element!(pageContext)}
                        />
                      </Route>
                    ))}

                  {/* route cũ, giữ để link đã chia sẻ (kèm ?tab=&layout=) vẫn mở được */}
                  <Route
                    path="machine-monitor"
                    element={<MachineMonitorRedirect />}
                  />

                  {/* route cũ của trang Admin, giữ để link đã chia sẻ (kèm bộ lọc ?from=&to=…) vẫn mở được */}
                  <Route
                    path="settings/ai-logs"
                    element={<AdminRedirect />}
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

        </AuthProvider>

      </LocalizationProvider>

    </ThemeProvider>
  )
}


export default App

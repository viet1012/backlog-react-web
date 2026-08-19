import { CssBaseline, ThemeProvider } from '@mui/material'
import type { PaletteMode } from '@mui/material/styles'
import { useEffect, useMemo, useState } from 'react'
import { DashboardPage } from './pages/DashboardPage'
import { createDashboardTheme } from './theme/dashboardTheme'

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
      <DashboardPage
        mode={mode}
        onToggleMode={() => setMode((current) => (current === 'light' ? 'dark' : 'light'))}
      />
    </ThemeProvider>
  )
}

export default App

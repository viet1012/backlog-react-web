import { Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Outlet } from 'react-router-dom'
import { LeftSidebar } from './LeftSidebar'

export function MainLayout() {
  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: 'background.default',
        backgroundImage: `
          radial-gradient(circle at 12% 8%, ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.09)} 0, transparent 32%),
          radial-gradient(circle at 88% 92%, ${alpha(theme.palette.info.main, theme.palette.mode === 'dark' ? 0.08 : 0.06)} 0, transparent 30%),
          linear-gradient(145deg, ${alpha(theme.palette.background.default, 0.98)}, ${alpha(theme.palette.background.paper, 0.72)})
        `,
        backgroundAttachment: 'fixed',
      })}
    >
      <LeftSidebar />
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

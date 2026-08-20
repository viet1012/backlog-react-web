import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'
import { LeftSidebar } from './LeftSidebar'

export function MainLayout() {
  return (
    <Box
      sx={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
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

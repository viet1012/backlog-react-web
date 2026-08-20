import { Box } from '@mui/material'
import type { ReactNode } from 'react'
import { uiTokens } from '../../theme/uiTokens'

interface PageShellProps {
  children: ReactNode
}

export function PageShell({ children }: PageShellProps) {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
        p: uiTokens.page.padding,
        gap: uiTokens.page.gap,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {children}
    </Box>
  )
}

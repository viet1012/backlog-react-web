import { Paper, type SxProps, type Theme } from '@mui/material'
import type { ReactNode } from 'react'
import { glassPanelSx, uiTokens } from '../../theme/uiTokens'

interface GlassPanelProps {
  children: ReactNode
  sx?: SxProps<Theme>
}

export function GlassPanel({ children, sx }: GlassPanelProps) {
  const additionalSx = Array.isArray(sx) ? sx : sx ? [sx] : []

  return (
    <Paper
      elevation={0}
      sx={[
        (theme) => ({
          ...glassPanelSx(theme),
          borderRadius: uiTokens.card.borderRadius,
        }),
        ...additionalSx,
      ]}
    >
      {children}
    </Paper>
  )
}

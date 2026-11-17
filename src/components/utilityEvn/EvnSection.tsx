import { Box, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { uiTokens } from '../../theme/uiTokens'

// Khung thẻ giống các màn ODBF / AI Logs
export function EvnSection({
  title,
  extra,
  children,
}: {
  title: string
  extra?: ReactNode
  children: ReactNode
}) {
  return (
    <Box
      component="section"
      aria-label={title}
      sx={(theme) => ({
        px: 1.5,
        pt: 1,
        pb: 1.25,
        minWidth: 0,
        flexShrink: 0,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: uiTokens.card.borderRadius,
        bgcolor: 'background.paper',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 2px 8px rgba(0,0,0,0.12)'
          : '0 2px 8px rgba(15,23,42,0.04)',
      })}
    >
      <Stack
        direction="row"
        sx={{ alignItems: 'center', flexWrap: 'wrap', columnGap: 1.5, rowGap: 0.25, mb: 0.75 }}
      >
        <Typography component="h2" sx={{ fontSize: 13, fontWeight: 800, mr: 1 }}>
          {title}
        </Typography>
        {extra}
      </Stack>

      {children}
    </Box>
  )
}

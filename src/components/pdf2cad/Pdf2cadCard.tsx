import { Box, Stack, Typography } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import type { ReactNode } from 'react'
import { uiTokens } from '../../theme/uiTokens'

/** Khung thẻ dùng chung của màn PDF → CAD (giống EvnSection) */
export function Pdf2cadCard({
  title,
  extra,
  children,
  sx,
}: {
  title?: string
  extra?: ReactNode
  children: ReactNode
  sx?: SxProps<Theme>
}) {
  return (
    <Box
      component="section"
      aria-label={title}
      sx={[
        (theme) => ({
          px: 1.5,
          pt: title ? 1 : 1.25,
          pb: 1.25,
          minWidth: 0,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: uiTokens.card.borderRadius,
          bgcolor: 'background.paper',
          boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.12)' : '0 2px 8px rgba(15,23,42,0.04)',
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {(title || extra) && (
        <Stack direction="row" sx={{ alignItems: 'center', columnGap: 1, mb: 0.75, minHeight: 24 }}>
          {title && (
            <Typography component="h2" sx={{ fontSize: 13, fontWeight: 800 }}>
              {title}
            </Typography>
          )}
          {extra && <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>{extra}</Box>}
        </Stack>
      )}
      {children}
    </Box>
  )
}

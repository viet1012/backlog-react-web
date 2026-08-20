import { Box, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { uiTokens } from '../../theme/uiTokens'

interface PageHeaderProps {
  title: string
  subtitle?: string
  status?: ReactNode
  actions?: ReactNode
  bottom?: ReactNode
  mono?: boolean
}

export function PageHeader({
  title,
  subtitle,
  status,
  actions,
  bottom,
  mono = false,
}: PageHeaderProps) {
  const fontFamily = mono ? 'monospace' : 'inherit'

  return (
    <Box
      component="header"
      sx={(theme) => ({
        px: uiTokens.header.px,
        py: uiTokens.header.py,
        flexShrink: 0,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: uiTokens.card.borderRadius,
        bgcolor:
          theme.palette.mode === 'dark'
            ? 'rgba(15,23,42,0.68)'
            : 'rgba(255,255,255,0.76)',
        backdropFilter: 'blur(14px)',
      })}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h1"
            sx={{
              fontFamily,
              fontSize: uiTokens.header.titleFontSize,
              fontWeight: mono ? 900 : 700,
              letterSpacing: mono ? 0.5 : 0,
              lineHeight: 1.25,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              color="text.secondary"
              sx={{
                mt: 0.25,
                fontFamily,
                fontSize: uiTokens.header.subtitleFontSize,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {(status || actions) && (
          <Stack
            direction="row"
            spacing={1.25}
            sx={{ alignItems: 'center', flexShrink: 0 }}
          >
            {status}
            {actions}
          </Stack>
        )}
      </Stack>

      {bottom && <Box sx={{ mt: uiTokens.page.gap }}>{bottom}</Box>}
    </Box>
  )
}

import {
  Box,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

import type { ReactNode } from 'react'
import { glassPanelSx, uiTokens } from '../../theme/uiTokens'

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
  const fontFamily =
    mono ? 'monospace' : 'inherit'

  return (
    <Box
      component="header"
      sx={(theme) => {
        const brandBlue = theme.palette.primary.main
        const brandCyan = '#38bdf8'
        const isDark = theme.palette.mode === 'dark'

        return {
          ...glassPanelSx(theme),
          position: 'relative',

          px: uiTokens.header.px,
          py: uiTokens.header.py,

          flexShrink: 0,

          borderRadius: uiTokens.header.borderRadius,

          overflow: 'hidden',

          backgroundImage: [
            `linear-gradient(100deg, ${alpha(
              brandBlue,
              isDark ? 0.10 : 0.065,
            )} 0%, ${alpha(brandCyan, isDark ? 0.035 : 0.025)} 24%, transparent 48%)`,
            `radial-gradient(circle at 88% 0%, ${alpha(
              brandCyan,
              isDark ? 0.08 : 0.055,
            )} 0%, transparent 38%)`,
          ].join(', '),

          '&::before': {
            content: '""',
            position: 'absolute',
            zIndex: 1,
            left: 7,
            top: 8,
            bottom: 8,
            width: 3,
            borderRadius: 999,
            background: `linear-gradient(180deg, ${brandCyan} 0%, ${brandBlue} 72%)`,
            boxShadow: `0 0 10px ${alpha(brandBlue, isDark ? 0.38 : 0.20)}`,
          },

          '&::after': {
            content: '""',
            position: 'absolute',
            zIndex: 0,
            top: -62,
            right: -32,
            width: 150,
            height: 150,
            borderRadius: '50%',
            pointerEvents: 'none',
            background: `radial-gradient(circle, ${alpha(
              brandBlue,
              isDark ? 0.10 : 0.065,
            )} 0%, ${alpha(brandCyan, isDark ? 0.035 : 0.025)} 42%, transparent 70%)`,
          },
        }
      }}
    >
      <Stack
        direction="row"
        sx={{
          position: 'relative',
          zIndex: 1,

          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: 1, sm: 2 },
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            minWidth: 0,
            flex: 1,

            pl: 1,
          }}
        >
          <Typography
            component="h1"
            noWrap
            sx={{
              fontFamily,

              fontSize: uiTokens.header.titleFontSize,

              fontWeight:
                mono ? 900 : 800,

              letterSpacing:
                mono ? 0.4 : '-0.01em',

              lineHeight: 1.1,

              textShadow: (theme) => theme.palette.mode === 'dark'
                ? `0 1px 12px ${alpha(theme.palette.common.black, 0.22)}`
                : 'none',

              color:
                'text.primary',
            }}
          >
            {title}
          </Typography>

          {subtitle && (
            <Typography
              noWrap
              sx={{
                mt: 0.4,

                fontFamily,

                fontSize: uiTokens.header.subtitleFontSize,

                fontWeight: 400,

                lineHeight: 1.25,

                color:
                  'text.secondary',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {(status || actions) && (
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              flexShrink: 0,
              minWidth: 0,
              gap: { xs: 0.5, sm: 1 },
              maxWidth: { xs: '52%', sm: 'none' },
              overflowX: 'auto',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
            }}
          >
            {status}
            {actions}
          </Stack>
        )}
      </Stack>

      {bottom && (
        <Box
          sx={(theme) => ({
            position: 'relative',
            zIndex: 1,
            mt: 1,
            pt: 1,

            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: `linear-gradient(90deg, ${alpha(
                theme.palette.primary.main,
                theme.palette.mode === 'dark' ? 0.28 : 0.18,
              )}, ${alpha(theme.palette.divider, 0.72)} 36%, transparent 100%)`,
            },
          })}
        >
          {bottom}
        </Box>
      )}
    </Box>
  )
}

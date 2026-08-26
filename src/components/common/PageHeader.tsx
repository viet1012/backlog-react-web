import {
  Box,
  Stack,
  Typography,
} from '@mui/material'

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
        return {
          ...glassPanelSx(theme),
          position: 'relative',

          px: uiTokens.header.px,
          py: uiTokens.header.py,

          flexShrink: 0,

          // QUAN TRỌNG
          borderRadius: uiTokens.header.borderRadius,

          overflow: 'hidden',

          // thanh accent vuông
          '&::before': {
            content: '""',

            position: 'absolute',

            left: 0,
            top: 0,
            bottom: 0,

            width: 4,

            bgcolor:
              'primary.main',
          },
        }
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{
          position: 'relative',
          zIndex: 1,

          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box
          sx={{
            minWidth: 0,
            flex: 1,

            pl: 0.25,
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
            spacing={1}
            sx={{
              alignItems: 'center',
              flexShrink: 0,
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
            mt: 1,
            pt: 1,

            borderTop:
              `1px solid ${theme.palette.divider}`,
          })}
        >
          {bottom}
        </Box>
      )}
    </Box>
  )
}

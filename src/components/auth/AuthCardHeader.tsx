import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'

import logo from '../../assets/logo.png'
import { v } from './loginStyles'

interface AuthCardHeaderProps {
  title: string
  subtitle: string
  hint?: ReactNode
}

export function AuthCardHeader({ title, subtitle, hint }: AuthCardHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
        <Box
          sx={{
            flexShrink: 0,
            width: 50,
            height: 50,
            display: 'grid',
            placeItems: 'center',
            boxSizing: 'border-box',
            borderRadius: '12px',
            background: v('iconBoxBg'),
            border: '1px solid',
            borderColor: v('iconBoxBorder'),
            boxShadow: v('iconBoxShadow'),
          }}
        >
          <Box
            component="img"
            src={logo}
            alt="Production Control"
            sx={{ width: 44, height: 44, objectFit: 'contain', display: 'block', imageRendering: 'auto' }}
          />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: 22, sm: 24 },
              fontWeight: 800,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
              color: v('title'),
              opacity: 1,
              textShadow: v('titleShadow'),
            }}
          >
            {title}
          </Typography>
          <Typography sx={{ mt: 0.4, color: v('subtitle'), fontSize: 13, fontWeight: 500 }}>
            {subtitle}
          </Typography>
        </Box>
      </Box>

      {hint && (
        <Typography
          sx={{
            mt: 2,
            px: 1.5,
            py: 1,
            fontSize: 12.5,
            lineHeight: 1.5,
            color: v('headerHint'),
            borderRadius: '10px',
            bgcolor: v('headerHintBg'),
            border: '1px solid',
            borderColor: v('headerHintBorder'),
          }}
        >
          {hint}
        </Typography>
      )}
    </Box>
  )
}

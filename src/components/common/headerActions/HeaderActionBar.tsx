import type { ReactNode } from 'react'

import { Box } from '@mui/material'

interface HeaderActionBarProps {
  children: ReactNode
  /** Extra class (e.g. "cost-no-print" to hide the bar when printing) */
  className?: string
}

/**
 * Row of header controls with the standard spacing. Split groups with
 * <HeaderActionDivider /> following the order in headerActionRegistry:
 * data controls | data in/out | refresh, guide.
 */
export function HeaderActionBar({ children, className }: HeaderActionBarProps) {
  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        flexShrink: 0,
      }}
    >
      {children}
    </Box>
  )
}

/** Thin vertical rule between action groups */
export function HeaderActionDivider() {
  return (
    <Box
      aria-hidden
      sx={{
        width: '1px',
        height: 20,
        mx: 0.5,
        flexShrink: 0,
        bgcolor: 'divider',
      }}
    />
  )
}

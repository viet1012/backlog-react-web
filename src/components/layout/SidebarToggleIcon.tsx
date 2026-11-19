import { Box } from '@mui/material'

interface SidebarToggleIconProps {
  /** Sidebar currently expanded (the icon then offers to collapse). */
  open: boolean
  size?: number
}

/**
 * "Side panel" glyph: a rounded frame whose left pane is the sidebar.
 * Hovering the parent (.sidebar-toggle) previews the action – the pane
 * shrinks when it would collapse and grows when it would expand.
 */
export function SidebarToggleIcon({ open, size = 18 }: SidebarToggleIconProps) {
  return (
    <Box
      component="svg"
      viewBox="0 0 20 20"
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        display: 'block',
        overflow: 'visible',

        '& .frame': {
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6,
        },

        // Left pane: scaled from its left edge
        '& .pane': {
          fill: 'currentColor',
          opacity: 0.28,
          transformBox: 'fill-box',
          transformOrigin: 'left center',
          transform: open ? 'scaleX(1)' : 'scaleX(0.45)',
          transition: 'transform 220ms cubic-bezier(0.2, 0, 0, 1), opacity 160ms ease',
        },
        '& .divider': {
          stroke: 'currentColor',
          strokeWidth: 1.6,
          transform: open ? 'translateX(0)' : 'translateX(-2.2px)',
          transition: 'transform 220ms cubic-bezier(0.2, 0, 0, 1)',
        },

        '.sidebar-toggle:hover &, .sidebar-toggle.Mui-focusVisible &': {
          '& .pane': {
            opacity: 0.5,
            transform: open ? 'scaleX(0.45)' : 'scaleX(1)',
          },
          '& .divider': {
            transform: open ? 'translateX(-2.2px)' : 'translateX(0)',
          },
        },

        '@media (prefers-reduced-motion: reduce)': {
          '& .pane, & .divider': { transition: 'none' },
        },
      }}
    >
      <rect className="pane" x="3.6" y="4.4" width="4" height="11.2" rx="1" />
      <line className="divider" x1="8.4" y1="3.6" x2="8.4" y2="16.4" />
      <rect className="frame" x="2.3" y="3.1" width="15.4" height="13.8" rx="3.2" />
    </Box>
  )
}

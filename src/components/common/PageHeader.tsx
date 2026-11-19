import {
  Box,
  Stack,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useLocation } from 'react-router-dom'

import type { ReactNode } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { glassPanelSx, uiTokens } from '../../theme/uiTokens'
import {
  getGroupColor,
  menuGroups,
  type MenuGroupId,
  type MenuItemConfig,
} from '../layout/sidebarConfig'

// Screen only: printing (A4 landscape) keeps the two-row layout
const INLINE_MEDIA = '@media screen and (min-width: 1600px)'

interface PageHeaderProps {
  /** Sentence case ("Theo dõi chi phí"), not ALL CAPS: the header styles it. */
  title: string
  subtitle?: string
  status?: ReactNode
  actions?: ReactNode
  bottom?: ReactNode
  /**
   * Wide screens (≥ 1600px): put `bottom` on the title row (between title and
   * actions) instead of a second row. Use for short single-line content such as a legend.
   */
  bottomInline?: boolean

  /** @deprecated no longer used – every header shares one type style */
  mono?: boolean
  /**
   * @deprecated Language / theme switches moved to the sidebar settings menu.
   * Still accepted so existing pages compile; ignored.
   */
  mode?: 'light' | 'dark'
  /** @deprecated see `mode` */
  onToggleMode?: () => void
}

interface RouteMeta {
  groupId: MenuGroupId
  item: MenuItemConfig
}

// Page identity comes from the sidebar menu, so the header icon / group /
// color always match what the user clicked – no per-page setup.
function findRouteMeta(pathname: string): RouteMeta | undefined {
  for (const group of menuGroups) {
    for (const item of group.items) {
      if (pathname === item.path || pathname.startsWith(`${item.path}/`)) {
        return { groupId: group.id, item }
      }
    }
  }
  return undefined
}

export function PageHeader({
  title,
  subtitle,
  status,
  actions,
  bottom,
  bottomInline = false,
}: PageHeaderProps) {
  const theme = useTheme()
  const { t } = useI18n()
  const { pathname } = useLocation()

  const meta = findRouteMeta(pathname)
  const accent = meta
    ? getGroupColor(meta.groupId, theme.palette.mode)
    : theme.palette.primary.main
  const dark = theme.palette.mode === 'dark'

  return (
    <Box
      component="header"
      sx={{
        ...glassPanelSx(theme),
        position: 'relative',
        flexShrink: 0,
        overflow: 'hidden',

        px: uiTokens.header.px,
        py: uiTokens.header.py,
        borderRadius: uiTokens.header.borderRadius,

        // One quiet wash in the page's group color, fading out by ~40%
        backgroundImage: `linear-gradient(100deg, ${alpha(accent, dark ? 0.12 : 0.07)} 0%, transparent 42%)`,
      }}
    >
      {/* Grid: title | actions, bottom on its own row.
          bottomInline + wide screen: title | bottom | actions on one row. */}
      <Box
        sx={{
          display: 'grid',
          alignItems: 'center',
          minWidth: 0,
          minHeight: uiTokens.header.rowHeight,

          columnGap: 2,

          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gridTemplateAreas: bottom
            ? '"title actions" "bottom bottom"'
            : '"title actions"',

          ...(bottom && bottomInline && {
            [INLINE_MEDIA]: {
              gridTemplateColumns: 'auto minmax(0, 1fr) auto',
              gridTemplateAreas: '"title bottom actions"',
            },
          }),
        }}
      >
        {/* ===== IDENTITY: icon tile + title + group · subtitle ===== */}
        <Box
          sx={{
            gridArea: 'title',
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
          }}
        >
          {meta && (
            <Box
              aria-hidden
              sx={{
                width: 36,
                height: 36,
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                borderRadius: '10px',
                color: accent,
                bgcolor: alpha(accent, dark ? 0.16 : 0.1),
                border: `1px solid ${alpha(accent, dark ? 0.32 : 0.22)}`,
                boxShadow: `inset 0 1px 0 ${alpha('#ffffff', dark ? 0.06 : 0.7)}`,
                '& svg': { fontSize: 20 },
              }}
            >
              {meta.item.icon}
            </Box>
          )}

          <Box sx={{ minWidth: 0 }}>
            <Typography
              component="h1"
              noWrap
              sx={{
                fontSize: uiTokens.header.titleFontSize,
                fontWeight: 700,
                letterSpacing: '-0.018em',
                lineHeight: 1.2,
                color: 'text.primary',
              }}
            >
              {title}
            </Typography>

            {(meta || subtitle) && (
              <Typography
                noWrap
                sx={{
                  mt: 0.25,
                  fontSize: uiTokens.header.subtitleFontSize,
                  lineHeight: 1.3,
                  color: 'text.secondary',
                }}
              >
                {meta && (
                  <Box
                    component="span"
                    sx={{
                      color: accent,
                      fontSize: uiTokens.header.eyebrowFontSize,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {t.nav.groups[meta.groupId]}
                  </Box>
                )}
                {meta && subtitle && (
                  <Box component="span" aria-hidden sx={{ mx: 0.75, color: 'text.disabled' }}>
                    ·
                  </Box>
                )}
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {/* ===== STATUS + ACTIONS ===== */}
        <Stack
          direction="row"
          sx={{
            gridArea: 'actions',
            justifySelf: 'end',
            alignItems: 'center',
            flexShrink: 0,
            minWidth: 0,
            gap: 1,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {status}
          {actions}
        </Stack>

        {/* ===== BOTTOM (tabs, legend, filters) ===== */}
        {bottom && (
          <Box
            sx={{
              gridArea: 'bottom',
              minWidth: 0,
              mt: 0.75,
              pt: 0.75,
              borderTop: `1px solid ${theme.palette.divider}`,

              ...(bottomInline && {
                [INLINE_MEDIA]: {
                  mt: 0,
                  pt: 0,
                  pl: 1.5,
                  borderTop: 0,
                  borderLeft: `1px solid ${theme.palette.divider}`,
                },
              }),
            }}
          >
            {bottom}
          </Box>
        )}
      </Box>
    </Box>
  )
}

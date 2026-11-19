import { useState } from 'react'

import {
  Box,
  IconButton,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import type { PaletteMode, Theme } from '@mui/material/styles'
import type { SystemStyleObject } from '@mui/system'
import {
  DarkModeRounded,
  LightModeRounded,
  SettingsRounded,
  TranslateRounded,
} from '@mui/icons-material'

import { useI18n } from '../../i18n/useI18n'
import { LanguageToggleButton } from '../common/LanguageToggleButton'
import { ThemeToggleButton } from '../common/ThemeToggleButton'

interface SidebarSettingsMenuProps {
  mode: PaletteMode
  onToggleMode: () => void
  /** Sidebar collapsed: open to the right instead of above. */
  collapsed: boolean
  buttonSx: (theme: Theme) => SystemStyleObject<Theme>
}

/**
 * Gear button in the sidebar footer. Groups the per-user UI preferences
 * (language, light/dark) that used to sit in every page header.
 */
export function SidebarSettingsMenu({
  mode,
  onToggleMode,
  collapsed,
  buttonSx,
}: SidebarSettingsMenuProps) {
  const { t } = useI18n()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const open = Boolean(anchor)

  const rows = [
    {
      key: 'language',
      icon: <TranslateRounded />,
      label: t.sidebar.settingsLanguage,
      control: <LanguageToggleButton />,
    },
    {
      key: 'theme',
      icon: mode === 'dark' ? <DarkModeRounded /> : <LightModeRounded />,
      label: t.sidebar.settingsAppearance,
      hint: mode === 'dark' ? t.sidebar.themeDark : t.sidebar.themeLight,
      control: <ThemeToggleButton mode={mode} onToggle={onToggleMode} />,
    },
  ]

  return (
    <>
      <Tooltip title={open ? '' : t.sidebar.settings} placement="right">
        <IconButton
          aria-label={t.sidebar.settings}
          aria-haspopup="dialog"
          aria-expanded={open}
          size="small"
          onClick={(event) => setAnchor(open ? null : event.currentTarget)}
          sx={[
            buttonSx,
            {
              '& svg': { transition: 'transform 300ms ease' },
              '&:hover': { color: 'primary.main', bgcolor: 'action.selected', borderColor: 'primary.main', boxShadow: 'none' },
              '&:hover svg, &[aria-expanded="true"] svg': { transform: 'rotate(60deg)' },
              '&[aria-expanded="true"]': { color: 'primary.main' },
            },
          ]}
        >
          <SettingsRounded sx={{ fontSize: 17 }} />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={collapsed
          ? { vertical: 'bottom', horizontal: 'right' }
          : { vertical: 'top', horizontal: 'right' }}
        transformOrigin={collapsed
          ? { vertical: 'bottom', horizontal: 'left' }
          : { vertical: 'bottom', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: collapsed ? 0 : -1,
              ml: collapsed ? 1.25 : 0,
              width: 236,
              p: 1,
              borderRadius: '14px',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 14px 34px rgba(15,23,42,0.18)',
            },
          },
        }}
      >
        <Typography
          sx={{
            px: 0.75,
            pt: 0.25,
            pb: 0.75,
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'text.secondary',
          }}
        >
          {t.sidebar.settings}
        </Typography>

        <Stack spacing={0.5}>
          {rows.map((row) => (
            <Box
              key={row.key}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 0.75,
                py: 0.6,
                borderRadius: '10px',
                bgcolor: 'action.hover',
              }}
            >
              <Box sx={{ display: 'flex', color: 'text.secondary', '& svg': { fontSize: 17 } }}>
                {row.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>
                  {row.label}
                </Typography>
                {row.hint && (
                  <Typography noWrap sx={{ fontSize: 10, color: 'text.secondary', lineHeight: 1.2 }}>
                    {row.hint}
                  </Typography>
                )}
              </Box>
              {row.control}
            </Box>
          ))}
        </Stack>
      </Popover>
    </>
  )
}

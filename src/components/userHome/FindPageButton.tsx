import { Box, Typography } from '@mui/material'
import { SearchRounded } from '@mui/icons-material'

import { useI18n } from '../../i18n/useI18n'
import { openQuickJump } from '../layout/quickJump'

// Nút trên header trang chủ: mở hộp tìm trang (Ctrl+K) của sidebar. Cùng kiểu với nút "Đồ hoạ".
export function FindPageButton() {
  const { t } = useI18n()

  return (
    <Box
      component="button"
      type="button"
      aria-label={t.sidebar.searchAria}
      aria-haspopup="dialog"
      onClick={openQuickJump}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.8,
        flexShrink: 0,
        height: 34,
        pl: 1,
        pr: 1.2,
        borderRadius: '34px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'action.hover',
        color: 'text.primary',
        cursor: 'pointer',
        font: 'inherit',
        transition: 'border-color 160ms ease',
        '&:hover': { borderColor: 'primary.main' },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
      }}
    >
      <SearchRounded sx={{ fontSize: 18, color: 'primary.main' }} />
      <Typography component="span" sx={{ display: { xs: 'none', sm: 'inline' }, fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>
        {t.userHome.findPage}
      </Typography>
      <Box
        component="kbd"
        sx={{
          display: { xs: 'none', md: 'inline-block' },
          px: 0.6,
          borderRadius: '5px',
          border: '1px solid',
          borderColor: 'divider',
          fontFamily: 'ui-monospace, Consolas, monospace',
          fontSize: 10,
          fontWeight: 700,
          lineHeight: 1.6,
          color: 'text.secondary',
        }}
      >
        Ctrl K
      </Box>
    </Box>
  )
}

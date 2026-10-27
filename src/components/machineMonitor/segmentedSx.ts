import type { Theme } from '@mui/material/styles'

// Segmented control (ToggleButtonGroup) dùng chung trong Machine Monitoring:
// nền xám nhạt, nút đang chọn nền trắng + đổ bóng nhẹ, bo 8px, cao 30px
export const segmentedSx = (theme: Theme) => {
  const dark = theme.palette.mode === 'dark'

  return {
    p: '3px',
    gap: '2px',
    height: 30,
    boxSizing: 'border-box',
    borderRadius: '8px',
    bgcolor: dark ? 'rgba(255,255,255,.07)' : 'rgba(15,23,42,.06)',

    '& .MuiToggleButtonGroup-grouped': {
      height: 24,
      px: 1,
      py: 0,
      border: 0,
      borderRadius: '6px !important',
      m: 0,
      fontSize: 12,
      fontWeight: 600,
      lineHeight: 1,
      whiteSpace: 'nowrap',
      textTransform: 'none',
      color: 'text.secondary',
      '&:hover': { bgcolor: dark ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.6)' },
    },
    '& .MuiToggleButtonGroup-grouped.Mui-selected, & .MuiToggleButtonGroup-grouped.Mui-selected:hover': {
      color: 'text.primary',
      fontWeight: 700,
      bgcolor: dark ? 'rgba(255,255,255,.16)' : '#fff',
      boxShadow: '0 1px 2px rgba(15,23,42,.12), 0 1px 4px rgba(15,23,42,.08)',
    },
  }
}

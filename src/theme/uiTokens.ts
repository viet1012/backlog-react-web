import type { Theme } from '@mui/material/styles'

export const uiTokens = {
  typography: {
    body: 13,
    button: 12.5,
    input: 12.5,
    inputLabel: 12,
    chip: 11.5,
    updatedStatus: 11.5,
  },

  page: {
    padding: 1,
    gap: 0.75,
  },

  header: {
    borderRadius: '12px',
    px: 1.5,
    py: 0.75,
    titleFontSize: 20,
    subtitleFontSize: 12.5,
    metaFontSize: 11.5,
  },

  card: {
    borderRadius: '12px',
  },

  control: {
    borderRadius: '10px',
    height: 36,
    fontSize: 13,
  },

  dialog: {
    borderRadius: '14px',
  },

  table: {
    headerFontSize: 12.5,
    cellFontSize: 12.5,
    auxiliaryFontSize: 12,
    rowHeight: 30,
    headerHeight: 34,
  },

  sidebar: {
    appTitleFontSize: 14,
    subtitleFontSize: 11,
    sectionFontSize: 10.5,
    menuFontSize: 12.5,
  },

  kpi: {
    labelFontSize: 12,
    valueFontSize: 20,
    secondaryFontSize: 11.5,
  },

  dialogTypography: {
    titleFontSize: 16,
  },

  // =====================================================
  // APP ACTION COLORS
  // =====================================================

  action: {
    blue: '#1687D9',
    success: '#2E9D63',
    danger: '#D64545',
  },
} as const

export const glassPanelSx = (theme: Theme) => ({
  bgcolor:
    theme.palette.mode === 'dark'
      ? 'rgba(17,27,45,0.78)'
      : 'rgba(255,255,255,0.76)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: `1px solid ${theme.palette.mode === 'dark'
      ? 'rgba(255,255,255,0.10)'
      : 'rgba(255,255,255,0.72)'
    }`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 8px 24px rgba(0,0,0,0.18)'
      : '0 8px 24px rgba(15,23,42,0.08)',
})

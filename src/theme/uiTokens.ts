import type { Theme } from '@mui/material/styles'

import { appTokens } from './colorTokens'

/*
 * DESIGN TOKEN – CỠ CHỮ, KHOẢNG CÁCH, BO GÓC (đề xuất 8). Màu: colorTokens.ts.
 */

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
    // Same title row height on every page, with or without subtitle / actions
    rowHeight: 40,
    titleFontSize: 17,
    subtitleFontSize: 12,
    eyebrowFontSize: 10.5,
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

/** Lớp kính của panel / header (màu ở colorTokens.ts) */
export const glassPanelSx = (theme: Theme) => {
  const c = appTokens(theme.palette.mode)

  return {
    bgcolor: c.surface.panel,
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: `1px solid ${c.surfaceBorder.panel}`,
    boxShadow: c.shadow.surface,
  }
}

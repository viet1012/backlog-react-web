import { createTheme, type PaletteMode } from '@mui/material/styles'
import { enUS as coreEnUS, viVN as coreViVN } from '@mui/material/locale'
import type { } from '@mui/x-data-grid/themeAugmentation'
import { enUS as gridEnUS, viVN as gridViVN } from '@mui/x-data-grid/locales'
import { enUS as pickersEnUS, viVN as pickersViVN } from '@mui/x-date-pickers/locales'
import type { Language } from '../utils/uiPreferences'
import { appTokens } from './colorTokens'
import { uiTokens } from './uiTokens'

const muiLocales = {
  vi: [coreViVN, gridViVN, pickersViVN],
  en: [coreEnUS, gridEnUS, pickersEnUS],
} as const

// Màu lấy từ colorTokens.ts, cỡ chữ / bo góc từ uiTokens.ts: không ghi mã màu ở đây
export function createDashboardTheme(mode: PaletteMode, language: Language = 'vi') {
  const dark = mode === 'dark'
  const c = appTokens(mode)

  return createTheme({
    app: c,
    palette: {
      mode,
      primary: { main: c.base.primary },
      background: {
        default: c.base.pageBg,
        paper: c.base.paper,
      },
      text: {
        primary: c.base.textPrimary,
        secondary: c.base.textSecondary,
      },
      divider: c.base.divider,
    },
    shape: { borderRadius: 10 },
    typography: {
      fontSize: uiTokens.typography.body,
      fontFamily:
        "'Inter Variable', Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      body1: { fontSize: uiTokens.typography.body },
      body2: { fontSize: uiTokens.typography.body },
      caption: { fontSize: uiTokens.kpi.secondaryFontSize },
      button: {
        fontSize: uiTokens.typography.button,
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          'html, body, #root': {
            backgroundColor: c.base.pageBg,
          },
          body: {
            fontSize: uiTokens.typography.body,
            backgroundColor: c.base.pageBg,
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            // No backdrop blur on cards: pages hold many of them (Cost: 9+),
            // each one a GPU layer re-sampled on scroll / transitions, over a
            // background that is only a soft gradient. Slightly more opaque
            // fill keeps the same look.
            backgroundColor: c.surface.card,
            border: `1px solid ${c.surfaceBorder.panel}`,
            borderRadius: uiTokens.card.borderRadius,
            boxShadow: c.shadow.surface,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            minHeight: uiTokens.control.height,
            borderRadius: uiTokens.control.borderRadius,
            backgroundColor: c.control.inputBg,

            // Không blur ở control nhỏ: nằm trên panel gần đặc nên không thấy khác,
            // nhưng mỗi ô blur là một lớp GPU phải vẽ lại khi trang hiện ra

            '& fieldset': {
              borderColor: c.control.inputBorder,
            },

            '&:hover fieldset': {
              borderColor: c.control.inputBorderHover,
            },

            '&.Mui-focused fieldset': {
              borderWidth: 1,
            },

            /* =========================
               DATE ICON DARK / LIGHT
               Chế độ tối: html có color-scheme: dark (CssBaseline
               enableColorScheme) nên trình duyệt tự vẽ icon lịch màu sáng;
               không invert nữa (invert sẽ làm icon tối lại).
            ========================= */

            '& input[type="date"]::-webkit-calendar-picker-indicator': {
              cursor: 'pointer',

              opacity: dark ? 0.9 : 0.75,
            },

            '& input[type="date"]::-webkit-calendar-picker-indicator:hover': {
              opacity: 1,
            },
          },

          input: {
            fontSize: uiTokens.control.fontSize,
          },
        },
      },
      MuiButton: {
        defaultProps: {
          size: 'small',
        },
        styleOverrides: {
          root: {
            minHeight: 36,
            borderRadius: uiTokens.control.borderRadius,
            fontSize: uiTokens.typography.button,
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: 'none',
            transition: 'transform 120ms ease, background-color 160ms ease, border-color 160ms ease, color 160ms ease',
            '&:hover': { boxShadow: 'none' },
            '&:active': { transform: 'scale(0.98)' },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: uiTokens.control.borderRadius,
            backgroundColor: c.control.iconButtonBg,
            border: `1px solid ${c.control.border}`,
            transition: 'transform 120ms ease, background-color 160ms ease, color 160ms ease, border-color 160ms ease',
            '&:hover': {
              backgroundColor: c.control.iconButtonBgHover,
            },
            '&:active': { transform: 'scale(0.96)' },
          },
          sizeSmall: {
            width: 32,
            height: 32,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            height: 26,
            borderRadius: uiTokens.control.borderRadius,
            fontSize: uiTokens.typography.chip,
            fontWeight: 600,
            backgroundColor: c.control.chipBg,
            border: `1px solid ${c.control.border}`,
            transition: 'transform 120ms ease, background-color 160ms ease, border-color 160ms ease',
            '&:active': { transform: 'scale(0.98)' },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            minHeight: '0 !important',
            paddingTop: 7.5,
            paddingBottom: 7.5,
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: uiTokens.typography.inputLabel,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: uiTokens.typography.input,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: uiTokens.dialog.borderRadius,
            border: `1px solid ${c.surfaceBorder.dialog}`,
            backgroundColor: c.surface.dialog,
            backgroundImage: 'none',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: c.shadow.dialog,
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            color: c.gridBase.text,
            backgroundColor: c.gridBase.bg,
            border: 0,
            borderRadius: 5,
            fontSize: uiTokens.table.cellFontSize,
            '--DataGrid-rowBorderColor': c.gridBase.rowBorder,
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: c.gridBase.headerBg,
              borderBottom: `1px solid ${c.gridBase.headerBorder}`,
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontSize: uiTokens.table.headerFontSize,
              fontWeight: 700,
            },
            '& .MuiDataGrid-cell': {
              fontSize: uiTokens.table.cellFontSize,
              borderColor: c.gridBase.rowBorder,
            },
            '& .MuiDataGrid-row:nth-of-type(even)': {
              backgroundColor: c.gridBase.rowAlt,
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: c.gridBase.rowHover,
            },
            '& .MuiDataGrid-row.Mui-selected': {
              backgroundColor: c.gridBase.rowSelected,
            },
            '& .MuiDataGrid-footerContainer, & .MuiDataGrid-toolbarContainer': {
              backgroundColor: c.gridBase.footerBg,
            },
            '& .MuiDataGrid-footerContainer': {
              minHeight: 46,
              borderTop: `1px solid ${c.gridBase.footerBorder}`,
            },
            '& .MuiDataGrid-toolbarContainer, & .MuiTablePagination-root': {
              fontSize: uiTokens.table.auxiliaryFontSize,
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: uiTokens.table.auxiliaryFontSize,
            },
            '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': {
              width: 10,
              height: 10,
            },
            '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track': {
              backgroundColor: c.gridBase.scrollTrack,
            },
            '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': {
              backgroundColor: c.gridBase.scrollThumb,
              border: `2px solid ${c.gridBase.scrollTrack}`,
              borderRadius: 4,
            },
            '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb:hover': {
              backgroundColor: c.gridBase.scrollThumbHover,
            },
          },
        },
      },
    },
  }, ...muiLocales[language])
}

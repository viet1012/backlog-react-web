import { createTheme, type PaletteMode } from '@mui/material/styles'
import type { } from '@mui/x-data-grid/themeAugmentation'
import { uiTokens } from './uiTokens'

export function createDashboardTheme(mode: PaletteMode) {
  const dark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: { main: dark ? '#60a5fa' : '#2563eb' },
      background: {
        default: dark ? '#0b1220' : '#eef3f8',
        paper: dark ? '#111b2d' : '#ffffff',
      },
      text: {
        primary: dark ? '#f8fafc' : '#172033',
        secondary: dark ? '#94a3b8' : '#64748b',
      },
      divider: dark
        ? 'rgba(148, 163, 184, 0.16)'
        : 'rgba(71, 85, 105, 0.16)',
    },
    shape: { borderRadius: 10 },
    typography: {
      fontSize: uiTokens.typography.body,
      fontFamily:
        "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
            backgroundColor: dark ? '#0b1220' : '#eef3f8',
          },
          body: {
            fontSize: uiTokens.typography.body,
            backgroundColor: dark ? '#0b1220' : '#eef3f8',
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: dark
              ? 'rgba(17,27,45,0.78)'
              : 'rgba(255,255,255,0.76)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.72)'}`,
            borderRadius: uiTokens.card.borderRadius,
            boxShadow: dark
              ? '0 8px 24px rgba(0,0,0,0.18)'
              : '0 8px 24px rgba(15,23,42,0.08)',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            minHeight: uiTokens.control.height,
            borderRadius: uiTokens.control.borderRadius,
            backgroundColor: dark
              ? 'rgba(255,255,255,0.045)'
              : 'rgba(255,255,255,0.72)',

            backdropFilter: 'blur(12px)',

            '& fieldset': {
              borderColor: dark
                ? 'rgba(255,255,255,0.10)'
                : 'rgba(15,23,42,0.10)',
            },

            '&:hover fieldset': {
              borderColor: dark
                ? 'rgba(255,255,255,0.18)'
                : 'rgba(15,23,42,0.18)',
            },

            '&.Mui-focused fieldset': {
              borderWidth: 1,
            },

            /* =========================
               DATE ICON DARK / LIGHT
            ========================= */

            '& input[type="date"]::-webkit-calendar-picker-indicator': {
              cursor: 'pointer',

              opacity: dark ? 0.9 : 0.75,

              filter: dark
                ? 'invert(1) brightness(1.8)'
                : 'none',
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
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
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
            backgroundColor: dark
              ? 'rgba(255,255,255,0.045)'
              : 'rgba(255,255,255,0.58)',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.09)' : 'rgba(71,85,105,0.12)'}`,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transition: 'transform 120ms ease, background-color 160ms ease, color 160ms ease, border-color 160ms ease',
            '&:hover': {
              backgroundColor: dark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(255,255,255,0.82)',
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
            backgroundColor: dark
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(255,255,255,0.60)',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.09)' : 'rgba(71,85,105,0.12)'}`,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
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
            border: `1px solid ${dark ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.78)'}`,
            backgroundColor: dark
              ? 'rgba(17,27,45,0.88)'
              : 'rgba(255,255,255,0.88)',
            backgroundImage: 'none',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: dark
              ? '0 20px 50px rgba(0,0,0,0.30)'
              : '0 20px 50px rgba(15,23,42,0.14)',
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            color: dark ? '#dbe7f8' : '#243047',
            backgroundColor: dark ? '#101a2b' : '#ffffff',
            border: 0,
            borderRadius: 5,
            fontSize: uiTokens.table.cellFontSize,
            '--DataGrid-rowBorderColor': dark
              ? 'rgba(148,163,184,0.14)'
              : 'rgba(71,85,105,0.14)',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: dark ? '#17243a' : '#eef3f8',
              borderBottom: `1px solid ${dark ? 'rgba(148,163,184,0.18)' : 'rgba(71,85,105,0.16)'}`,
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontSize: uiTokens.table.headerFontSize,
              fontWeight: 700,
            },
            '& .MuiDataGrid-cell': {
              fontSize: uiTokens.table.cellFontSize,
              borderColor: dark
                ? 'rgba(148,163,184,0.14)'
                : 'rgba(71,85,105,0.14)',
            },
            '& .MuiDataGrid-row:nth-of-type(even)': {
              backgroundColor: dark ? '#121e31' : '#f8fafc',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: dark ? '#1b3150' : '#eef5ff',
            },
            '& .MuiDataGrid-row.Mui-selected': {
              backgroundColor: dark ? '#1c3b61' : '#dbeafe',
            },
            '& .MuiDataGrid-footerContainer, & .MuiDataGrid-toolbarContainer': {
              backgroundColor: dark ? '#131f33' : '#f6f8fb',
            },
            '& .MuiDataGrid-footerContainer': {
              minHeight: 46,
              borderTop: `1px solid ${dark ? 'rgba(148,163,184,0.18)' : 'rgba(71,85,105,0.16)'}`,
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
              backgroundColor: dark ? '#0d1625' : '#e5eaf0',
            },
            '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': {
              backgroundColor: dark ? '#33445e' : '#aab5c4',
              border: `2px solid ${dark ? '#0d1625' : '#e5eaf0'}`,
              borderRadius: 4,
            },
            '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb:hover': {
              backgroundColor: dark ? '#49617f' : '#8392a7',
            },
          },
        },
      },
    },
  })
}

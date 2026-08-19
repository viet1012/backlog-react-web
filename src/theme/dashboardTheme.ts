import { createTheme, type PaletteMode } from '@mui/material/styles'
import type {} from '@mui/x-data-grid/themeAugmentation'

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
    shape: { borderRadius: 14 },
    typography: {
      fontFamily:
        "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: dark ? '#0b1220' : '#eef3f8',
            backgroundImage: dark
              ? 'radial-gradient(circle at 12% 0%, rgba(37,99,235,0.14), transparent 32%), radial-gradient(circle at 90% 10%, rgba(14,165,233,0.08), transparent 28%)'
              : 'radial-gradient(circle at 12% 0%, rgba(59,130,246,0.10), transparent 34%), radial-gradient(circle at 90% 10%, rgba(14,165,233,0.06), transparent 28%)',
            backgroundAttachment: 'fixed',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: dark
              ? 'rgba(15,23,42,0.62)'
              : 'rgba(255,255,255,0.78)',
            transition: 'border-color 160ms ease, box-shadow 160ms ease',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: dark
                ? 'rgba(148,163,184,0.24)'
                : 'rgba(71,85,105,0.22)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: dark
                ? 'rgba(148,163,184,0.48)'
                : 'rgba(37,99,235,0.45)',
            },
            '&.Mui-focused': {
              boxShadow: dark
                ? '0 0 0 3px rgba(96,165,250,0.12)'
                : '0 0 0 3px rgba(37,99,235,0.10)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            transition: 'filter 160ms ease, background-color 160ms ease',
            '&:hover': { filter: 'brightness(1.08)' },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { transition: 'filter 160ms ease' },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            color: dark ? '#dbe7f8' : '#243047',
            backgroundColor: dark ? '#101a2b' : '#ffffff',
          },
        },
      },
    },
  })
}

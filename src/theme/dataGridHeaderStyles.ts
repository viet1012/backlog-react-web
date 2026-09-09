import { alpha, type Theme } from '@mui/material/styles'
import type { GridEventListener } from '@mui/x-data-grid'

// =====================================================
// PREVENT COLUMN HEADER SORT
// =====================================================

export const preventColumnHeaderSort:
  GridEventListener<'columnHeaderClick'> = (
    _params,
    event,
  ) => {
    event.defaultMuiPrevented = true
  }

// =====================================================
// DATAGRID HEADER STYLE
// =====================================================

export const dataGridHeaderSx = (theme: Theme) => {
  const isDark = theme.palette.mode === 'dark'

  // =====================================================
  // COLOR
  // =====================================================

  const headerAccent = isDark
    ? '#2D67D4'
    : '#4778C9'

  const headerBgTop = alpha(
    headerAccent,
    isDark ? 0.18 : 0.11,
  )

  const headerBgBottom = alpha(
    headerAccent,
    isDark ? 0.11 : 0.055,
  )

  const headerBorder = alpha(
    headerAccent,
    isDark ? 0.34 : 0.22,
  )

  const headerSeparator = alpha(
    headerAccent,
    isDark ? 0.30 : 0.20,
  )

  const headerHoverBg = alpha(
    headerAccent,
    isDark ? 0.22 : 0.13,
  )

  const headerBackground = `linear-gradient(
    180deg,
    ${headerBgTop} 0%,
    ${headerBgBottom} 100%
  )`

  return {
    width: '100%',
    height: '100%',

    // =====================================================
    // REMOVE HEADER ROUNDING
    // =====================================================

    '& .MuiDataGrid-columnHeaders': {
      background: `${headerBackground} !important`,

      borderBottom:
        `1px solid ${headerBorder}`,

      // IMPORTANT
      borderRadius: '0 !important',
    },

    '& .MuiDataGrid-columnHeadersInner': {
      background:
        'transparent !important',

      borderRadius:
        '0 !important',
    },

    '& .MuiDataGrid-columnHeader': {
      background:
        'transparent !important',

      borderRadius:
        '0 !important',
    },

    // First column
    '& .MuiDataGrid-columnHeader:first-of-type': {
      borderTopLeftRadius:
        '0 !important',

      borderBottomLeftRadius:
        '0 !important',
    },

    // Last column
    '& .MuiDataGrid-columnHeader:last-of-type': {
      borderTopRightRadius:
        '0 !important',

      borderBottomRightRadius:
        '0 !important',
    },

    // =====================================================
    // FILLER / SCROLLBAR HEADER
    // =====================================================

    '& .MuiDataGrid-filler, & .MuiDataGrid-scrollbarFiller, & .MuiDataGrid-scrollbarFiller--header':
    {
      background:
        `${headerBackground} !important`,

      borderRadius:
        '0 !important',
    },

    // =====================================================
    // HEADER TEXT
    // =====================================================

    '& .MuiDataGrid-columnHeaderTitle': {
      fontWeight: 700,

      color:
        theme.palette.text.primary,

      letterSpacing: '-0.01em',
    },

    '& .MuiDataGrid-columnHeaderTitleContainer': {
      borderRadius:
        '0 !important',
    },

    // =====================================================
    // COLUMN SEPARATOR
    // =====================================================

    '& .MuiDataGrid-columnSeparator': {
      color: headerSeparator,
      opacity: 1,
    },

    // =====================================================
    // HIDE SORT ICON
    // =====================================================

    '& .MuiDataGrid-sortIcon': {
      display:
        'none !important',
    },

    '& .MuiDataGrid-iconButtonContainer': {
      display:
        'none !important',
    },

    // =====================================================
    // COLUMN MENU
    // =====================================================

    '& .MuiDataGrid-menuIcon': {
      display:
        'flex !important',

      visibility:
        'visible !important',

      width:
        'auto !important',

      backgroundColor:
        'transparent !important',

      borderRadius:
        '0 !important',
    },

    '& .MuiDataGrid-menuIconButton': {
      display:
        'inline-flex !important',

      visibility:
        'visible !important',

      alignItems: 'center',
      justifyContent: 'center',

      width: 28,
      height: 28,
      minWidth: 28,
      minHeight: 28,

      padding: 0,

      color: headerAccent,

      backgroundColor:
        'transparent !important',

      border:
        'none !important',

      boxShadow:
        'none !important',

      // No rounded button
      borderRadius:
        '0 !important',

      transition:
        'background-color 140ms ease, color 140ms ease',

      '&:hover': {
        color: headerAccent,

        backgroundColor:
          `${headerHoverBg} !important`,

        borderRadius:
          '0 !important',
      },
    },

    // =====================================================
    // REMOVE MUI ICON BUTTON ROUNDING
    // =====================================================

    '& .MuiDataGrid-columnHeader .MuiIconButton-root': {
      backgroundColor:
        'transparent !important',

      border:
        'none !important',

      boxShadow:
        'none !important',

      borderRadius:
        '0 !important',

      '&:hover': {
        backgroundColor:
          `${headerHoverBg} !important`,

        borderRadius:
          '0 !important',
      },
    },

    // =====================================================
    // HEADER HOVER
    // =====================================================

    '& .MuiDataGrid-columnHeader:hover': {
      backgroundColor: `${alpha(
        headerAccent,
        isDark ? 0.055 : 0.035,
      )} !important`,

      borderRadius:
        '0 !important',
    },

    // =====================================================
    // ROW
    // =====================================================

    '& .MuiDataGrid-row': {
      transition:
        'background-color 160ms ease',
    },
  }
}
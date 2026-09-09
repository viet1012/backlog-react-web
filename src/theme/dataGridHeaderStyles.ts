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
  const isDark =
    theme.palette.mode === 'dark'

  // =====================================================
  // COLOR
  // =====================================================

  const headerAccent =
    isDark
      ? '#4F7FE3'
      : '#5F88CC'

  const headerBgTop =
    alpha(
      headerAccent,
      isDark ? 0.24 : 0.16,
    )

  const headerBgBottom =
    alpha(
      headerAccent,
      isDark ? 0.11 : 0.07,
    )

  const headerBorder =
    alpha(
      headerAccent,
      isDark ? 0.34 : 0.22,
    )

  const headerSeparator =
    alpha(
      headerAccent,
      isDark ? 0.26 : 0.16,
    )

  const headerHoverBg =
    alpha(
      headerAccent,
      isDark ? 0.13 : 0.08,
    )

  const headerText =
    isDark
      ? alpha('#ffffff', 0.92)
      : '#17365F'

  const headerBackground =
    `linear-gradient(
      180deg,
      ${headerBgTop} 0%,
      ${headerBgBottom} 100%
    )`

  return {
    width: '100%',
    height: '100%',

    // =====================================================
    // HEADER
    // =====================================================

    '& .MuiDataGrid-columnHeaders': {
      background:
        `${headerBackground} !important`,

      borderBottom:
        `1px solid ${headerBorder}`,

      borderRadius:
        '0 !important',

      boxShadow:
        isDark
          ? 'inset 0 -1px 0 rgba(255,255,255,0.025)'
          : 'inset 0 -1px 0 rgba(15,23,42,0.025)',
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

      transition:
        'background-color 140ms ease',
    },

    // =====================================================
    // FIRST / LAST
    // =====================================================

    '& .MuiDataGrid-columnHeader:first-of-type': {
      borderTopLeftRadius:
        '0 !important',

      borderBottomLeftRadius:
        '0 !important',
    },

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
        `${headerText} !important`,

      letterSpacing:
        '-0.01em',

      fontSize:
        '0.79rem',
    },

    '& .MuiDataGrid-columnHeaderTitleContainer': {
      borderRadius:
        '0 !important',

      minWidth: 0,
    },

    // =====================================================
    // COLUMN SEPARATOR
    // =====================================================

    '& .MuiDataGrid-columnSeparator': {
      color:
        headerSeparator,

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

      width: 27,
      height: 27,

      minWidth: 27,
      minHeight: 27,

      padding: 0,

      color:
        headerAccent,

      backgroundColor:
        'transparent !important',

      border:
        'none !important',

      boxShadow:
        'none !important',

      borderRadius:
        '0 !important',

      opacity:
        0.82,

      transition:
        'background-color 140ms ease, color 140ms ease, opacity 140ms ease',

      '&:hover': {
        color:
          headerAccent,

        opacity: 1,

        backgroundColor:
          `${headerHoverBg} !important`,

        borderRadius:
          '0 !important',
      },
    },

    // =====================================================
    // REMOVE ICON BUTTON ROUNDING
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
      backgroundColor:
        `${alpha(
          headerAccent,
          isDark ? 0.06 : 0.045,
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
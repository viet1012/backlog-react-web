import {
  alpha,
  type Theme,
} from '@mui/material/styles'

import type {
  GridEventListener,
} from '@mui/x-data-grid'

// =====================================================
// PREVENT COLUMN HEADER SORT
// =====================================================

export const preventColumnHeaderSort:
  GridEventListener<'columnHeaderClick'> =
  (
    _params,
    event,
  ) => {
    event.defaultMuiPrevented = true
  }

// =====================================================
// DATAGRID GLASS STYLE
// =====================================================

export const dataGridHeaderSx =
  (theme: Theme) => {

    const isDark =
      theme.palette.mode === 'dark'

    const accent =
      isDark
        ? '#7AA2F7'
        : '#4F74B8'

    const gridBorder =
      isDark
        ? alpha('#FFFFFF', 0.10)
        : alpha('#334155', 0.10)

    const headerGlass =
      isDark
        ? alpha('#111827', 0.58)
        : alpha('#F8FAFC', 0.62)

    const bodyGlass =
      isDark
        ? alpha('#0F172A', 0.44)
        : alpha('#FFFFFF', 0.52)

    const rowGlass =
      isDark
        ? alpha('#172033', 0.34)
        : alpha('#FFFFFF', 0.34)

    const rowGlassAlt =
      isDark
        ? alpha('#1E293B', 0.26)
        : alpha('#F8FAFC', 0.32)

    const hoverGlass =
      isDark
        ? alpha(accent, 0.12)
        : alpha(accent, 0.075)

    const headerHoverGlass =
      isDark
        ? alpha('#FFFFFF', 0.06)
        : alpha('#0F172A', 0.045)

    const separatorColor =
      isDark
        ? alpha('#FFFFFF', 0.11)
        : alpha('#334155', 0.11)

    const headerText =
      isDark
        ? alpha('#FFFFFF', 0.94)
        : '#1E293B'

    return {
      width: '100%',
      height: '100%',

      position: 'relative',

      border:
        'none',

      borderRadius: 2.2,

      overflow: 'hidden',

      backgroundColor:
        'transparent',

      backgroundImage:
        isDark
          ? `
              radial-gradient(
                circle at 18% 0%,
                ${alpha(accent, 0.10)} 0%,
                transparent 34%
              ),
              linear-gradient(
                180deg,
                ${alpha('#0F172A', 0.38)} 0%,
                ${alpha('#111827', 0.26)} 100%
              )
            `
          : `
              radial-gradient(
                circle at 18% 0%,
                ${alpha(accent, 0.09)} 0%,
                transparent 34%
              ),
              linear-gradient(
                180deg,
                ${alpha('#FFFFFF', 0.68)} 0%,
                ${alpha('#F8FAFC', 0.46)} 100%
              )
            `,

      boxShadow:
        isDark
          ? '0 10px 30px rgba(0,0,0,0.16)'
          : '0 10px 30px rgba(15,23,42,0.07)',

      backdropFilter:
        'blur(18px) saturate(145%)',

      WebkitBackdropFilter:
        'blur(18px) saturate(145%)',

      // =====================================================
      // MAIN / VIRTUAL SCROLLER
      // =====================================================

      '& .MuiDataGrid-main': {
        backgroundColor:
          bodyGlass,

        backdropFilter:
          'blur(14px) saturate(135%)',

        WebkitBackdropFilter:
          'blur(14px) saturate(135%)',
      },

      '& .MuiDataGrid-virtualScroller': {
        backgroundColor:
          'transparent',
      },

      '& .MuiDataGrid-virtualScrollerContent': {
        backgroundColor:
          'transparent',
      },

      '& .MuiDataGrid-virtualScrollerRenderZone': {
        backgroundColor:
          'transparent',
      },

      // =====================================================
      // COLUMN HEADER AREA
      // =====================================================

      '& .MuiDataGrid-columnHeaders': {
        position: 'relative',

        background:
          `${headerGlass} !important`,

        backdropFilter:
          'blur(22px) saturate(160%)',

        WebkitBackdropFilter:
          'blur(22px) saturate(160%)',

        borderBottom:
          `1px solid ${isDark
            ? alpha('#FFFFFF', 0.09)
            : alpha('#334155', 0.08)
          }`,

        boxShadow:
          isDark
            ? '0 4px 16px rgba(0,0,0,0.10)'
            : '0 4px 16px rgba(15,23,42,0.06)',

        '&::before, &::after': {
          content: 'none',
          display: 'none',
        },
      },
      '& .MuiDataGrid-columnHeadersInner': {
        background:
          'transparent !important',

        '&::before, &::after': {
          content: 'none',
          display: 'none',
        },
      },

      // =====================================================
      // COLUMN HEADER
      // =====================================================

      '& .MuiDataGrid-columnHeader': {
        background:
          'transparent !important',

        transition:
          'background-color 140ms ease, box-shadow 140ms ease',

        '&:hover': {
          backgroundColor:
            `${headerHoverGlass} !important`,
        },

        '&:focus, &:focus-within': {
          outline: 'none',
        },
      },

      // =====================================================
      // HEADER TEXT
      // =====================================================

      '& .MuiDataGrid-columnHeaderTitle': {
        fontWeight: 700,

        color:
          `${headerText} !important`,

        fontSize:
          '0.79rem',

        letterSpacing:
          '-0.012em',

        textShadow:
          isDark
            ? '0 1px 1px rgba(0,0,0,0.25)'
            : '0 1px 0 rgba(255,255,255,0.75)',
      },

      '& .MuiDataGrid-columnHeaderTitleContainer': {
        minWidth: 0,

        gap: 0.5,
      },

      // =====================================================
      // COLUMN SEPARATOR
      // =====================================================

      '& .MuiDataGrid-columnSeparator': {
        color:
          separatorColor,

        opacity: 1,

        '&:hover': {
          color:
            isDark
              ? alpha('#FFFFFF', 0.42)
              : alpha('#334155', 0.42),
        },
      },

      // =====================================================
      // FILLER
      // =====================================================

      '& .MuiDataGrid-filler, & .MuiDataGrid-scrollbarFiller, & .MuiDataGrid-scrollbarFiller--header':
      {
        background:
          `${headerGlass} !important`,

        backdropFilter:
          'blur(22px) saturate(160%)',

        WebkitBackdropFilter:
          'blur(22px) saturate(160%)',
      },

      // =====================================================
      // SORT ICON
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

        opacity: 1,
      },

      '& .MuiDataGrid-menuIconButton': {
        width: 28,
        height: 28,

        minWidth: 28,
        minHeight: 28,

        padding: 0,

        color:
          isDark
            ? alpha('#FFFFFF', 0.78)
            : alpha('#1E293B', 0.74),

        borderRadius:
          '8px !important',

        backgroundColor:
          `${alpha(
            isDark
              ? '#FFFFFF'
              : '#1E293B',
            isDark
              ? 0.035
              : 0.025,
          )} !important`,

        border:
          `1px solid ${alpha(
            isDark
              ? '#FFFFFF'
              : '#334155',
            isDark
              ? 0.10
              : 0.08,
          )}`,

        transition:
          'all 140ms ease',

        '&:hover': {
          color:
            isDark
              ? '#FFFFFF'
              : '#0F172A',

          backgroundColor:
            `${alpha(
              isDark
                ? '#FFFFFF'
                : '#0F172A',
              isDark
                ? 0.10
                : 0.07,
            )} !important`,

          borderColor:
            alpha(
              isDark
                ? '#FFFFFF'
                : '#334155',
              0.18,
            ),

          transform:
            'translateY(-1px)',

          boxShadow:
            isDark
              ? '0 3px 10px rgba(0,0,0,0.16)'
              : '0 3px 10px rgba(15,23,42,0.10)',
        },
      },

      // =====================================================
      // ROWS
      // =====================================================

      '& .MuiDataGrid-row': {
        backgroundColor:
          rowGlass,

        transition:
          'background-color 130ms ease, box-shadow 130ms ease',

        '&:nth-of-type(even)': {
          backgroundColor:
            rowGlassAlt,
        },

        '&:hover': {
          backgroundColor:
            `${hoverGlass} !important`,

          boxShadow:
            isDark
              ? `
                  inset 0 1px 0 rgba(255,255,255,0.035),
                  inset 0 -1px 0 rgba(255,255,255,0.02)
                `
              : `
                  inset 0 1px 0 rgba(255,255,255,0.55),
                  inset 0 -1px 0 rgba(15,23,42,0.025)
                `,
        },
      },

      // =====================================================
      // CELLS
      // =====================================================

      '& .MuiDataGrid-cell': {
        backgroundColor:
          'transparent',

        borderBottom:
          `1px solid ${isDark
            ? alpha('#FFFFFF', 0.050)
            : alpha('#0F172A', 0.055)
          }`,

        borderRight:
          `1px solid ${isDark
            ? alpha('#FFFFFF', 0.025)
            : alpha('#0F172A', 0.025)
          }`,
      },

      '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within':
      {
        outline: 'none',
      },

      // =====================================================
      // EDIT CELL
      // =====================================================

      '& .MuiDataGrid-cell--editing': {
        backgroundColor:
          isDark
            ? `${alpha('#111827', 0.82)} !important`
            : `${alpha('#FFFFFF', 0.88)} !important`,

        backdropFilter:
          'blur(18px)',

        WebkitBackdropFilter:
          'blur(18px)',

        boxShadow:
          `inset 0 0 0 1.5px ${alpha(accent, 0.70)} !important`,
      },

      // =====================================================
      // FOOTER
      // =====================================================

      '& .MuiDataGrid-footerContainer': {
        borderTop:
          `1px solid ${gridBorder}`,

        backgroundColor:
          isDark
            ? alpha('#111827', 0.58)
            : alpha('#F8FAFC', 0.64),

        backdropFilter:
          'blur(20px) saturate(145%)',

        WebkitBackdropFilter:
          'blur(20px) saturate(145%)',

        boxShadow:
          isDark
            ? 'inset 0 1px 0 rgba(255,255,255,0.05)'
            : 'inset 0 1px 0 rgba(255,255,255,0.82)',
      },

      // =====================================================
      // SCROLLBAR
      // =====================================================

      '& .MuiDataGrid-scrollbar': {
        '&::-webkit-scrollbar': {
          width: 10,
          height: 10,
        },

        '&::-webkit-scrollbar-track': {
          background:
            'transparent',
        },

        '&::-webkit-scrollbar-thumb': {
          backgroundColor:
            alpha(
              accent,
              isDark
                ? 0.28
                : 0.22,
            ),

          borderRadius: 999,

          border:
            '3px solid transparent',

          backgroundClip:
            'padding-box',
        },

        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor:
            alpha(
              accent,
              isDark
                ? 0.42
                : 0.34,
            ),
        },
      },
    }
  }

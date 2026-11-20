import {
  alpha,
  type Theme,
} from '@mui/material/styles'

import type {
  GridEventListener,
} from '@mui/x-data-grid'

import {
  DEADLINE_CELL_CLASS,
  deadlineTextColor,
} from './statusTones'

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

    // Header dính trên đầu, dòng cuộn chạy bên dưới; không còn blur nên
    // nền phải gần đặc để chữ của dòng không lộ qua header
    const headerGlass =
      isDark
        ? alpha('#111827', 0.94)
        : alpha('#F8FAFC', 0.95)

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

    // Nền đặc cho cột ghim, gần đúng màu kính của dòng / header phía sau
    const pinnedBackground =
      isDark ? '#141d2e' : '#fbfcfe'

    const pinnedBackgroundAlt =
      isDark ? '#172235' : '#f6f8fb'

    const pinnedBackgroundHover =
      isDark ? '#1b2a45' : '#eef3fb'

    const pinnedHeaderBackground =
      isDark ? '#111827' : '#F8FAFC'

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

      // Chỉ giữ 1 lớp blur ở root: blur lồng nhau (main/header/footer) bắt GPU
      // vẽ lại nhiều lớp mỗi lần trang hiện ra (chuyển trang bị giật), còn nhìn
      // gần như không khác vì bên dưới chỉ là nền của chính grid
      '& .MuiDataGrid-main': {
        backgroundColor:
          bodyGlass,
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
      // Chỉ phần đệm TRONG HEADER (bên phải cột cuối, chỗ thanh cuộn dọc).
      // Không tô `.MuiDataGrid-filler` ở thân bảng: đó là khoảng trống dưới các
      // dòng (flex: 1 0 auto). Tô nền nó thành một khối lớn bị dòng đẩy xuống
      // mỗi lần dữ liệu về => trình duyệt tính là nhảy bố cục (CLS 0.2 ở Fac Confirm).
      // =====================================================

      '& .MuiDataGrid-columnHeaders .MuiDataGrid-filler, & .MuiDataGrid-scrollbarFiller, & .MuiDataGrid-scrollbarFiller--header':
      {
        background:
          `${headerGlass} !important`,
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

      // Số và ngày: chữ số cùng độ rộng => cột số thẳng hàng, không "nhảy"
      '& .MuiDataGrid-cell, & .MuiDataGrid-columnHeaderTitle': {
        fontVariantNumeric:
          'tabular-nums',
      },

      // =====================================================
      // TÔ MÀU HẠN (dùng chung mọi bảng – theme/statusTones.ts)
      // Trễ hạn: đỏ · Sắp tới hạn: cam
      // Chữ dùng deadlineTextColor (đủ tương phản cả sáng lẫn tối)
      // =====================================================

      [`& .${DEADLINE_CELL_CLASS.overdue}`]: {
        color:
          `${deadlineTextColor(theme, 'overdue')} !important`,

        fontWeight: 700,

        backgroundColor:
          alpha(theme.palette.error.main, isDark ? 0.14 : 0.07),
      },

      [`& .${DEADLINE_CELL_CLASS.dueSoon}`]: {
        color:
          `${deadlineTextColor(theme, 'dueSoon')} !important`,

        fontWeight: 700,

        backgroundColor:
          alpha(theme.palette.warning.main, isDark ? 0.14 : 0.08),
      },

      // =====================================================
      // CỘT GHIM (sticky, xem ReusableDataGrid)
      // Nền phải đặc: nền kính trong suốt sẽ lộ chữ của cột cuộn bên dưới
      // =====================================================

      '& .MuiDataGrid-cell.app-pinned': {
        position: 'sticky',

        zIndex: 3,

        backgroundColor:
          pinnedBackground,
      },

      '& .MuiDataGrid-row:nth-of-type(even) .MuiDataGrid-cell.app-pinned': {
        backgroundColor:
          pinnedBackgroundAlt,
      },

      '& .MuiDataGrid-row:hover .MuiDataGrid-cell.app-pinned': {
        backgroundColor:
          pinnedBackgroundHover,
      },

      '& .MuiDataGrid-columnHeader.app-pinned': {
        position: 'sticky',

        zIndex: 5,

        background:
          `${pinnedHeaderBackground} !important`,
      },

      // Cột ghim cuối: đường viền + bóng báo hiệu phía sau còn cột đang cuộn
      '& .app-pinned-last': {
        borderRight:
          `1px solid ${alpha(accent, isDark ? 0.35 : 0.28)} !important`,

        boxShadow:
          isDark
            ? '4px 0 8px -4px rgba(0,0,0,0.55)'
            : '4px 0 8px -4px rgba(15,23,42,0.18)',
      },

      // =====================================================
      // EDIT CELL
      // =====================================================

      '& .MuiDataGrid-cell--editing': {
        // Solid fill instead of a second blur nested inside the grid's own
        // blur: same look over the grid body, no extra GPU layer per edit
        backgroundColor:
          isDark
            ? '#111827 !important'
            : '#FFFFFF !important',

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

import { alpha, type PaletteMode } from '@mui/material/styles'

/*
 * DESIGN TOKEN – MÀU (đề xuất 8)
 *
 * Một chỗ duy nhất giữ màu nền tảng của app cho cả 2 chế độ. Theme MUI
 * (dashboardTheme.ts), kính của panel (glassPanelSx), toast, bảng DataGrid…
 * đọc màu từ đây thay vì tự ghi mã màu.
 *
 * Dùng trong code:
 *   sx={(theme) => ({ bgcolor: theme.app.surface.panel })}      // trong sx
 *   const c = appTokens(theme.palette.mode)                       // trong hàm style
 *
 * Quy tắc:
 *   - Màu chữ / nền chung: dùng palette MUI (text.primary, background.paper,
 *     divider…) trước; token này cho phần palette không có (kính, bóng, viền…).
 *   - Màu trạng thái cho chữ: statusTextColor() (statusTones.ts).
 *   - KHÔNG đưa vào đây màu minh hoạ (mascot, màn đăng nhập, kho 3D, bảng LED,
 *     bản vẽ Machine Locator): chúng cố định, không theo sáng / tối.
 *   - Đổi giá trị ở đây là đổi cả app: kiểm tra cả 2 chế độ.
 */

const light = {
  /** Màu gốc của palette MUI */
  base: {
    primary: '#2563eb',
    pageBg: '#eef3f8',
    paper: '#ffffff',
    textPrimary: '#172033',
    textSecondary: '#64748b',
    divider: 'rgba(71, 85, 105, 0.16)',
  },

  /** Nền các lớp "kính" (từ thấp tới cao: panel < card = dialog < toast) */
  surface: {
    panel: 'rgba(255,255,255,0.76)',
    card: 'rgba(255,255,255,0.88)',
    dialog: 'rgba(255,255,255,0.88)',
    toast: 'rgba(255,255,255,0.96)',
  },

  /** Viền sáng của lớp kính */
  surfaceBorder: {
    panel: 'rgba(255,255,255,0.72)',
    dialog: 'rgba(255,255,255,0.78)',
  },

  shadow: {
    /** panel, card */
    surface: '0 8px 24px rgba(15,23,42,0.08)',
    dialog: '0 20px 50px rgba(15,23,42,0.14)',
    toast: '0 12px 32px rgba(15,23,42,0.16)',
  },

  /** Ô nhập, nút icon, chip */
  control: {
    inputBg: 'rgba(255,255,255,0.72)',
    inputBorder: 'rgba(15,23,42,0.10)',
    inputBorderHover: 'rgba(15,23,42,0.18)',
    iconButtonBg: 'rgba(255,255,255,0.58)',
    iconButtonBgHover: 'rgba(255,255,255,0.82)',
    chipBg: 'rgba(255,255,255,0.60)',
    /** viền nút icon + chip */
    border: 'rgba(71,85,105,0.12)',
  },

  /** Màu chữ trạng thái khi palette không đủ tương phản (statusTones.ts) */
  statusText: {
    warning: '#c2410c',
  },

  /** DataGrid mặc định của theme (bảng không dùng dataGridHeaderSx) */
  gridBase: {
    text: '#243047',
    bg: '#ffffff',
    rowBorder: 'rgba(71,85,105,0.14)',
    headerBg: '#eef3f8',
    headerBorder: 'rgba(71,85,105,0.16)',
    rowAlt: '#f8fafc',
    rowHover: '#eef5ff',
    rowSelected: '#dbeafe',
    footerBg: '#f6f8fb',
    footerBorder: 'rgba(71,85,105,0.16)',
    scrollTrack: '#e5eaf0',
    scrollThumb: '#aab5c4',
    scrollThumbHover: '#8392a7',
  },

  /** Bảng kính dùng chung (dataGridHeaderSx – Backlog, Fac Confirm, Shipment…) */
  grid: {
    accent: '#4F74B8',
    border: alpha('#334155', 0.10),
    headerBg: alpha('#F8FAFC', 0.95),
    bodyBg: alpha('#FFFFFF', 0.52),
    rowBg: alpha('#FFFFFF', 0.34),
    rowAltBg: alpha('#F8FAFC', 0.32),
    headerHover: alpha('#0F172A', 0.045),
    separator: alpha('#334155', 0.11),
    headerText: '#1E293B',
    pinnedBg: '#fbfcfe',
    pinnedAltBg: '#f6f8fb',
    pinnedHoverBg: '#eef3fb',
    pinnedHeaderBg: '#F8FAFC',
    editingBg: '#FFFFFF',
  },
}

export type AppTokens = typeof light

const dark: AppTokens = {
  base: {
    primary: '#60a5fa',
    pageBg: '#0b1220',
    paper: '#111b2d',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    divider: 'rgba(148, 163, 184, 0.16)',
  },

  surface: {
    panel: 'rgba(17,27,45,0.78)',
    card: 'rgba(17,27,45,0.9)',
    dialog: 'rgba(17,27,45,0.88)',
    toast: 'rgba(17,27,45,0.94)',
  },

  surfaceBorder: {
    panel: 'rgba(255,255,255,0.10)',
    dialog: 'rgba(255,255,255,0.11)',
  },

  shadow: {
    surface: '0 8px 24px rgba(0,0,0,0.18)',
    dialog: '0 20px 50px rgba(0,0,0,0.30)',
    toast: '0 12px 32px rgba(0,0,0,0.42)',
  },

  control: {
    inputBg: 'rgba(255,255,255,0.045)',
    inputBorder: 'rgba(255,255,255,0.10)',
    inputBorderHover: 'rgba(255,255,255,0.18)',
    iconButtonBg: 'rgba(255,255,255,0.045)',
    iconButtonBgHover: 'rgba(255,255,255,0.08)',
    chipBg: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.09)',
  },

  statusText: {
    // tối: dùng warning.main của palette (đủ tương phản) – xem statusTones.ts
    warning: '#ffa726',
  },

  gridBase: {
    text: '#dbe7f8',
    bg: '#101a2b',
    rowBorder: 'rgba(148,163,184,0.14)',
    headerBg: '#17243a',
    headerBorder: 'rgba(148,163,184,0.18)',
    rowAlt: '#121e31',
    rowHover: '#1b3150',
    rowSelected: '#1c3b61',
    footerBg: '#131f33',
    footerBorder: 'rgba(148,163,184,0.18)',
    scrollTrack: '#0d1625',
    scrollThumb: '#33445e',
    scrollThumbHover: '#49617f',
  },

  grid: {
    accent: '#7AA2F7',
    border: alpha('#FFFFFF', 0.10),
    headerBg: alpha('#111827', 0.94),
    bodyBg: alpha('#0F172A', 0.44),
    rowBg: alpha('#172033', 0.34),
    rowAltBg: alpha('#1E293B', 0.26),
    headerHover: alpha('#FFFFFF', 0.06),
    separator: alpha('#FFFFFF', 0.11),
    headerText: alpha('#FFFFFF', 0.94),
    pinnedBg: '#141d2e',
    pinnedAltBg: '#172235',
    pinnedHoverBg: '#1b2a45',
    pinnedHeaderBg: '#111827',
    editingBg: '#111827',
  },
}

export const colorTokens: Record<PaletteMode, AppTokens> = { light, dark }

/** Token màu theo chế độ (trong sx có sẵn ở theme.app) */
export function appTokens(mode: PaletteMode): AppTokens {
  return colorTokens[mode]
}

// theme.app = token của chế độ hiện tại (gắn trong createDashboardTheme)
declare module '@mui/material/styles' {
  interface Theme {
    app: AppTokens
  }
  interface ThemeOptions {
    app?: AppTokens
  }
}

import dayjs from 'dayjs'
import type { Theme } from '@mui/material/styles'

import { appTokens } from './colorTokens'

/**
 * Tô màu theo hạn – MỘT quy tắc cho mọi màn hình (bảng Backlog, Summary,
 * Shipment detail…):
 *
 *   overdue  (đỏ, theme error):   chưa xong và hạn là hôm nay hoặc đã qua
 *   dueSoon  (cam, theme warning): chưa xong và hạn trong DUE_SOON_DAYS ngày tới
 *
 * Đã xong (FINISHED…) thì không tô. Ô DataGrid dùng DEADLINE_CELL_CLASS
 * (style nằm trong dataGridHeaderSx).
 */

export type DeadlineTone = 'overdue' | 'dueSoon'

export const DUE_SOON_DAYS = 2

export const DEADLINE_CELL_CLASS: Record<DeadlineTone, string> = {
  overdue: 'app-cell--overdue',
  dueSoon: 'app-cell--due-soon',
}

/** YYYY-MM-DD từ chuỗi ngày / ngày giờ; ngày rỗng của SAP (1900-01-01) = null */
function toDateKey(value: unknown): string | null {
  if (typeof value !== 'string' || value.length < 10) return null

  const key = value.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(key) && !key.startsWith('1900-') ? key : null
}

export function deadlineTone(
  date: unknown,
  done: boolean,
  today: string = dayjs().format('YYYY-MM-DD'),
): DeadlineTone | null {
  if (done) return null

  const key = toDateKey(date)
  if (!key) return null

  if (key <= today) return 'overdue'

  const soon = dayjs(today).add(DUE_SOON_DAYS, 'day').format('YYYY-MM-DD')
  return key <= soon ? 'dueSoon' : null
}

/** Class cho ô DataGrid ('' nếu không tô) */
export function deadlineCellClass(date: unknown, done: boolean): string {
  const tone = deadlineTone(date, done)
  return tone ? DEADLINE_CELL_CLASS[tone] : ''
}

// =====================================================
// MÀU CHỮ ĐỌC ĐƯỢC CHO TÔNG TRẠNG THÁI
// =====================================================

export type StatusTone = 'error' | 'warning' | 'success' | 'info'

// Cam cho chữ: colorTokens statusText.warning. Sáng: cam đậm #c2410c (~4.6:1;
// warning.main #ed6c02 chỉ ~2.8:1 trên nền trắng). Tối: bằng warning.main.
// Viền / sọc / icon vẫn dùng warning.main.

/**
 * Màu CHỮ cho tông trạng thái, đủ tương phản (≥ 4.5:1) trên nền của app.
 * Chỉ dùng cho chữ; nền tô nhạt, viền, icon, sọc màu vẫn dùng palette[tone].main.
 *
 *   sáng: error.main · cam đậm · success.main · primary.main   (giữ như cũ trừ cam)
 *   tối:  error.light (đỏ main chỉ ~4.1:1 trên nền tối) · warning/success/primary .main
 */
export function statusTextColor(theme: Theme, tone: StatusTone): string {
  const dark = theme.palette.mode === 'dark'

  switch (tone) {
    case 'error': return dark ? theme.palette.error.light : theme.palette.error.main
    case 'warning': return appTokens(theme.palette.mode).statusText.warning
    case 'success': return theme.palette.success.main
    default: return theme.palette.primary.main
  }
}

/** Màu chữ của ô tô theo hạn */
export function deadlineTextColor(theme: Theme, tone: DeadlineTone): string {
  return statusTextColor(theme, tone === 'overdue' ? 'error' : 'warning')
}

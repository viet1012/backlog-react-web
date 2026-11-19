import dayjs from 'dayjs'

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

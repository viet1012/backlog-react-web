import dayjs from 'dayjs'

import type {
  MonitorChip,
  MonitorTone,
} from '../monitorTypes'

// nặng -> nhẹ (sắp danh sách / lỗi trong panel)
const STATUS_ORDER = ['OVERDUE', 'NG', 'OPEN', 'WAIT_HSE', 'SAFE']

// nhãn rõ nghĩa cho người xem (NG = HSE kiểm tra lại thấy chưa đạt)
export const HSE_STATUS_LABEL: Record<string, string> = {
  OVERDUE: 'Quá hạn',
  NG: 'HSE yêu cầu làm lại',
  OPEN: 'Chưa xử lý',
  WAIT_HSE: 'Chờ HSE duyệt',
  SAFE: 'An toàn',
}

export function hseStatusLabel(status: string): string {
  return HSE_STATUS_LABEL[status] ?? status
}

// trạng thái lạ: coi như chưa đóng
export function hseTone(status: string): MonitorTone {
  switch (status) {
    case 'OVERDUE': return 'critical'
    case 'WAIT_HSE': return 'warn'
    case 'SAFE': return 'ok'
    default: return 'bad'
  }
}

// số lớn = nặng hơn
export function hseSeverity(status: string): number {
  const i = STATUS_ORDER.indexOf(status)

  return i < 0 ? STATUS_ORDER.length - 2 : STATUS_ORDER.length - i
}

// chip trạng thái bằng chữ; OVERDUE kèm số ngày quá hạn, NG viền đứt
export function hseChip(status: string, lateDays = 0): MonitorChip {
  return {
    label: status === 'OVERDUE' && lateDays ? `Quá hạn ${lateDays} ngày` : hseStatusLabel(status),
    tone: hseTone(status),
    dashed: status === 'NG',
  }
}

export function isSafe(status: string | null | undefined): boolean {
  return status === 'SAFE'
}

// hạn đã qua (tính theo ngày) và lỗi chưa an toàn
export function isPastDue(dueDate: string | null | undefined, status: string): boolean {
  if (!dueDate || isSafe(status)) return false

  const d = dayjs(dueDate)

  return d.isValid() && d.isBefore(dayjs(), 'day')
}

// số ngày đã quá hạn (0 = chưa quá / không có hạn)
export function overdueDays(dueDate: string | null | undefined): number {
  if (!dueDate) return 0

  const d = dayjs(dueDate)

  return d.isValid() ? Math.max(0, dayjs().startOf('day').diff(d.startOf('day'), 'day')) : 0
}

// ngày giờ hiển thị; không parse được thì giữ chuỗi gốc
export function formatHseDate(value: string | null | undefined): string {
  if (!value) return ''

  const d = dayjs(value)

  if (!d.isValid()) return value

  return d.format(d.hour() || d.minute() ? 'DD/MM/YYYY HH:mm' : 'DD/MM/YYYY')
}

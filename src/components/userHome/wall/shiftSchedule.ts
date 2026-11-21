/*
 * Giờ ca hành chính (Nội quy lao động, Điều 19) cho thanh đầu trang chủ.
 * Sáng 08:00–12:00, chiều 13:00–17:00; giải lao 10:00–10:10 và 15:35–15:45; nghỉ trưa 12:00–13:00.
 * 48 giờ/tuần, 8 giờ/ngày => làm thứ Hai đến thứ Bảy.
 * Nội quy có thể đổi giờ: chỉ cần sửa OFFICE_DAY / WORK_DAYS ở đây.
 */
export type SegmentKind = 'work' | 'break' | 'lunch'

export interface DaySegment {
  kind: SegmentKind
  // Phút tính từ 0h
  start: number
  end: number
}

const hm = (h: number, m = 0) => h * 60 + m

export const OFFICE_DAY: DaySegment[] = [
  { kind: 'work', start: hm(8), end: hm(10) },
  { kind: 'break', start: hm(10), end: hm(10, 10) },
  { kind: 'work', start: hm(10, 10), end: hm(12) },
  { kind: 'lunch', start: hm(12), end: hm(13) },
  { kind: 'work', start: hm(13), end: hm(15, 35) },
  { kind: 'break', start: hm(15, 35), end: hm(15, 45) },
  { kind: 'work', start: hm(15, 45), end: hm(17) },
]

// Date.getDay(): 0 = Chủ nhật
export const WORK_DAYS = new Set([1, 2, 3, 4, 5, 6])

// Không đếm ngược tới giờ nghỉ khi đang làm; chỉ đếm ngược lúc đang giải lao / nghỉ trưa
export type ShiftState =
  | { kind: 'work' | 'before' }
  | { kind: 'break' | 'lunch'; endsAt: number; leftSeconds: number }
  | { kind: 'after' | 'dayOff'; nextDay: Date }

export interface ShiftNow {
  state: ShiftState
  dayStart: number
  dayEnd: number
}

const pad = (n: number) => String(n).padStart(2, '0')

// 495 -> "08:15"
export function clockLabel(minutes: number) {
  return `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`
}

// Đồng hồ đếm ngược: 372 giây -> "06:12"
export function formatCountdown(seconds: number) {
  const s = Math.max(0, Math.ceil(seconds))
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
}

function nextWorkDay(now: Date, workDays: Set<number>) {
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  for (let i = 1; i <= 7; i++) {
    day.setDate(day.getDate() + 1)
    if (workDays.has(day.getDay())) return new Date(day)
  }
  return day
}

export function getShiftNow(now: Date, segments: DaySegment[] = OFFICE_DAY, workDays: Set<number> = WORK_DAYS): ShiftNow {
  const dayStart = segments[0].start
  const dayEnd = segments[segments.length - 1].end
  const second = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
  const base = { dayStart, dayEnd }

  if (!workDays.has(now.getDay())) {
    return { ...base, state: { kind: 'dayOff', nextDay: nextWorkDay(now, workDays) } }
  }
  if (second < dayStart * 60) {
    return { ...base, state: { kind: 'before' } }
  }

  const segment = segments.find((item) => second >= item.start * 60 && second < item.end * 60)
  if (!segment) {
    return { ...base, state: { kind: 'after', nextDay: nextWorkDay(now, workDays) } }
  }
  if (segment.kind === 'work') {
    return { ...base, state: { kind: 'work' } }
  }
  return { ...base, state: { kind: segment.kind, endsAt: segment.end, leftSeconds: segment.end * 60 - second } }
}

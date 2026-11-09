import type { CostDetailDailyRow } from '../../types/costMonitoring'

export type DailySortKey = keyof CostDetailDailyRow
export type SortDir = 'asc' | 'desc'

// số ngày có chi tối thiểu để thống kê "bất thường" có nghĩa
const MIN_SPEND_DAYS = 5
// ngày chi > trung bình + k·độ lệch chuẩn (chỉ tính các ngày có chi) → bất thường
const SIGMA_K = 2

// Trả tập ngày ("YYYY-MM-DD") chi cao bất thường
export function findAbnormalDays(rows: CostDetailDailyRow[]): Set<string> {
  const spend = rows.flatMap((r) => (r.daily != null && r.daily > 0 ? [{ date: r.date, amount: r.daily }] : []))

  if (spend.length < MIN_SPEND_DAYS) return new Set()

  const mean = spend.reduce((sum, r) => sum + r.amount, 0) / spend.length
  const variance = spend.reduce((sum, r) => sum + (r.amount - mean) ** 2, 0) / spend.length
  const threshold = mean + SIGMA_K * Math.sqrt(variance)

  return new Set(spend.filter((r) => r.amount > threshold).map((r) => r.date))
}

// null luôn nằm cuối, bất kể chiều sort
export function sortDaily(rows: CostDetailDailyRow[], key: DailySortKey, dir: SortDir) {
  const sign = dir === 'asc' ? 1 : -1

  return [...rows].sort((a, b) => {
    const va = a[key]
    const vb = b[key]

    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb) * sign
    return ((va as number) - (vb as number)) * sign
  })
}

export function formatNum(value: number | null | undefined, digits = 1) {
  return value == null ? '–' : value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

// +1.2 / -0.5 – dùng cho chênh lệch
export function formatSigned(value: number | null | undefined, digits = 1) {
  if (value == null) return '–'
  return `${value > 0 ? '+' : ''}${formatNum(value, digits)}`
}

export function formatPct(value: number | null | undefined, digits = 0) {
  return value == null ? '–' : `${value.toFixed(digits)}%`
}

// Ratio Sale&Inven: +5.3% / -1.2%
export function formatSignedPct(value: number | null | undefined, digits = 1) {
  return value == null ? '–' : `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`
}

import dayjs from 'dayjs'
import type { CostChart } from '../../types/costMonitoring'
import type { CostSeriesKey } from './costChartConfig'

export type CostChartRow = {
  date: string
  label: string
  // estMtd nối tiếp từ điểm actual cuối – chỉ dùng để vẽ, tooltip vẫn đọc estMtd
  estLine: number | null
} & Record<CostSeriesKey, number | null>

// 1 dòng / ngày trong tháng. Ngày không có point thì null (không vẽ, không coi là 0).
export function buildRows(month: string | null, chart: CostChart): CostChartRow[] {
  const byDate = new Map(
    chart.points.map((p) => [dayjs(p.date).format('YYYY-MM-DD'), p]),
  )

  const start = month ? dayjs(`${month}-01`) : null
  const dates = start?.isValid()
    ? Array.from({ length: start.daysInMonth() }, (_, i) => start.add(i, 'day').format('YYYY-MM-DD'))
    : [...byDate.keys()].sort()

  const rows = dates.map((date): CostChartRow => {
    const p = byDate.get(date)

    return {
      date,
      label: dayjs(date).format('D/M'),
      fcTgt: chart.fcTgt,
      plTgt: chart.plTgt,
      fluctTgt: p?.fluctTgt ?? null,
      actMtd: p?.actMtd ?? null,
      estMtd: p?.estMtd ?? null,
      estLine: p?.estMtd ?? null,
    }
  })

  const lastAct = lastIndexOf(rows, 'actMtd')

  if (lastAct >= 0 && rows[lastAct].estLine == null && rows.slice(lastAct + 1).some((r) => r.estMtd != null)) {
    rows[lastAct].estLine = rows[lastAct].actMtd
  }

  return rows
}

export function lastIndexOf(rows: CostChartRow[], key: CostSeriesKey) {
  for (let i = rows.length - 1; i >= 0; i--) if (rows[i][key] != null) return i

  return -1
}

export function lastValue(rows: CostChartRow[], key: CostSeriesKey) {
  const i = lastIndexOf(rows, key)

  return i >= 0 ? rows[i][key] : null
}

// Tick trục X: ngày 1, 5, 10, 15, 20, 25 và ngày cuối tháng
export function buildXTicks(rows: CostChartRow[]): string[] {
  const last = rows.length - 1

  return rows
    .filter((r, i) => i === last || [1, 5, 10, 15, 20, 25].includes(dayjs(r.date).date()))
    .map((r) => r.label)
}

// Bước nhỏ nhất trong dãy 1-2-2.5-5 ≥ raw → luôn ra 3–4 khoảng (4–5 tick) khi raw = target / 4
function niceStep(raw: number) {
  const mag = 10 ** Math.floor(Math.log10(raw))
  const norm = raw / mag

  return ([1, 2, 2.5, 5, 10].find((s) => s >= norm) ?? 10) * mag
}

// Trục Y: 0 → max × 1.1 làm tròn lên số đẹp
export function buildYAxis(rows: CostChartRow[], chart: CostChart) {
  const values = [
    chart.estMonthEnd,
    chart.actMtdLatest,
    ...rows.flatMap((r) => [r.fcTgt, r.plTgt, r.fluctTgt, r.actMtd, r.estMtd]),
  ].filter((v): v is number => v != null && Number.isFinite(v))

  const target = Math.max(0, ...values) * 1.1

  if (target <= 0) return { max: 1, ticks: [0, 0.25, 0.5, 0.75, 1] }

  const step = niceStep(target / 4)
  const count = Math.ceil(target / step)
  const ticks = Array.from({ length: count + 1 }, (_, i) => Number((i * step).toFixed(6)))

  return { max: ticks[ticks.length - 1], ticks }
}

// Tránh chồng nhãn đơn giản: xếp theo y, nhãn cách nhãn trước < gap px thì đẩy xuống
export function spreadLabels<T extends { y: number }>(labels: T[], gap = 14): T[] {
  const sorted = [...labels].sort((a, b) => a.y - b.y)

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].y - sorted[i - 1].y < gap) {
      sorted[i] = { ...sorted[i], y: sorted[i - 1].y + gap }
    }
  }

  return sorted
}

export type CostStatusLevel = 'ok' | 'watch' | 'over'

export type CostStatus =
  | { level: CostStatusLevel; ratio: number }
  // cả tháng chưa có actual (vd OT) → Estimate chỉ là kế hoạch, không đánh giá %
  | { level: 'noActual'; ratio: null }

// So giá trị cuối (Est, không có thì Act) với target (Fluct, không có thì FC)
export function getCostStatus(chart: CostChart, rows: CostChartRow[]): CostStatus | null {
  if (chart.actMtdLatest == null && lastIndexOf(rows, 'actMtd') < 0) {
    return { level: 'noActual', ratio: null }
  }

  const final = chart.estMonthEnd ?? chart.actMtdLatest
  const target = lastValue(rows, 'fluctTgt') ?? chart.fcTgt

  if (final == null || target == null || target <= 0) return null

  const ratio = (final / target) * 100
  const level: CostStatusLevel = ratio <= 100 ? 'ok' : ratio <= 105 ? 'watch' : 'over'

  return { ratio, level }
}

/** % đã dùng vượt tiến độ chuẩn quá ngưỡng này (điểm %) → badge OK đổi màu cảnh báo */
export const PACE_TOLERANCE = 3

export interface CostPace {
  /** Actual mới nhất / target (Fluct, không có thì FC) × 100 */
  usedPct: number
  /** tiến độ chuẩn: ngày có actual mới nhất / số ngày trong tháng × 100 */
  elapsedPct: number
  ahead: boolean
}

// Tiến độ chi tiêu so với thời gian đã qua trong tháng
export function getCostPace(chart: CostChart, rows: CostChartRow[]): CostPace | null {
  const lastAct = lastIndexOf(rows, 'actMtd')
  if (lastAct < 0) return null

  const used = rows[lastAct].actMtd
  const target = lastValue(rows, 'fluctTgt') ?? chart.fcTgt
  if (used == null || target == null || target <= 0) return null

  const day = dayjs(rows[lastAct].date)
  if (!day.isValid()) return null

  const usedPct = (used / target) * 100
  const elapsedPct = (day.date() / day.daysInMonth()) * 100

  return { usedPct, elapsedPct, ahead: usedPct > elapsedPct + PACE_TOLERANCE }
}

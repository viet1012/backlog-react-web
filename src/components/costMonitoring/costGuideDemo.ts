import type { CostChart } from '../../types/costMonitoring'
import { buildRows, getCostStatus, type CostChartRow } from './costChartUtils'
import { EXAMPLE_DEMO, type ExampleValues } from './costMonitoringGuide'

export type DemoRow = CostChartRow & { plMtd: number }

// Ví dụ tiền chợ tại ngày d (1 → số ngày trong tháng). Dựng CostChart giả để
// chip / badge / tag / mũi tên dùng lại đúng logic của chart thật.
//   PL MTD(x)   = PL × x / n
//   Estimate(x) = Actual(d) + PL × (x − d) / n, với x > d; d = n thì không có Estimate
export function buildExampleDemo(day: number) {
  const { actual, pl, fc, fluct, bp, month, daysInMonth: n } = EXAMPLE_DEMO
  const act = actual[day - 1]
  const plMtdAt = (x: number) => (pl * x) / n
  const estEnd = day < n ? act + (pl * (n - day)) / n : null

  const chart: CostChart = {
    div: 'PR',
    chart: 'T&SL',
    fcTgt: fc,
    plTgt: pl,
    bp,
    actMtdLatest: act,
    estMonthEnd: estEnd,
    points: Array.from({ length: n }, (_, i) => {
      const x = i + 1

      return {
        date: `${month}-${String(x).padStart(2, '0')}`,
        plMtd: plMtdAt(x),
        actMtd: x <= day ? actual[i] : null,
        estMtd: x > day ? act + (pl * (x - day)) / n : null,
        fluctTgt: fluct,
      }
    }),
  }

  const rows: DemoRow[] = buildRows(month, chart).map((r, i) => ({ ...r, plMtd: plMtdAt(i + 1) }))

  // badge: giá trị cuối (Estimate, hết tháng thì Actual) / Fluct – cùng hàm với chart thật
  const status = getCostStatus(chart, rows)
  const final = estEnd ?? act
  const ratio = status && status.level !== 'noActual' ? status.ratio : (final / fluct) * 100
  const level = status && status.level !== 'noActual' ? status.level : 'ok'

  const values: ExampleValues = {
    day,
    daysInMonth: n,
    pl,
    fc,
    fluct,
    act,
    plMtd: plMtdAt(day),
    diff: act - plMtdAt(day),
    estEnd,
    final,
    ratio,
    level,
  }

  return { chart, rows, values }
}

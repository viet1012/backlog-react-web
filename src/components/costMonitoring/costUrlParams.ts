import type { UrlParam, UrlParams } from '../../hooks/useUrlFilters'
import type { CostDetailTarget, CostSimuWeek } from '../../types/costMonitoring'
import { COST_COLUMNS, COST_ROWS } from './costChartConfig'

/*
 * Trạng thái trang Cost Monitoring trên URL, ví dụ
 *   /cost-monitoring?month=2026-10&week=2&frame=press-tsl
 *
 *   month  tháng đang xem (YYYY-MM; API dùng "2026.10"). Luôn ghi khi đã biết tháng,
 *          để link gửi đi mở đúng tháng kể cả khi đã có tháng mới hơn.
 *   week   tuần PL simulation 1–5; không có = "Mới nhất (tự động)"
 *   frame  khung đang xem chi tiết (chế độ focus); không có = lưới 9 chart
 */

export const COST_PATH = '/cost-monitoring'

export interface CostUrlState {
  /** "2026.10"; '' = mới nhất */
  month: string
  week: CostSimuWeek
  /** slug khung, vd "press-tsl"; '' = lưới 9 chart */
  frame: string
}

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/

/** "press-tsl" ⇄ { div: 'PR', chart: 'T&SL' } */
export function frameSlug(target: CostDetailTarget): string {
  const row = COST_ROWS.find((r) => r.div === target.div)
  return `${(row?.label ?? target.div).toLowerCase()}-${target.chart.replace(/[^A-Za-z]/g, '').toLowerCase()}`
}

export function frameFromSlug(slug: string | undefined): CostDetailTarget | null {
  if (!slug) return null

  for (const row of COST_ROWS) {
    for (const chart of COST_COLUMNS) {
      const target = { div: row.div, chart }
      if (frameSlug(target) === slug.toLowerCase()) return target
    }
  }

  return null
}

const monthParam: UrlParam<string> = {
  key: 'month',
  parse: (raw) => (MONTH_RE.test(raw) ? raw.replace('-', '.') : undefined),
  format: (value) => value.replace('.', '-'),
  empty: '',
}

const weekParam: UrlParam<CostSimuWeek> = {
  key: 'week',
  parse: (raw) => (/^[1-5]$/.test(raw) ? `Simu_W${raw}` as CostSimuWeek : undefined),
  format: (value) => value.replace('Simu_W', ''),
  empty: '',
}

const frameParam: UrlParam<string> = {
  key: 'frame',
  parse: (raw) => (frameFromSlug(raw) ? raw.toLowerCase() : undefined),
  format: (value) => value,
  empty: '',
}

export const COST_URL_PARAMS: UrlParams<CostUrlState> = {
  month: monthParam,
  week: weekParam,
  frame: frameParam,
}

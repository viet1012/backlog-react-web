import type {
  CostChartType,
  CostDiv,
  CostSimuWeek,
} from '../../types/costMonitoring'

// Hàng / cột của lưới 3×3 – thứ tự giống file Excel "KVH Cost Monitoring"
export const COST_ROWS: { div: CostDiv; label: string }[] = [
  { div: 'PR', label: 'PRESS' },
  { div: 'MO', label: 'MOLD' },
  { div: 'Guide', label: 'GUIDE' },
]

export const COST_COLUMNS: CostChartType[] = ['OT', 'T&SL', 'RM']

export const SIMU_WEEK_OPTIONS: { value: CostSimuWeek; label: string }[] = [
  { value: '', label: 'Mới nhất (tự động)' },
  { value: 'Simu_W1', label: 'Tuần 1' },
  { value: 'Simu_W2', label: 'Tuần 2' },
  { value: 'Simu_W3', label: 'Tuần 3' },
  { value: 'Simu_W4', label: 'Tuần 4' },
  { value: 'Simu_W5', label: 'Tuần 5' },
]

export type CostSeriesKey = 'fcTgt' | 'plTgt' | 'fluctTgt' | 'actMtd' | 'estMtd'

export interface CostSeriesConfig {
  key: CostSeriesKey
  label: string
  color: string
  // màu Excel gốc quá tối trên nền tối
  darkColor?: string
  strokeWidth: number
  dash?: string
}

// Màu + thứ tự legend theo chart Excel.
// FC và PL thường sát nhau → FC nét đứt dài, PL liền & dày hơn để phân biệt
export const COST_SERIES: CostSeriesConfig[] = [
  { key: 'fcTgt', label: 'FC TGT', color: '#595959', darkColor: '#A6A6A6', strokeWidth: 1.5, dash: '8 4' },
  { key: 'actMtd', label: 'Actual (MTD)', color: '#4472C4', darkColor: '#6F9BEA', strokeWidth: 2.5 },
  { key: 'estMtd', label: 'Estimate (MTD)', color: '#4472C4', darkColor: '#6F9BEA', strokeWidth: 1.5, dash: '4 3' },
  { key: 'plTgt', label: 'PL TGT', color: '#70AD47', strokeWidth: 2.5 },
  { key: 'fluctTgt', label: 'Fluctuating TGT', color: '#C00000', darkColor: '#FF5C5C', strokeWidth: 2.5 },
]

// Badge trạng thái dạng pill: nền nhạt + viền + chữ màu (không nền đặc)
export type CostBadgeLevel = 'ok' | 'watch' | 'over' | 'noActual'

export const STATUS_BADGE: Record<CostBadgeLevel, { bg: string; fg: string }> = {
  ok: { bg: '#F0FDF4', fg: '#15803D' },
  watch: { bg: '#FFFBEB', fg: '#B45309' },
  over: { bg: '#FEF2F2', fg: '#B91C1C' },
  noActual: { bg: '#F1F5F9', fg: '#64748B' },
}

// Nền tối: màu chữ sáng hơn, nền dùng alpha của chữ (tính ở nơi dùng)
export const STATUS_BADGE_DARK_FG: Record<CostBadgeLevel, string> = {
  ok: '#4ADE80',
  watch: '#FBBF24',
  over: '#F87171',
  noActual: '#94A3B8',
}

export const TABULAR_NUMS = { fontVariantNumeric: 'tabular-nums' } as const

export function seriesColor(series: CostSeriesConfig, dark: boolean) {
  return dark && series.darkColor ? series.darkColor : series.color
}

export function seriesColorOf(key: CostSeriesKey, dark: boolean) {
  return seriesColor(COST_SERIES.find((s) => s.key === key)!, dark)
}

export function formatK(value: number | null | undefined) {
  return value == null ? '–' : value.toFixed(1)
}

import dayjs from 'dayjs'

// =========================================================
// KHOẢNG NGÀY "LỊCH SỬ" (vd lịch sử an toàn): preset tương đối theo hôm nay hoặc tuỳ chọn
// Lưu preset (không lưu ngày) để "Tháng này" luôn là tháng hiện tại khi mở lại
// =========================================================

export type RangePreset = 'month' | 'lastMonth' | '3months' | 'year' | 'all'

export interface MonitorRange {
  preset: RangePreset | 'custom'
  // YYYY-MM-DD, chỉ dùng khi preset = custom
  from: string | null
  to: string | null
}

export const RANGE_PRESETS: { id: RangePreset, label: string }[] = [
  { id: 'month', label: 'Tháng này' },
  { id: 'lastMonth', label: 'Tháng trước' },
  { id: '3months', label: '3 tháng gần đây' },
  { id: 'year', label: 'Năm nay' },
  { id: 'all', label: 'Tất cả' },
]

export const presetRange = (preset: RangePreset): MonitorRange => ({ preset, from: null, to: null })

const ISO = 'YYYY-MM-DD'

// ngày từ / đến (YYYY-MM-DD, gồm cả 2 đầu); null = không giới hạn
export function resolveRange(r: MonitorRange): { from: string | null, to: string | null } {
  const today = dayjs()

  switch (r.preset) {
    case 'month': return { from: today.startOf('month').format(ISO), to: today.format(ISO) }
    case 'lastMonth': {
      const m = today.subtract(1, 'month')

      return { from: m.startOf('month').format(ISO), to: m.endOf('month').format(ISO) }
    }
    case '3months': return { from: today.subtract(3, 'month').format(ISO), to: today.format(ISO) }
    case 'year': return { from: today.startOf('year').format(ISO), to: today.format(ISO) }
    case 'all': return { from: null, to: null }
    default: return { from: r.from, to: r.to }
  }
}

// nhãn trên nút: "01/10 – 27/10/2026"; khác năm thì ghi đủ năm 2 đầu; "Tất cả" -> "Tất cả thời gian"
export function rangeLabel(r: MonitorRange): string {
  const { from, to } = resolveRange(r)

  if (!from && !to) return 'Tất cả thời gian'

  const f = from ? dayjs(from) : null
  const t = to ? dayjs(to) : null

  if (f && t) return `${f.format(f.year() === t.year() ? 'DD/MM' : 'DD/MM/YYYY')} – ${t.format('DD/MM/YYYY')}`
  if (f) return `Từ ${f.format('DD/MM/YYYY')}`

  return `Đến ${t!.format('DD/MM/YYYY')}`
}

// đọc lại từ preference; sai dạng -> null
export function parseRange(v: unknown): MonitorRange | null {
  if (!v || typeof v !== 'object') return null

  const r = v as Partial<MonitorRange>
  const isDate = (s: unknown) => typeof s === 'string' && dayjs(s, ISO).isValid()

  if (RANGE_PRESETS.some((p) => p.id === r.preset)) return presetRange(r.preset as RangePreset)

  if (r.preset === 'custom' && (isDate(r.from) || isDate(r.to))) {
    return { preset: 'custom', from: isDate(r.from) ? r.from! : null, to: isDate(r.to) ? r.to! : null }
  }

  return null
}

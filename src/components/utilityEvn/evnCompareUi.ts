import { alpha, type Theme } from '@mui/material/styles'
import type { UtilityScopeCode } from '../../types/utilityEvn'
import type { EvnPctTone } from '../../utils/utilityEvnCompare'

export const TABULAR_NUMS = { fontVariantNumeric: 'tabular-nums' } as const

// Ngày partial (đồng hồ mất dữ liệu)
export const EVN_PARTIAL_COLOR = '#f97316'

// Màu 2 chuỗi Excel / Thực tế – đã chạy validate_palette (light + dark: PASS)
const EVN_SERIES_COLORS = {
  light: { excel: '#2563EB', actual: '#059669' },
  dark: { excel: '#3B82F6', actual: '#059669' },
} as const

export function evnSeriesColors(theme: Theme): { excel: string; actual: string } {
  return EVN_SERIES_COLORS[theme.palette.mode === 'dark' ? 'dark' : 'light']
}

// Màu nhận diện 3 phạm vi (chế độ Tổng quan) – tránh trùng xanh Excel / xanh lá Thực tế / cam partial
// và màu trạng thái; đã chạy validate_palette --pairs all (light + dark: PASS)
const EVN_SCOPE_COLORS: Record<'light' | 'dark', Record<UtilityScopeCode, string>> = {
  light: { KVH: '#6250d6', FAC_AB: '#d55181', FAC_C: '#0891b2' },
  dark: { KVH: '#9085e9', FAC_AB: '#d55181', FAC_C: '#0891b2' },
}

export function evnScopeColors(theme: Theme): Record<UtilityScopeCode, string> {
  return EVN_SCOPE_COLORS[theme.palette.mode === 'dark' ? 'dark' : 'light']
}

export function evnGridStroke(theme: Theme): string {
  return theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
}

export function evnAxisTick(theme: Theme) {
  return { fontSize: 11, fill: theme.palette.text.secondary, style: TABULAR_NUMS }
}

export function evnToneColor(theme: Theme, tone: EvnPctTone | null): string {
  if (tone === 'ok') return theme.palette.success.main
  if (tone === 'warn') return theme.palette.warning.main
  if (tone === 'bad') return theme.palette.error.main
  return theme.palette.text.primary
}

export function evnToneTint(theme: Theme, tone: EvnPctTone | null): string | null {
  if (tone === null) return null
  return alpha(evnToneColor(theme, tone), theme.palette.mode === 'dark' ? 0.2 : 0.12)
}

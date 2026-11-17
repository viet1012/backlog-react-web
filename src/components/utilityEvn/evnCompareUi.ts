import { alpha, type Theme } from '@mui/material/styles'
import type { EvnPctTone } from '../../utils/utilityEvnCompare'

export const TABULAR_NUMS = { fontVariantNumeric: 'tabular-nums' } as const

// Ngày partial (đồng hồ mất dữ liệu)
export const EVN_PARTIAL_COLOR = '#f97316'

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

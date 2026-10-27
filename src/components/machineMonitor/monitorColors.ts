import type { MonitorTone } from './monitorTypes'

// Màu theo mức: quá hạn đỏ đậm, chưa xử lý / NG đỏ cam, chờ HSE vàng amber
export const toneColors: Record<MonitorTone, { light: string, dark: string }> = {
  critical: { light: '#b42318', dark: '#f97066' },
  bad: { light: '#e5533d', dark: '#f38b74' },
  warn: { light: '#d99a0b', dark: '#f5b83d' },
  ok: { light: '#2b7d50', dark: '#5ec48c' },
  none: { light: '#6e7874', dark: '#8b9692' },
}

export function toneColor(tone: MonitorTone, dark: boolean): string {
  return dark ? toneColors[tone].dark : toneColors[tone].light
}

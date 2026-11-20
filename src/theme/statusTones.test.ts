import { getContrastRatio } from '@mui/material/styles'
import { describe, expect, it } from 'vitest'

import { appTokens } from './colorTokens'
import { createDashboardTheme } from './dashboardTheme'
import {
  DEADLINE_CELL_CLASS,
  deadlineCellClass,
  deadlineTone,
  statusTextColor,
  type StatusTone,
} from './statusTones'

const TODAY = '2026-11-20'

describe('deadlineTone', () => {
  it('trễ hạn: hạn là hôm nay hoặc đã qua', () => {
    expect(deadlineTone('2026-11-20', false, TODAY)).toBe('overdue')
    expect(deadlineTone('2026-11-01T08:00:00', false, TODAY)).toBe('overdue')
  })

  it('sắp tới hạn: trong 2 ngày tới', () => {
    expect(deadlineTone('2026-11-21', false, TODAY)).toBe('dueSoon')
    expect(deadlineTone('2026-11-22', false, TODAY)).toBe('dueSoon')
    expect(deadlineTone('2026-11-23', false, TODAY)).toBeNull()
  })

  it('đã xong thì không tô', () => {
    expect(deadlineTone('2026-11-01', true, TODAY)).toBeNull()
  })

  it('ngày rỗng của SAP (1900-01-01), sai định dạng, không phải chuỗi: không tô', () => {
    expect(deadlineTone('1900-01-01', false, TODAY)).toBeNull()
    expect(deadlineTone('20/11/2026', false, TODAY)).toBeNull()
    expect(deadlineTone(null, false, TODAY)).toBeNull()
    expect(deadlineTone(20261120, false, TODAY)).toBeNull()
  })

  it('deadlineCellClass trả class tương ứng hoặc chuỗi rỗng', () => {
    expect(deadlineCellClass('1900-01-01', false)).toBe('')
    expect(deadlineCellClass('2000-01-01', false)).toBe(DEADLINE_CELL_CLASS.overdue)
  })
})

// Chữ thường cần ≥ 4.5:1 (WCAG AA). Nền đặc chính của app: paper và nền trang.
const MIN_CONTRAST = 4.5
const TONES: StatusTone[] = ['error', 'warning', 'success', 'info']

describe.each(['light', 'dark'] as const)('màu chữ – chế độ %s', (mode) => {
  const theme = createDashboardTheme(mode)
  const c = appTokens(mode)
  const backgrounds = { paper: c.base.paper, pageBg: c.base.pageBg }

  it.each(TONES)('statusTextColor(%s) đủ tương phản trên paper và nền trang', (tone) => {
    const color = statusTextColor(theme, tone)

    for (const bg of Object.values(backgrounds)) {
      expect(getContrastRatio(color, bg)).toBeGreaterThanOrEqual(MIN_CONTRAST)
    }
  })

  it('chữ chính / phụ đủ tương phản trên paper', () => {
    expect(getContrastRatio(c.base.textPrimary, c.base.paper)).toBeGreaterThanOrEqual(MIN_CONTRAST)
    expect(getContrastRatio(c.base.textSecondary, c.base.paper)).toBeGreaterThanOrEqual(MIN_CONTRAST)
  })

  it('theme.app chính là token của chế độ đó', () => {
    // createTheme sao chép sâu options → so nội dung
    expect(theme.app).toStrictEqual(c)
    expect(theme.palette.background.default).toBe(c.base.pageBg)
  })
})

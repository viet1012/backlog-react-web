import { describe, expect, it } from 'vitest'

import { buildSearch } from '../../hooks/useUrlFilters'
import { COST_COLUMNS, COST_ROWS } from './costChartConfig'
import { COST_URL_PARAMS, frameFromSlug, frameSlug, type CostUrlState } from './costUrlParams'

describe('frameSlug / frameFromSlug', () => {
  it('9 khung đều đổi qua lại được, slug không trùng', () => {
    const slugs = new Set<string>()

    for (const row of COST_ROWS) {
      for (const chart of COST_COLUMNS) {
        const target = { div: row.div, chart }
        const slug = frameSlug(target)

        expect(frameFromSlug(slug)).toEqual(target)
        slugs.add(slug)
      }
    }

    expect(slugs.size).toBe(COST_ROWS.length * COST_COLUMNS.length)
  })

  it('slug dễ đọc, không có ký tự cần mã hoá', () => {
    expect(frameSlug({ div: 'PR', chart: 'T&SL' })).toBe('press-tsl')
    expect(frameSlug({ div: 'Guide', chart: 'RM' })).toBe('guide-rm')
  })

  it('không phân biệt hoa thường; slug lạ / rỗng = null', () => {
    expect(frameFromSlug('MOLD-OT')).toEqual({ div: 'MO', chart: 'OT' })
    expect(frameFromSlug('abc')).toBeNull()
    expect(frameFromSlug('')).toBeNull()
    expect(frameFromSlug(undefined)).toBeNull()
  })
})

describe('COST_URL_PARAMS', () => {
  it('month: URL YYYY-MM ⇄ API "YYYY.MM"', () => {
    expect(COST_URL_PARAMS.month.parse('2026-10')).toBe('2026.10')
    expect(COST_URL_PARAMS.month.parse('2026-13')).toBeUndefined()
    expect(COST_URL_PARAMS.month.format('2026.10')).toBe('2026-10')
  })

  it('week: 1–5 ⇄ Simu_W1–5', () => {
    expect(COST_URL_PARAMS.week.parse('2')).toBe('Simu_W2')
    expect(COST_URL_PARAMS.week.parse('6')).toBeUndefined()
    expect(COST_URL_PARAMS.week.format('Simu_W4')).toBe('4')
  })

  it('link đầy đủ; tuần "mới nhất" và lưới 9 chart không ghi', () => {
    expect(buildSearch<CostUrlState>(COST_URL_PARAMS, { month: '2026.10', week: 'Simu_W2', frame: 'press-tsl' }, ''))
      .toBe('?month=2026-10&week=2&frame=press-tsl')

    expect(buildSearch<CostUrlState>(COST_URL_PARAMS, { month: '2026.10', week: '', frame: '' }, ''))
      .toBe('?month=2026-10')
  })
})

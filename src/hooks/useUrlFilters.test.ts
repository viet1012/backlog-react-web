import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildSearch, readUrlParams, urlParam, type UrlParams } from './useUrlFilters'

describe('urlParam', () => {
  it('date: chỉ nhận YYYY-MM-DD hợp lệ', () => {
    const p = urlParam.date('d')

    expect(p.parse('2026-11-19')).toBe('2026-11-19')
    expect(p.parse('2026-13-45')).toBeUndefined()
    expect(p.parse('19/11/2026')).toBeUndefined()
    expect(p.parse('')).toBeUndefined()
  })

  it('month: chỉ nhận YYYY-MM', () => {
    const p = urlParam.month('m')

    expect(p.parse('2026-10')).toBe('2026-10')
    expect(p.parse('2026.10')).toBeUndefined()
  })

  it('oneOf: không phân biệt hoa thường, trả đúng giá trị khai báo', () => {
    const p = urlParam.oneOf('div', ['PR', 'MO'] as const)

    expect(p.parse('pr')).toBe('PR')
    expect(p.parse('XX')).toBeUndefined()
  })

  it('list: bỏ giá trị lạ, giữ thứ tự khai báo khi ghi', () => {
    const p = urlParam.list('c', ['Sale', 'Stock', 'Other'] as const, [])

    expect(p.parse('Stock,XX,Sale')).toEqual(['Sale', 'Stock'])
    expect(p.parse('XX')).toBeUndefined()
    expect(p.format(['Other', 'Sale'])).toBe('Sale,Other')
  })

  it('positiveNumber: chỉ số dương', () => {
    const p = urlParam.positiveNumber('n')

    expect(p.parse('42')).toBe(42)
    expect(p.parse('0')).toBeUndefined()
    expect(p.parse('-1')).toBeUndefined()
    expect(p.parse('abc')).toBeUndefined()
  })

  it('text: cắt còn 200 ký tự, bỏ khoảng trắng khi ghi', () => {
    const p = urlParam.text('q')

    expect(p.parse('x'.repeat(300))).toHaveLength(200)
    expect(p.format('  abc  ')).toBe('abc')
  })
})

interface Filters {
  q: string
  div: 'PR' | 'MO'
  classify: ('Sale' | 'Stock')[]
}

const PARAMS: UrlParams<Filters> = {
  q: urlParam.text('q'),
  div: urlParam.oneOf('div', ['PR', 'MO'] as const),
  classify: urlParam.list('classify', ['Sale', 'Stock'] as const, []),
}

describe('buildSearch', () => {
  it('giá trị bằng "empty" thì không ghi; không có empty thì luôn ghi', () => {
    expect(buildSearch<Filters>(PARAMS, { q: '', div: 'PR', classify: [] }, '')).toBe('?div=PR')
  })

  it('giữ tham số lạ đang có trên URL', () => {
    expect(buildSearch<Filters>(PARAMS, { q: 'abc', div: 'MO', classify: [] }, '?vitals=1&q=old'))
      .toBe('?vitals=1&q=abc&div=MO')
  })

  it('dấu phẩy để nguyên cho link dễ đọc', () => {
    expect(buildSearch<Filters>(PARAMS, { q: '', div: 'PR', classify: ['Sale', 'Stock'] }, ''))
      .toBe('?div=PR&classify=Sale,Stock')
  })

  it('xoá tham số của trang khi về giá trị empty', () => {
    expect(buildSearch<Filters>(PARAMS, { q: '', div: 'PR', classify: [] }, '?q=abc&classify=Sale'))
      .toBe('?div=PR')
  })
})

describe('readUrlParams', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function stubLocation(pathname: string, search: string) {
    vi.stubGlobal('window', { location: { pathname, search } })
  }

  it('chỉ đọc khi đúng trang (bỏ dấu / cuối)', () => {
    stubLocation('/fac-confirm/', '?div=MO&q=abc')
    expect(readUrlParams('/fac-confirm', PARAMS)).toEqual({ div: 'MO', q: 'abc' })

    stubLocation('/backlog', '?div=MO')
    expect(readUrlParams('/fac-confirm', PARAMS)).toEqual({})
  })

  it('bỏ qua giá trị sai, giữ giá trị đúng', () => {
    stubLocation('/fac-confirm', '?div=XX&classify=Stock')
    expect(readUrlParams('/fac-confirm', PARAMS)).toEqual({ classify: ['Stock'] })
  })
})

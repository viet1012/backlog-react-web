import { describe, expect, it } from 'vitest'
import { tableToHtml, tableToTsv } from './clipboard'

describe('tableToTsv', () => {
  it('joins cells with tabs and rows with CRLF', () => {
    expect(tableToTsv([['a', 'b'], ['1', '2']])).toBe('a\tb\r\n1\t2')
  })

  it('flattens tabs / newlines inside a cell so columns stay aligned', () => {
    expect(tableToTsv([['x\ty', 'line1\nline2']])).toBe('x y\tline1 line2')
  })
})

describe('tableToHtml', () => {
  it('escapes cell content and renders header / body / footer', () => {
    const html = tableToHtml(['Đồng hồ'], [['<M1> & "x"']], [['Tổng']])
    expect(html).toContain('&lt;M1&gt; &amp; &quot;x&quot;')
    expect(html).toContain('<thead>')
    expect(html).toContain('<tfoot>')
    expect(html).toContain('Đồng hồ')
  })

  it('omits tfoot when there is no footer', () => {
    expect(tableToHtml(['a'], [['1']])).not.toContain('<tfoot>')
  })
})

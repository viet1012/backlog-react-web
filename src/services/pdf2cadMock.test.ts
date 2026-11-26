import { describe, expect, it } from 'vitest'
import { buildPartDrawing, previewToDxf } from './pdf2cadDrawing'
import { pdf2cadMockApi } from './pdf2cadMock'

describe('pdf2cad mock bot', () => {
  it('chào khi gửi câu rỗng, kèm gợi ý', async () => {
    const r = await pdf2cadMockApi.bot({ template: 'dsjc-b', session: null, message: '', lang: 'vi' })
    expect(r.session).toBeTruthy()
    expect(r.text).toContain('DSJC-B')
    expect(r.chips?.length).toBeGreaterThan(0)
    expect(r.output).toBeUndefined()
  })

  it('thiếu khoá thì hỏi lại, trả lời ngắn được hiểu theo câu hỏi trước rồi vẽ', async () => {
    const first = await pdf2cadMockApi.bot({ template: 'dsjc-b', session: null, message: 'No.16', lang: 'vi' })
    expect(first.text).toContain('Còn thiếu **L**')
    expect(first.output).toBeUndefined()

    const second = await pdf2cadMockApi.bot({ template: 'dsjc-b', session: first.session, message: '80', lang: 'vi' })
    expect(second.output).toBe('DSJC-B16-80.dxf')
    expect(second.text).toContain('No.16 L=80')

    const preview = await pdf2cadMockApi.preview(second.job!, second.output!)
    expect(preview.count).toBeGreaterThan(20)

    // sửa tương đối: tăng L thêm 10 → báo thay đổi
    const third = await pdf2cadMockApi.bot({ template: 'dsjc-b', session: first.session, message: 'tăng L thêm 10', lang: 'vi' })
    expect(third.output).toBe('DSJC-B16-90.dxf')
    expect(third.text).toContain('L 80 → 90')
  })

  it('giá trị ngoài bảng: cảnh báo nhưng vẫn vẽ', async () => {
    const r = await pdf2cadMockApi.bot({ template: 'splb-b', session: null, message: 'D=20 L=400', lang: 'en' })
    expect(r.output).toBeTruthy()
    expect(r.text_en).toContain('⚠ L=400')
  })
})

describe('pdf2cad drawing', () => {
  it('chọn tỷ lệ cho vừa A4 và xuất DXF hợp lệ', () => {
    expect(buildPartDrawing({ D: 16, L: 80, title: 'T', drawingNo: 'N' }).scale).toBe(1)
    const big = buildPartDrawing({ D: 30, L: 400, H: 36, T: 8, title: 'T', drawingNo: 'N' })
    expect(big.scale).toBe(5)

    const dxf = previewToDxf(big.preview)
    expect(dxf.startsWith('0\nSECTION\n2\nENTITIES')).toBe(true)
    expect(dxf.endsWith('0\nENDSEC\n0\nEOF')).toBe(true)
    expect(dxf).toContain('%%c30')
  })
})

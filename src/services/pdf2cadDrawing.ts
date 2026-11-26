import type { DxfLayerData, DxfPreview } from '../types/pdf2cad'

// =========================================================
// Bản vẽ chi tiết trụ / trụ có mũ (A4 ngang, mm) – dùng cho dữ liệu mẫu khi
// chưa nối BE: xem trước DXF, ảnh "PDF gốc" (SVG) và file .dxf tải về.
// =========================================================

export interface PartSpec {
  /** đường kính thân */
  D: number
  /** chiều dài toàn bộ */
  L: number
  /** đường kính mũ (có mũ khi có cả H và T) */
  H?: number
  /** chiều dày mũ */
  T?: number
  /** lỗ (nét khuất) từ mặt cuối thân: đường kính + chiều sâu */
  hole?: { d: number; depth: number; label: string }
  title: string
  drawingNo: string
  material?: string
  /** bản scan: chữ ở layer TEXT_OCR / TEXT_CHECK, có ký hiệu sửa đổi, nét RASTER */
  scan?: boolean
}

const SHEET_W = 297
const SHEET_H = 210
const SCALES = [1, 2, 2.5, 5, 10]

function emptyLayer(): DxfLayerData {
  return { l: [], c: [], a: [], p: [], t: [], f: [] }
}

const r2 = (v: number) => Math.round(v * 100) / 100

export function fmtMm(v: number) {
  return String(r2(v))
}

export function buildPartDrawing(spec: PartSpec): { preview: DxfPreview; scale: number } {
  const layers: Record<string, DxfLayerData> = {}
  const layer = (name: string) => (layers[name] ??= emptyLayer())

  const line = (name: string, x1: number, y1: number, x2: number, y2: number) =>
    layer(name).l.push([r2(x1), r2(y1), r2(x2), r2(y2)])
  const text = (name: string, x: number, y: number, h: number, s: string, rot = 0) =>
    layer(name).t.push([r2(x), r2(y), h, rot, 1, s])
  const arrow = (x: number, y: number, dx: number, dy: number) => {
    // mũi tên tô đặc, đầu nhọn tại (x, y), hướng (dx, dy)
    const len = 2.6
    const half = 0.55
    const bx = x - dx * len
    const by = y - dy * len
    layer('DIM').f!.push([
      [r2(x), r2(y)],
      [r2(bx - dy * half), r2(by + dx * half)],
      [r2(bx + dy * half), r2(by - dx * half)],
    ])
  }

  const hasHead = spec.H != null && spec.T != null && spec.T > 0
  const maxDia = Math.max(spec.D, hasHead ? spec.H! : 0)
  const k = SCALES.find((s) => spec.L / s <= 150 && maxDia / s <= 70) ?? 20
  const L = spec.L / k
  const D = spec.D / k
  const H = hasHead ? spec.H! / k : D
  const T = hasHead ? spec.T! / k : 0

  // ---- khung + khung tên ----
  line('FRAME', 0, 0, SHEET_W, 0)
  line('FRAME', SHEET_W, 0, SHEET_W, SHEET_H)
  line('FRAME', SHEET_W, SHEET_H, 0, SHEET_H)
  line('FRAME', 0, SHEET_H, 0, 0)
  line('OUTLINE', 10, 10, 287, 10)
  line('OUTLINE', 287, 10, 287, 200)
  line('OUTLINE', 287, 200, 10, 200)
  line('OUTLINE', 10, 200, 10, 10)
  line('THIN', 177, 10, 177, 42)
  line('THIN', 177, 42, 287, 42)
  line('THIN', 177, 31, 287, 31)
  line('THIN', 177, 20, 287, 20)
  line('THIN', 232, 10, 232, 31)

  const txt = spec.scan ? 'TEXT_OCR' : 'TEXT'
  text(txt, 179, 37.5, 2, 'TITLE')
  text(txt, 192, 34, 3.5, spec.title)
  text(txt, 179, 27, 2, 'DRAWING NO.')
  text(txt, 179, 22.5, 3, spec.drawingNo)
  text(txt, 234, 27, 2, 'SCALE')
  text(spec.scan ? 'TEXT_CHECK' : txt, 234, 22.5, 3, `1:${k}`)
  text(txt, 179, 16, 2, 'MATERIAL')
  text(txt, 179, 12, 3, spec.material ?? 'SKD11')
  text(txt, 234, 16, 2, 'UNIT')
  text(txt, 234, 12, 3, 'mm')

  // ---- hình chiếu đứng ----
  const x0 = 28
  const ay = 128
  const x1 = x0 + T
  const x2 = x0 + L
  const c = Math.min(0.8, D * 0.08)

  if (hasHead) {
    line('OUTLINE', x0, ay - H / 2, x0, ay + H / 2)
    line('OUTLINE', x0, ay + H / 2, x1, ay + H / 2)
    line('OUTLINE', x0, ay - H / 2, x1, ay - H / 2)
    line('OUTLINE', x1, ay + H / 2, x1, ay - H / 2)
  } else {
    line('OUTLINE', x0, ay - D / 2, x0, ay + D / 2)
  }
  line('OUTLINE', x1, ay + D / 2, x2 - c, ay + D / 2)
  line('OUTLINE', x1, ay - D / 2, x2 - c, ay - D / 2)
  line('OUTLINE', x2 - c, ay + D / 2, x2, ay + D / 2 - c)
  line('OUTLINE', x2 - c, ay - D / 2, x2, ay - D / 2 + c)
  line('OUTLINE', x2, ay + D / 2 - c, x2, ay - D / 2 + c)
  line('THIN', x2 - c, ay + D / 2, x2 - c, ay - D / 2)
  line('CENTER', x0 - 6, ay, x2 + 6, ay)

  if (spec.hole) {
    const hd = spec.hole.d / k
    const depth = Math.min(spec.hole.depth / k, L)
    line('HIDDEN', x2, ay + hd / 2, x2 - depth, ay + hd / 2)
    line('HIDDEN', x2, ay - hd / 2, x2 - depth, ay - hd / 2)
    if (depth < L) line('HIDDEN', x2 - depth, ay + hd / 2, x2 - depth, ay - hd / 2)
  }

  // ---- kích thước ----
  const dimTxt = spec.scan ? 'TEXT_OCR' : 'DIM'
  // L (dưới)
  const yL = ay - Math.max(H, D) / 2 - 12
  line('DIM', x0, ay - H / 2 - 2, x0, yL - 2)
  line('DIM', x2, ay - D / 2 - 2, x2, yL - 2)
  line('DIM', x0, yL, x2, yL)
  arrow(x0, yL, -1, 0)
  arrow(x2, yL, 1, 0)
  text(dimTxt, (x0 + x2) / 2 - 3, yL + 1, 3, fmtMm(spec.L))

  // ØD (dọc, bên phải)
  const xD = x2 + 10
  line('DIM', x2 + 2, ay + D / 2, xD + 2, ay + D / 2)
  line('DIM', x2 + 2, ay - D / 2, xD + 2, ay - D / 2)
  line('DIM', xD, ay - D / 2, xD, ay + D / 2)
  arrow(xD, ay + D / 2, 0, 1)
  arrow(xD, ay - D / 2, 0, -1)
  text(dimTxt, xD - 1, ay - 4, 3, `Ø${fmtMm(spec.D)}`, 90)

  if (hasHead) {
    // ØH (dọc, bên trái)
    const xH = x0 - 10
    line('DIM', x0 - 2, ay + H / 2, xH - 2, ay + H / 2)
    line('DIM', x0 - 2, ay - H / 2, xH - 2, ay - H / 2)
    line('DIM', xH, ay - H / 2, xH, ay + H / 2)
    arrow(xH, ay + H / 2, 0, 1)
    arrow(xH, ay - H / 2, 0, -1)
    text(dimTxt, xH - 1, ay - 4, 3, `Ø${fmtMm(spec.H!)}`, 90)

    // T (trên)
    const yT = ay + H / 2 + 8
    line('DIM', x0, ay + H / 2 + 2, x0, yT + 2)
    line('DIM', x1, ay + H / 2 + 2, x1, yT + 2)
    line('DIM', x0 - 6, yT, x1 + 6, yT)
    arrow(x0, yT, 1, 0)
    arrow(x1, yT, -1, 0)
    text(dimTxt, x1 + 7, yT - 1.2, 3, fmtMm(spec.T!))
  }

  if (spec.hole) {
    const hd = spec.hole.d / k
    const lx = x2 - Math.min(spec.hole.depth / k, L) / 2
    line('DIM', lx, ay + hd / 2, lx + 8, ay + Math.max(H, D) / 2 + 10)
    line('DIM', lx + 8, ay + Math.max(H, D) / 2 + 10, lx + 30, ay + Math.max(H, D) / 2 + 10)
    arrow(lx, ay + hd / 2, -0.37, -0.93)
    text(dimTxt, lx + 9, ay + Math.max(H, D) / 2 + 11, 2.5, spec.hole.label)
  }

  // ---- hình chiếu cạnh ----
  const cx = 232
  const R = H / 2
  layer('OUTLINE').c.push([cx, ay, r2(R)])
  if (hasHead) layer('OUTLINE').c.push([cx, ay, r2(D / 2)])
  layer('THIN').a.push([cx, ay, r2(D / 2 - c), 20, 340])
  if (spec.hole) layer('OUTLINE').c.push([cx, ay, r2(spec.hole.d / k / 2)])
  line('CENTER', cx - R - 5, ay, cx + R + 5, ay)
  line('CENTER', cx, ay - R - 5, cx, ay + R + 5)

  // ---- ghi chú ----
  text(txt, 20, 62, 2.6, 'NOTES:')
  text(txt, 22, 57, 2.4, '1. UNSPECIFIED CHAMFER C0.5')
  text(txt, 22, 52.5, 2.4, '2. HARDNESS HRC58~62')
  text(spec.scan ? 'TEXT_CHECK' : txt, 22, 48, 2.4, '3. SURFACE Ra 0.8 (ALL OVER)')

  if (spec.scan) {
    // ký hiệu sửa đổi △1 (vẽ lại sạch) + vài nét xiên không nhận dạng được
    layer('REVISION').p.push([[150, 168], [156, 168], [153, 173.2], [150, 168]])
    text('REVISION', 152.2, 169, 2.5, '1')
    line('RASTER', 120, 180, 132, 188)
    line('RASTER', 124, 180, 136, 188)
    line('RASTER', 128, 180, 140, 188)
  }

  let count = 0
  for (const data of Object.values(layers)) {
    count += data.l.length + data.c.length + data.a.length + data.p.length + data.t.length + (data.f?.length ?? 0)
  }

  return { preview: { layers, count }, scale: k }
}

/** đếm thực thể theo loại DXF (cột "Đối tượng" của bảng kết quả) */
export function countEntities(preview: DxfPreview): Record<string, number> {
  const out = { LINE: 0, CIRCLE: 0, ARC: 0, POLYLINE: 0, TEXT: 0, SOLID: 0 }
  for (const data of Object.values(preview.layers)) {
    out.LINE += data.l.length
    out.CIRCLE += data.c.length
    out.ARC += data.a.length
    out.POLYLINE += data.p.length
    out.TEXT += data.t.length
    out.SOLID += data.f?.length ?? 0
  }
  return out
}

// =========================================================
// DXF (R12, chỉ section ENTITIES – AutoCAD / LibreCAD mở được)
// =========================================================

export function previewToDxf(preview: DxfPreview): string {
  const out: string[] = ['0', 'SECTION', '2', 'ENTITIES']
  const push = (...pairs: (string | number)[]) => out.push(...pairs.map(String))
  const dxfText = (s: string) => s.replace(/Ø/g, '%%c').replace(/±/g, '%%p')

  for (const [name, data] of Object.entries(preview.layers)) {
    for (const [x1, y1, x2, y2] of data.l) push(0, 'LINE', 8, name, 10, x1, 20, y1, 11, x2, 21, y2)
    for (const [x, y, r] of data.c) push(0, 'CIRCLE', 8, name, 10, x, 20, y, 40, r)
    for (const [x, y, r, a0, a1] of data.a) push(0, 'ARC', 8, name, 10, x, 20, y, 40, r, 50, a0, 51, a1)
    for (const pts of data.p) {
      for (let i = 1; i < pts.length; i++) {
        push(0, 'LINE', 8, name, 10, pts[i - 1][0], 20, pts[i - 1][1], 11, pts[i][0], 21, pts[i][1])
      }
    }
    for (const [x, y, h, rot, wf, s] of data.t) {
      push(0, 'TEXT', 8, name, 10, x, 20, y, 40, h, 1, dxfText(s), 50, rot, 41, wf)
    }
    for (const pts of data.f ?? []) {
      const [a, b, c] = pts
      if (!a || !b || !c) continue
      push(0, 'SOLID', 8, name, 10, a[0], 20, a[1], 11, b[0], 21, b[1], 12, c[0], 22, c[1], 13, c[0], 23, c[1])
    }
  }

  push(0, 'ENDSEC', 0, 'EOF')
  return out.join('\n')
}

// =========================================================
// "PDF gốc": vẽ lại trang dạng ảnh SVG (giấy trắng, nét đen; bản scan có mộc đỏ)
// =========================================================

const PX = 4

export function previewToSvgDataUrl(preview: DxfPreview, scan: boolean): string {
  const W = SHEET_W * PX
  const H = SHEET_H * PX
  const X = (x: number) => r2(x * PX)
  const Y = (y: number) => r2((SHEET_H - y) * PX)
  const parts: string[] = []
  const ink = scan ? '#2b2b2b' : '#111'

  for (const [name, data] of Object.entries(preview.layers)) {
    const width = name === 'OUTLINE' ? 2.2 : 1
    const dash = name === 'HIDDEN' ? ' stroke-dasharray="10 6"' : name === 'CENTER' ? ' stroke-dasharray="22 5 4 5"' : ''
    const stroke = `stroke="${ink}" stroke-width="${width}" fill="none"${dash}`

    for (const [x1, y1, x2, y2] of data.l) {
      parts.push(`<line x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}" ${stroke}/>`)
    }
    for (const [x, y, r] of data.c) parts.push(`<circle cx="${X(x)}" cy="${Y(y)}" r="${r2(r * PX)}" ${stroke}/>`)
    for (const [x, y, r, a0, a1] of data.a) {
      const p0 = [x + r * Math.cos((a0 * Math.PI) / 180), y + r * Math.sin((a0 * Math.PI) / 180)]
      const p1 = [x + r * Math.cos((a1 * Math.PI) / 180), y + r * Math.sin((a1 * Math.PI) / 180)]
      const large = (((a1 - a0) % 360) + 360) % 360 > 180 ? 1 : 0
      parts.push(`<path d="M${X(p0[0])} ${Y(p0[1])} A${r2(r * PX)} ${r2(r * PX)} 0 ${large} 0 ${X(p1[0])} ${Y(p1[1])}" ${stroke}/>`)
    }
    for (const pts of data.p) {
      parts.push(`<polyline points="${pts.map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')}" ${stroke}/>`)
    }
    for (const pts of data.f ?? []) {
      parts.push(`<polygon points="${pts.map(([x, y]) => `${X(x)},${Y(y)}`).join(' ')}" fill="${ink}"/>`)
    }
    for (const [x, y, h, rot, , s] of data.t) {
      const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
      parts.push(
        `<text x="${X(x)}" y="${Y(y)}" font-family="Arial, sans-serif" font-size="${r2(h * 1.38 * PX)}" fill="${ink}"` +
          `${rot ? ` transform="rotate(${-rot} ${X(x)} ${Y(y)})"` : ''}>${esc}</text>`,
      )
    }
  }

  if (scan) {
    // dấu mộc đỏ (bản DXF đã xoá) + nền giấy scan hơi ngả màu
    parts.push(
      `<g transform="rotate(-12 ${X(262)} ${Y(60)})" opacity="0.75">` +
        `<circle cx="${X(262)}" cy="${Y(60)}" r="${11 * PX}" stroke="#c62828" stroke-width="4" fill="none"/>` +
        `<text x="${X(262)}" y="${Y(58)}" text-anchor="middle" font-family="Arial" font-weight="700" font-size="${5 * PX}" fill="#c62828">SPC</text>` +
        `<text x="${X(262)}" y="${Y(64.5)}" text-anchor="middle" font-family="Arial" font-size="${2.6 * PX}" fill="#c62828">APR.2026</text>` +
        `</g>`,
    )
  }

  const bg = scan ? '#f3f0e8' : '#ffffff'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<rect width="${W}" height="${H}" fill="${bg}"/>${parts.join('')}</svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

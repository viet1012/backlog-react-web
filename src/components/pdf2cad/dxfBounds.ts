import type { DxfPreview } from '../../types/pdf2cad'

/** [xmin, ymin, xmax, ymax] theo toạ độ vẽ canvas (y đã lật: -y) */
export type Bbox = [number, number, number, number]

export function dxfBbox(preview: DxfPreview): Bbox {
  const b: Bbox = [1e18, 1e18, -1e18, -1e18]
  const ext = (x: number, y: number) => {
    if (x < b[0]) b[0] = x
    if (-y < b[1]) b[1] = -y
    if (x > b[2]) b[2] = x
    if (-y > b[3]) b[3] = -y
  }
  for (const L of Object.values(preview.layers)) {
    L.l.forEach(([a, c, e, f]) => {
      ext(a, c)
      ext(e, f)
    })
    L.c.forEach(([x, y, r]) => {
      ext(x - r, y - r)
      ext(x + r, y + r)
    })
    L.a.forEach(([x, y, r]) => {
      ext(x - r, y - r)
      ext(x + r, y + r)
    })
    L.p.forEach((p) => p.forEach(([x, y]) => ext(x, y)))
    L.t.forEach(([x, y]) => ext(x, y))
    for (const p of L.f ?? []) p.forEach(([x, y]) => ext(x, y))
  }
  return b[0] > b[2] ? [0, 0, 1, 1] : b
}

/** chữ mô tả bản xem trước DXF (tên, số đối tượng, khung mm) */
export function describePreview(
  name: string,
  preview: DxfPreview,
  dxfInfo: (n: string, c: number, w: string, h: string, tr?: boolean) => string,
) {
  const b = dxfBbox(preview)
  return dxfInfo(name, preview.count, (b[2] - b[0]).toFixed(1), (b[3] - b[1]).toFixed(1), preview.truncated)
}

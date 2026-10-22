import type {
  Polygon,
  RawBox,
} from '../types/machineLocator'

// =========================================================
// ÔM KHUNG SÁT MÁY THEO ẢNH LAYOUT
// Port của scripts/machine-locator/fit_frames.py (giữ nguyên thuật toán), TS thuần, chạy trong worker.
// Toạ độ ảnh: px = (pt - crop[0..1]) * ppp
// =========================================================

// Mặt nạ nét: 1 = điểm ảnh tối hơn ngưỡng (nét vẽ)
export interface InkMasks {
  w: number
  h: number
  // gray < 160: nét đậm
  ink160: Uint8Array
  // gray < 215: cả nét xám nhạt
  ink215: Uint8Array
}

export interface FitResult {
  // bbox mới (pt, 1 chữ số)
  b: RawBox
  // đường bao (pt)
  p: Polygon[]
}

// khung đổi quá ngần này pt so với khung vừa thả -> cần soát
export const FIT_REVIEW_SHIFT = 12

type Pt = [number, number]

const round1 = (v: number) => Math.round(v * 10) / 10

// Độ dời/đổi lớn nhất của 4 cạnh (pt), như fit_frames.py
export function fitShift(a: RawBox, b: RawBox): number {
  return Math.max(
    Math.abs(b[0] - a[0]),
    Math.abs(b[1] - a[1]),
    Math.abs(b[0] + b[2] - a[0] - a[2]),
    Math.abs(b[1] + b[3] - a[1] - a[3]),
  )
}

// =========================================================
// MẶT NẠ
// =========================================================

// RGBA -> 2 mặt nạ nét. Gray theo công thức số nguyên của OpenCV (IMREAD_GRAYSCALE)
export function writeInkMasks(
  rgba: Uint8ClampedArray,
  masks: InkMasks,
  offset: number,
): void {
  const { ink160, ink215 } = masks
  const n = rgba.length >> 2

  for (let i = 0, j = 0; i < n; i++, j += 4) {
    const g = (rgba[j] * 4899 + rgba[j + 1] * 9617 + rgba[j + 2] * 1868 + 8192) >> 14

    ink160[offset + i] = g < 160 ? 1 : 0
    ink215[offset + i] = g < 215 ? 1 : 0
  }
}

// =========================================================
// MORPHOLOGY (cửa sổ vuông (2r+1)², tách hàng rồi cột, O(n) theo số điểm ảnh)
// =========================================================

// 1 nếu cửa sổ quanh điểm có ít nhất 1 điểm = target (chỉ xét điểm trong ảnh)
function windowHas(src: Uint8Array, w: number, h: number, r: number, target: 0 | 1): Uint8Array {
  const rows = new Uint8Array(w * h)
  const out = new Uint8Array(w * h)

  for (let y = 0; y < h; y++) {
    const o = y * w
    let cnt = 0

    for (let k = 0; k <= r && k < w; k++) if (src[o + k] === target) cnt++

    for (let x = 0; x < w; x++) {
      rows[o + x] = cnt > 0 ? 1 : 0

      const add = x + r + 1
      const rem = x - r

      if (add < w && src[o + add] === target) cnt++
      if (rem >= 0 && src[o + rem] === target) cnt--
    }
  }

  for (let x = 0; x < w; x++) {
    let cnt = 0

    for (let k = 0; k <= r && k < h; k++) cnt += rows[k * w + x]

    for (let y = 0; y < h; y++) {
      out[y * w + x] = cnt > 0 ? 1 : 0

      const add = y + r + 1
      const rem = y - r

      if (add < h) cnt += rows[add * w + x]
      if (rem >= 0) cnt -= rows[rem * w + x]
    }
  }

  return out
}

// ngoài ảnh coi là 0 (như OpenCV)
function dilate(src: Uint8Array, w: number, h: number, r: number): Uint8Array {
  return windowHas(src, w, h, r, 1)
}

// ngoài ảnh coi là 1 (như OpenCV)
function erode(src: Uint8Array, w: number, h: number, r: number): Uint8Array {
  const z = windowHas(src, w, h, r, 0)

  for (let i = 0; i < z.length; i++) z[i] ^= 1

  return z
}

// =========================================================
// LẤP LỖ + GÁN NHÃN
// =========================================================

// = ndi.binary_fill_holes: nền (4-liên thông) không chạm mép vùng thì lấp
function fillHoles(src: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(w * h).fill(1)
  const stack = new Int32Array(w * h)
  let sp = 0

  const seed = (i: number) => {
    if (src[i] === 0 && out[i] === 1) {
      out[i] = 0
      stack[sp++] = i
    }
  }

  for (let x = 0; x < w; x++) {
    seed(x)
    seed((h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    seed(y * w)
    seed(y * w + w - 1)
  }

  while (sp) {
    const i = stack[--sp]
    const x = i % w

    if (x > 0) seed(i - 1)
    if (x < w - 1) seed(i + 1)
    if (i >= w) seed(i - w)
    if (i < w * (h - 1)) seed(i + w)
  }

  return out
}

const N4: Pt[] = [[1, 0], [-1, 0], [0, 1], [0, -1]]
const N8: Pt[] = [[1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1]]

interface Labels {
  lab: Int32Array
  n: number
  // area[k] = số điểm của nhãn k (k từ 1)
  area: number[]
  // điểm đầu tiên theo thứ tự quét (trên-trái nhất)
  first: number[]
}

function label(src: Uint8Array, w: number, h: number, nb: Pt[]): Labels {
  const lab = new Int32Array(w * h)
  const stack = new Int32Array(w * h)
  const area = [0]
  const first = [0]
  let n = 0

  for (let s = 0; s < src.length; s++) {
    if (!src[s] || lab[s]) continue

    n++
    lab[s] = n
    first.push(s)

    let sp = 0
    let cnt = 0

    stack[sp++] = s

    while (sp) {
      const i = stack[--sp]
      const x = i % w
      const y = (i - x) / w

      cnt++

      for (const [dx, dy] of nb) {
        const nx = x + dx
        const ny = y + dy

        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue

        const j = ny * w + nx

        if (src[j] && !lab[j]) {
          lab[j] = n
          stack[sp++] = j
        }
      }
    }

    area.push(cnt)
  }

  return { lab, n, area, first }
}

// =========================================================
// ĐƯỜNG BAO
// =========================================================

// Dò biên ngoài của nhãn id (Moore neighbor, điều kiện dừng Jacob), bắt đầu từ điểm trên-trái nhất.
// Hướng ngược chiều kim đồng hồ trên màn hình: E, NE, N, NW, W, SW, S, SE
function traceOuter(lab: Int32Array, w: number, h: number, id: number, start: number): Pt[] {
  const sx = start % w
  const sy = (start - sx) / w
  const out: Pt[] = [[sx, sy]]
  let x = sx
  let y = sy
  let dir = 7

  for (;;) {
    let found = false
    const from = dir % 2 === 0 ? (dir + 7) % 8 : (dir + 6) % 8

    for (let k = 0; k < 8; k++) {
      const d = (from + k) % 8
      const nx = x + N8[d][0]
      const ny = y + N8[d][1]

      if (nx >= 0 && ny >= 0 && nx < w && ny < h && lab[ny * w + nx] === id) {
        dir = d
        x = nx
        y = ny
        found = true
        break
      }
    }

    if (!found) return out

    out.push([x, y])

    const n = out.length - 1

    if (n >= 2 && out[n][0] === out[1][0] && out[n][1] === out[1][1]
      && out[n - 1][0] === out[0][0] && out[n - 1][1] === out[0][1]) {
      return out.slice(0, n - 1)
    }
  }
}

function polygonArea(pts: Pt[]): number {
  let a = 0

  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]
  }

  return Math.abs(a) / 2
}

function insidePolygon(p: Pt, poly: Pt[]): boolean {
  let inside = false

  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]

    if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) {
      inside = !inside
    }
  }

  return inside
}

// Khoảng cách từ p tới đường thẳng ab (như approxPolyDP)
function lineDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy)

  if (!len) return Math.hypot(p[0] - a[0], p[1] - a[1])

  return Math.abs(dx * (a[1] - p[1]) - dy * (a[0] - p[0])) / len
}

// Douglas–Peucker cho đường khép kín: chia ở 2 điểm xa nhau rồi rút gọn từng nửa
function simplifyClosed(pts: Pt[], eps: number): Pt[] {
  const n = pts.length

  if (n < 3) return pts

  const farthest = (from: number) => {
    let best = from
    let bd = -1

    for (let i = 0; i < n; i++) {
      const d = (pts[i][0] - pts[from][0]) ** 2 + (pts[i][1] - pts[from][1]) ** 2

      if (d > bd) {
        bd = d
        best = i
      }
    }

    return best
  }

  const i1 = farthest(0)
  const i2 = farthest(i1)
  // xoay để bắt đầu ở i1, nối thêm điểm đầu để khép kín
  const ring = [...pts.slice(i1), ...pts.slice(0, i1), pts[i1]]
  const split = (i2 - i1 + n) % n
  const keep = new Uint8Array(n + 1)
  const stack: [number, number][] = [[0, split], [split, n]]

  keep[0] = 1
  keep[split] = 1

  while (stack.length) {
    const [s, e] = stack.pop()!
    let best = -1
    let bd = eps

    for (let i = s + 1; i < e; i++) {
      const d = lineDist(ring[i], ring[s], ring[e])

      if (d > bd) {
        bd = d
        best = i
      }
    }

    if (best >= 0) {
      keep[best] = 1
      stack.push([s, best], [best, e])
    }
  }

  const out: Pt[] = []

  for (let i = 0; i < n; i++) if (keep[i]) out.push(ring[i])

  return out
}

// =========================================================
// FIT
// =========================================================

function fitWith(
  masks: InkMasks,
  ink: Uint8Array,
  b: RawBox,
  crop: readonly number[],
  ppp: number,
): FitResult | null {
  const { w: W, h: H } = masks
  const [cx0, cy0] = crop
  const [x, y, bw, bh] = b
  const X0 = (x - cx0) * ppp
  const Y0 = (y - cy0) * ppp
  const X1 = (x + bw - cx0) * ppp
  const Y1 = (y + bh - cy0) * ppp
  // vùng tìm: nới 25% mỗi chiều, tối thiểu 12 px
  const mx = Math.max(12, 0.25 * (X1 - X0))
  const my = Math.max(12, 0.25 * (Y1 - Y0))
  const a0 = Math.trunc(Math.max(0, X0 - mx))
  const b0 = Math.trunc(Math.max(0, Y0 - my))
  const a1 = Math.trunc(Math.min(W, X1 + mx))
  const b1 = Math.trunc(Math.min(H, Y1 + my))

  if (a1 - a0 < 10 || b1 - b0 < 10) return null

  const w = a1 - a0
  const h = b1 - b0
  const roi = new Uint8Array(w * h)

  for (let r = 0; r < h; r++) roi.set(ink.subarray((b0 + r) * W + a0, (b0 + r) * W + a1), r * w)

  // close 5×5 ×2 (= dilate 9×9 rồi erode 9×9) -> lấp lỗ -> open 7×7
  let img = erode(dilate(roi, w, h, 4), w, h, 4)

  img = fillHoles(img, w, h)
  img = dilate(erode(img, w, h, 3), w, h, 3)

  const comps = label(img, w, h, N4)

  if (!comps.n) return null

  // khung (theo vùng tìm), cắt như slice numpy
  const bx0 = Math.max(0, Math.min(w, Math.trunc(X0) - a0))
  const by0 = Math.max(0, Math.min(h, Math.trunc(Y0) - b0))
  const bx1 = Math.min(w, Math.trunc(X1) - a0)
  const by1 = Math.min(h, Math.trunc(Y1) - b0)
  const inside = new Array<number>(comps.n + 1).fill(0)

  for (let yy = by0; yy < by1; yy++) {
    for (let xx = bx0; xx < bx1; xx++) {
      const k = comps.lab[yy * w + xx]

      if (k) inside[k]++
    }
  }

  const A = (X1 - X0) * (Y1 - Y0)
  const kept = new Uint8Array(comps.n + 1)
  let keptArea = 0

  for (let k = 1; k <= comps.n; k++) {
    const area = comps.area[k]

    // khối thuộc máy: nằm phần lớn trong khung, hoặc là khối lớn phủ tâm khung
    if (area >= 0.02 * A && (inside[k] >= 0.6 * area || (inside[k] >= 0.25 * A && area <= 2.5 * A))) {
      kept[k] = 1
      keptArea += area
    }
  }

  if (keptArea < 0.2 * A) return null

  const keep = new Uint8Array(w * h)
  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1

  for (let i = 0; i < keep.length; i++) {
    if (!kept[comps.lab[i]]) continue

    keep[i] = 1

    const xx = i % w
    const yy = (i - xx) / w

    if (xx < minX) minX = xx
    if (xx > maxX) maxX = xx
    if (yy < minY) minY = yy
    if (yy > maxY) maxY = yy
  }

  // đường bao ngoài (như findContours RETR_EXTERNAL: khối 8-liên thông, bỏ khối nằm trong lỗ của khối khác)
  const blobs = label(keep, w, h, N8)
  const rings: Pt[][] = []

  for (let k = 1; k <= blobs.n; k++) rings.push(traceOuter(blobs.lab, w, h, k, blobs.first[k]))

  const toPt = (px: number, py: number): [number, number] =>
    [round1(px / ppp + cx0), round1(py / ppp + cy0)]
  const polys: Polygon[] = []

  rings.forEach((ring, k) => {
    if (rings.some((o, j) => j !== k && o.length >= 3 && insidePolygon(ring[0], o))) return
    if (polygonArea(ring) < 0.02 * A) return

    const c = simplifyClosed(ring, 2)

    if (c.length >= 3) polys.push(c.map(([px, py]) => toPt(a0 + px, b0 + py)))
  })

  if (!polys.length) return null

  const p0 = toPt(a0 + minX, b0 + minY)
  const p1 = toPt(a0 + maxX + 1, b0 + maxY + 1)

  return { b: [p0[0], p0[1], round1(p1[0] - p0[0]), round1(p1[1] - p0[1])], p: polys }
}

// Ôm 1 khung (pt): thử ngưỡng 160, không được thì 215; không nhận ra hình máy -> null
export function fitBox(
  masks: InkMasks,
  b: RawBox,
  crop: readonly number[],
  ppp: number,
): FitResult | null {
  return fitWith(masks, masks.ink160, b, crop, ppp)
    ?? fitWith(masks, masks.ink215, b, crop, ppp)
}

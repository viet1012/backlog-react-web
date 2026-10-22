import type {
  FitCandidate,
  FitMode,
  FitRecipe,
  FitResult,
  FitView,
  Polygon,
  RawBox,
} from '../types/machineLocator'

// =========================================================
// ÔM KHUNG SÁT MÁY THEO ẢNH LAYOUT (chạy trong worker)
// Gốc là scripts/machine-locator/fit_frames.py, thêm:
// - 3 kiểu ôm: tight (sát), hull (bao lồi), rect (chỉ thu khung b)
// - bỏ khối giống chữ / trùng chữ mã máy, làm trơn đường bao
// - tinh chỉnh theo công thức: cắt khối dính, bật / tắt khối (tính lại từ đầu mỗi lần)
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

export const FIT_MODES: FitMode[] = ['tight', 'hull', 'rect']

export const FIT_MODE_LABEL: Record<FitMode, string> = {
  tight: 'Sát',
  hull: 'Gọn',
  rect: 'Chữ nhật',
}

// khung đổi quá ngần này pt so với khung vừa thả -> cần soát
export const FIT_REVIEW_SHIFT = 12
// vùng tìm nới mỗi chiều (Shift khi thả: 0 = chỉ trong khung)
export const FIT_EXPAND = 0.1

// khối giống chữ: nét / diện tích bao < TEXT_FILL và cao < TEXT_MAX_H pt
const TEXT_FILL = 0.35
const TEXT_MAX_H = 4
// khối trùng chữ mã máy: phần bao của khối nằm trong ô chữ >= tỉ lệ này
const TEXT_OVERLAP = 0.6
// làm trơn đường bao "Sát": close 9×9, Douglas–Peucker ε, bỏ chỗ lõm nông hơn DENT_PT pt
const SMOOTH_R = 4
const DP_EPS = 3
const DENT_PT = 2
// viền khối ứng viên (chỉ để hiển thị)
const CAND_EPS = 1.5
// click / Alt+click lệch khỏi khối tối đa ngần này px
const PICK_R = 4

type Pt = [number, number]

const NO_VARIANTS: Record<FitMode, FitResult | null> = { tight: null, hull: null, rect: null }

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

function signedArea(pts: Pt[]): number {
  let a = 0

  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]
  }

  return a / 2
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

// Bỏ các đỉnh lõm nông hơn minDepth px (lặp tới khi hết)
function dropDents(poly: Pt[], minDepth: number): Pt[] {
  const out = poly.slice()
  const orient = Math.sign(signedArea(out))
  let changed = true

  while (changed && out.length > 3) {
    changed = false

    for (let i = 0; i < out.length && out.length > 3; i++) {
      const a = out[(i - 1 + out.length) % out.length]
      const c = out[i]
      const b = out[(i + 1) % out.length]
      const cross = (c[0] - a[0]) * (b[1] - c[1]) - (c[1] - a[1]) * (b[0] - c[0])

      if (cross && Math.sign(cross) !== orient && lineDist(c, a, b) < minDepth) {
        out.splice(i, 1)
        i--
        changed = true
      }
    }
  }

  return out
}

// Bao lồi của các điểm ảnh (theo góc điểm ảnh) – monotone chain
function convexHull(keep: Uint8Array, w: number, h: number): Pt[] {
  const pts: Pt[] = []

  for (let y = 0; y < h; y++) {
    let x0 = -1
    let x1 = -1

    for (let x = 0; x < w; x++) {
      if (!keep[y * w + x]) continue
      if (x0 < 0) x0 = x
      x1 = x
    }

    if (x0 >= 0) pts.push([x0, y], [x0, y + 1], [x1 + 1, y], [x1 + 1, y + 1])
  }

  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1])

  if (pts.length < 3) return pts

  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower: Pt[] = []
  const upper: Pt[] = []

  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]

    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }

  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}

// Đường bao ngoài các khối của mask (như findContours RETR_EXTERNAL:
// khối 8-liên thông, bỏ khối nằm trong lỗ của khối khác)
function outerRings(mask: Uint8Array, w: number, h: number): Pt[][] {
  const blobs = label(mask, w, h, N8)
  const rings: Pt[][] = []

  for (let k = 1; k <= blobs.n; k++) rings.push(traceOuter(blobs.lab, w, h, k, blobs.first[k]))

  return rings.filter((ring, k) =>
    !rings.some((o, j) => j !== k && o.length >= 3 && insidePolygon(ring[0], o)))
}

// =========================================================
// VÙNG TÌM + KHỐI
// =========================================================

interface Roi {
  a0: number
  b0: number
  w: number
  h: number
  // khung theo px ảnh
  X0: number
  Y0: number
  X1: number
  Y1: number
  // diện tích khung (px²)
  A: number
  ink: Uint8Array
}

interface Comp {
  area: number
  x0: number
  y0: number
  x1: number
  y1: number
  // số điểm nằm trong khung
  inside: number
  // số điểm nét gốc thuộc khối
  inkCnt: number
  text: boolean
}

interface Analysis {
  roi: Roi
  lab: Int32Array
  first: number[]
  comps: Comp[]
  // on[k]: khối k đang dùng
  on: Uint8Array
  // tự chọn được (tổng khối chọn >= 20% khung)
  recognized: boolean
}

function makeRoi(masks: InkMasks, ink: Uint8Array, b: RawBox, crop: readonly number[], ppp: number, expand: number): Roi | null {
  const { w: W, h: H } = masks
  const [cx0, cy0] = crop
  const [x, y, bw, bh] = b
  const X0 = (x - cx0) * ppp
  const Y0 = (y - cy0) * ppp
  const X1 = (x + bw - cx0) * ppp
  const Y1 = (y + bh - cy0) * ppp
  // vùng tìm: nới expand mỗi chiều (tối thiểu 12 px); expand = 0: đúng khung
  const mx = expand > 0 ? Math.max(12, expand * (X1 - X0)) : 0
  const my = expand > 0 ? Math.max(12, expand * (Y1 - Y0)) : 0
  const a0 = Math.trunc(Math.max(0, X0 - mx))
  const b0 = Math.trunc(Math.max(0, Y0 - my))
  const a1 = Math.trunc(Math.min(W, X1 + mx))
  const b1 = Math.trunc(Math.min(H, Y1 + my))

  if (a1 - a0 < 10 || b1 - b0 < 10) return null

  const w = a1 - a0
  const h = b1 - b0
  const roi = new Uint8Array(w * h)

  for (let r = 0; r < h; r++) roi.set(ink.subarray((b0 + r) * W + a0, (b0 + r) * W + a1), r * w)

  return { a0, b0, w, h, X0, Y0, X1, Y1, A: (X1 - X0) * (Y1 - Y0), ink: roi }
}

// Điểm của mask gần (x, y) nhất trong bán kính PICK_R; -1 nếu không có
function nearestOn(test: (i: number) => boolean, w: number, h: number, x: number, y: number): number {
  let best = -1
  let bd = Infinity
  const cx = Math.round(x)
  const cy = Math.round(y)

  for (let yy = cy - PICK_R; yy <= cy + PICK_R; yy++) {
    for (let xx = cx - PICK_R; xx <= cx + PICK_R; xx++) {
      if (xx < 0 || yy < 0 || xx >= w || yy >= h || !test(yy * w + xx)) continue

      const d = (xx - x) ** 2 + (yy - y) ** 2

      if (d < bd) {
        bd = d
        best = yy * w + xx
      }
    }
  }

  return best
}

// Alt+click: cắt khối tại (x, y) theo dây cung ngắn nhất qua điểm đó (dày 3 px để tách hẳn)
function cutAt(solid: Uint8Array, w: number, h: number, x: number, y: number): void {
  const s = nearestOn((i) => solid[i] === 1, w, h, x, y)

  if (s < 0) return

  const sx = s % w
  const sy = (s - sx) / w
  const on = (px: number, py: number) => {
    const xx = Math.round(px)
    const yy = Math.round(py)

    return xx >= 0 && yy >= 0 && xx < w && yy < h && solid[yy * w + xx] === 1
  }
  // đi theo hướng (dx, dy) tới khi ra khỏi khối
  const walk = (dx: number, dy: number) => {
    let t = 0

    while (t < w + h && on(sx + dx * (t + 0.5), sy + dy * (t + 0.5))) t += 0.5

    return t
  }

  let best = { len: Infinity, dx: 1, dy: 0, t0: 0, t1: 0 }

  for (let deg = 0; deg < 180; deg += 3) {
    const dx = Math.cos(deg * Math.PI / 180)
    const dy = Math.sin(deg * Math.PI / 180)
    const t1 = walk(dx, dy)
    const t0 = walk(-dx, -dy)

    if (t0 + t1 < best.len) best = { len: t0 + t1, dx, dy, t0, t1 }
  }

  for (let t = -best.t0 - 1.5; t <= best.t1 + 1.5; t += 0.5) {
    const cx = Math.round(sx + best.dx * t)
    const cy = Math.round(sy + best.dy * t)

    for (let yy = cy - 1; yy <= cy + 1; yy++) {
      for (let xx = cx - 1; xx <= cx + 1; xx++) {
        if (xx >= 0 && yy >= 0 && xx < w && yy < h) solid[yy * w + xx] = 0
      }
    }
  }
}

function analyse(
  masks: InkMasks,
  ink: Uint8Array,
  recipe: FitRecipe,
  crop: readonly number[],
  ppp: number,
  labels: readonly RawBox[],
): Analysis | null {
  const roi = makeRoi(masks, ink, recipe.b, crop, ppp, recipe.expand)

  if (!roi) return null

  const { w, h, a0, b0, A } = roi
  const toPx = (p: readonly number[]): Pt => [(p[0] - crop[0]) * ppp - a0, (p[1] - crop[1]) * ppp - b0]

  // close 5×5 ×2 (= dilate 9×9 rồi erode 9×9) -> lấp lỗ -> open 7×7
  let solid = erode(dilate(roi.ink, w, h, 4), w, h, 4)

  solid = fillHoles(solid, w, h)
  solid = dilate(erode(solid, w, h, 3), w, h, 3)

  for (const c of recipe.cuts) {
    const [x, y] = toPx(c)

    cutAt(solid, w, h, x, y)
  }

  const { lab, n, area, first } = label(solid, w, h, N4)
  const comps: Comp[] = [{ area: 0, x0: 0, y0: 0, x1: 0, y1: 0, inside: 0, inkCnt: 0, text: false }]

  for (let k = 1; k <= n; k++) {
    comps.push({ area: area[k], x0: w, y0: h, x1: -1, y1: -1, inside: 0, inkCnt: 0, text: false })
  }

  // khung (theo vùng tìm), cắt như slice numpy
  const bx0 = Math.max(0, Math.min(w, Math.trunc(roi.X0) - a0))
  const by0 = Math.max(0, Math.min(h, Math.trunc(roi.Y0) - b0))
  const bx1 = Math.min(w, Math.trunc(roi.X1) - a0)
  const by1 = Math.min(h, Math.trunc(roi.Y1) - b0)

  for (let i = 0; i < lab.length; i++) {
    const k = lab[i]

    if (!k) continue

    const c = comps[k]
    const x = i % w
    const y = (i - x) / w

    if (x < c.x0) c.x0 = x
    if (x > c.x1) c.x1 = x
    if (y < c.y0) c.y0 = y
    if (y > c.y1) c.y1 = y
    if (roi.ink[i]) c.inkCnt++
    if (x >= bx0 && x < bx1 && y >= by0 && y < by1) c.inside++
  }

  // ô chữ mã máy theo px vùng tìm
  const textRects = labels.map((t) => {
    const [x0, y0] = toPx([t[0] - 1, t[1] - 1])
    const [x1, y1] = toPx([t[0] + t[2] + 1, t[1] + t[3] + 1])

    return [x0, y0, x1, y1]
  })

  const on = new Uint8Array(n + 1)
  let keptArea = 0

  for (let k = 1; k <= n; k++) {
    const c = comps[k]
    const bw = c.x1 - c.x0 + 1
    const bh = c.y1 - c.y0 + 1
    const boxArea = bw * bh
    const overlapsText = textRects.some(([x0, y0, x1, y1]) => {
      const ox = Math.min(x1, c.x1 + 1) - Math.max(x0, c.x0)
      const oy = Math.min(y1, c.y1 + 1) - Math.max(y0, c.y0)

      return ox > 0 && oy > 0 && ox * oy >= TEXT_OVERLAP * boxArea
    })

    // khối giống chữ: nét thưa trong bao và thấp, hoặc trùng chữ mã máy
    c.text = (c.inkCnt / boxArea < TEXT_FILL && bh < TEXT_MAX_H * ppp) || overlapsText

    // khối thuộc máy: nằm phần lớn trong khung, hoặc là khối lớn phủ tâm khung
    if (!c.text && c.area >= 0.02 * A
      && (c.inside >= 0.6 * c.area || (c.inside >= 0.25 * A && c.area <= 2.5 * A))) {
      on[k] = 1
      keptArea += c.area
    }
  }

  return { roi, lab, first, comps, on, recognized: keptArea >= 0.2 * A }
}

// =========================================================
// FIT
// =========================================================

function variantsOf(an: Analysis, crop: readonly number[], ppp: number): Record<FitMode, FitResult | null> {
  const { roi, lab, on } = an
  const { w, h, a0, b0, A } = roi
  const toPt = (px: number, py: number): [number, number] =>
    [round1((a0 + px) / ppp + crop[0]), round1((b0 + py) / ppp + crop[1])]

  const keep = new Uint8Array(w * h)
  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1

  for (let i = 0; i < keep.length; i++) {
    if (!on[lab[i]]) continue

    keep[i] = 1

    const x = i % w
    const y = (i - x) / w

    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }

  if (maxX < 0) return NO_VARIANTS

  const p0 = toPt(minX, minY)
  const p1 = toPt(maxX + 1, maxY + 1)
  const b: RawBox = [p0[0], p0[1], round1(p1[0] - p0[0]), round1(p1[1] - p0[1])]

  // Sát: làm trơn (close 9×9, đệm mép để không dính mép vùng tìm) rồi lấy đường bao
  const pad = SMOOTH_R + 1
  const pw = w + pad * 2
  const ph = h + pad * 2
  const padded = new Uint8Array(pw * ph)

  for (let y = 0; y < h; y++) padded.set(keep.subarray(y * w, y * w + w), (y + pad) * pw + pad)

  const smooth = erode(dilate(padded, pw, ph, SMOOTH_R), pw, ph, SMOOTH_R)
  const tight: Polygon[] = []

  for (const ring of outerRings(smooth, pw, ph)) {
    if (Math.abs(signedArea(ring)) < 0.02 * A) continue

    const c = dropDents(simplifyClosed(ring, DP_EPS), DENT_PT * ppp)

    if (c.length >= 3) tight.push(c.map(([x, y]) => toPt(x - pad, y - pad)))
  }

  // Gọn: bao lồi các khối đã chọn
  const hull = convexHull(keep, w, h)

  return {
    tight: tight.length ? { b, p: tight } : null,
    hull: hull.length >= 3 ? { b, p: [hull.map(([x, y]) => toPt(x, y))] } : null,
    rect: { b, p: null },
  }
}

function candidatesOf(an: Analysis, crop: readonly number[], ppp: number): FitCandidate[] {
  const { roi, lab, first, comps, on } = an
  const { w, h, a0, b0, A } = roi
  const out: FitCandidate[] = []

  for (let k = 1; k < comps.length; k++) {
    // khối vụn không đáng hiện
    if (!on[k] && comps[k].area < 0.02 * A) continue

    const ring = simplifyClosed(traceOuter(lab, w, h, k, first[k]), CAND_EPS)

    if (ring.length < 3) continue

    out.push({
      poly: ring.map(([x, y]) => [round1((a0 + x) / ppp + crop[0]), round1((b0 + y) / ppp + crop[1])]),
      on: !!on[k],
      text: comps[k].text,
    })
  }

  return out
}

// Ôm theo công thức: thử ngưỡng 160, không nhận ra thì 215. Trả về khối ứng viên + 3 kiểu kết quả
// (variants null hết = không nhận ra hình máy). labels: ô chữ mã máy quanh khung (pt)
export function fitView(
  masks: InkMasks,
  recipe: FitRecipe,
  crop: readonly number[],
  ppp: number,
  labels: readonly RawBox[] = [],
): FitView {
  let an: Analysis | null = null

  for (const ink of [masks.ink160, masks.ink215]) {
    const a = analyse(masks, ink, recipe, crop, ppp, labels)

    if (!a) return { candidates: [], variants: NO_VARIANTS }

    // cả 2 ngưỡng đều không nhận ra: giữ kết quả ngưỡng 160 để người dùng tự chọn khối
    an ??= a
    if (a.recognized) {
      an = a
      break
    }
  }

  if (!an) return { candidates: [], variants: NO_VARIANTS }

  const { roi, lab, on } = an

  // click bật / tắt khối chứa điểm
  for (const t of recipe.toggles) {
    const x = (t[0] - crop[0]) * ppp - roi.a0
    const y = (t[1] - crop[1]) * ppp - roi.b0
    const i = nearestOn((j) => lab[j] > 0, roi.w, roi.h, x, y)

    if (i >= 0) on[lab[i]] ^= 1
  }

  const usable = an.recognized || recipe.toggles.length > 0

  return {
    candidates: candidatesOf(an, crop, ppp),
    variants: usable ? variantsOf(an, crop, ppp) : NO_VARIANTS,
  }
}

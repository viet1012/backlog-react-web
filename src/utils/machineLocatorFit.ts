import type {
  FitCandidate,
  FitMode,
  FitRecipe,
  FitResult,
  FitStroke,
  FitView,
  Polygon,
  RawBox,
} from '../types/machineLocator'

// =========================================================
// ÔM KHUNG SÁT MÁY THEO ẢNH LAYOUT (chạy trong worker)
// - ảnh xám ở độ phân giải gốc, nhị phân hoá ngưỡng thích nghi (trung bình cục bộ)
// - xoá chữ (khối thấp xếp thành hàng ngang) + ô chữ mã máy trước khi ôm
// - 4 kiểu: closed (theo viền kín chứa điểm hạt giống), tight (sát), hull (bao lồi), rect
// - hậu xử lý: Douglas–Peucker theo "Độ sát", tuỳ chọn nắn vuông góc; điểm tin cậy 0–100
// - tinh chỉnh theo công thức: bút loại trừ / bổ sung, cắt khối dính, bật / tắt khối
// - "Giới hạn trong khung": cắt kết quả theo khung gốc nới boxOverflowPx
// - "Làm gọn": rút gọn đường bao hiện tại (không ôm lại)
// Toạ độ ảnh: px = (pt - crop[0..1]) * ppp
// =========================================================

// Ảnh xám của layout (độ phân giải gốc)
export interface GrayImage {
  w: number
  h: number
  gray: Uint8Array
}

// Thông số (đổi ở đây để tinh chỉnh thuật toán)
export const FIT_CONFIG = {
  // ngưỡng thích nghi: nét = tối hơn trung bình cửa sổ (adaptiveWindow px) ít nhất adaptiveC
  adaptiveWindow: 31,
  adaptiveC: 12,
  // gray < inkAlways luôn là nét; gray >= paperMin luôn là nền
  inkAlways: 110,
  paperMin: 228,
  // chữ: khối cao < max(textHeightRatio × cạnh ngắn vùng tìm, textMinHeightPt) và xếp thành hàng ngang
  textHeightRatio: 0.012,
  textMinHeightPt: 2.2,
  // cắt đường mảnh (mũi tên / đường nối) khỏi hình viền kín: opening kernel (px)
  thinCutPx: 3,
  // "Theo viền kín": diện tích tối thiểu so với vùng tìm (khi có khung gốc)
  closedMinArea: 0.3,
  // "Theo viền kín" khi ôm quanh điểm click (không có khung gốc): diện tích tối thiểu (px²)
  closedMinAreaPx: 24 * 24,
  // vùng tìm lớn hơn ngần này điểm ảnh: dựng cây viền kín trên ảnh thu nhỏ 1/2
  closedDownscaleAbove: 1_500_000,
  // nắn vuông góc: cạnh lệch <= ngần này độ so với ngang / dọc
  orthoDeg: 8,
  // bắt dính đỉnh vào nét mực gần nhất (px ảnh)
  snapPx: 4,
  // điểm tin cậy: điểm trên chu vi cách nét mực <= ngần này px coi là trùng nét
  scoreTolPx: 2,
  // "Giới hạn trong khung": kết quả không vượt khung gốc quá ngần này px ảnh
  boxOverflowPx: 6,
}

// "Làm gọn" đường bao hiện tại (px ảnh)
export const TIDY_CONFIG = {
  // cạnh lệch <= ngần này độ so với ngang / dọc thì nắn thẳng
  orthoDeg: 8,
  // cạnh song song cách nhau <= ngần này px: về cùng toạ độ
  alignPx: 4,
  // bậc thang (cạnh nối 2 cạnh vuông góc cùng chiều) ngắn hơn ngần này px: bỏ
  stepPx: 6,
  // bắt dính cạnh / đỉnh vào nét mực trong ngần này px
  snapPx: 4,
  // cạnh ngang / dọc chỉ bắt dính khi >= tỉ lệ này điểm trên cạnh trùng nét
  snapCover: 0.5,
}

// Thanh "Mức gọn" 1–5 <-> epsilon Douglas–Peucker (px)
export const TIDY_LEVEL_DEFAULT = 3
export const TIDY_LEVEL_MIN = 1
export const TIDY_LEVEL_MAX = 5
const TIDY_EPS = [0.75, 1.5, 2.5, 3.5, 5]
export const epsFromTidyLevel = (v: number) =>
  TIDY_EPS[Math.min(TIDY_LEVEL_MAX, Math.max(TIDY_LEVEL_MIN, Math.round(v))) - 1]

export const FIT_MODES: FitMode[] = ['closed', 'tight', 'hull', 'rect']

export const FIT_MODE_LABEL: Record<FitMode, string> = {
  closed: 'Theo viền kín',
  tight: 'Sát',
  hull: 'Gọn',
  rect: 'Chữ nhật',
}

// khung đổi quá ngần này pt so với khung vừa thả -> cần soát
export const FIT_REVIEW_SHIFT = 12
// vùng tìm nới mỗi chiều quanh khung (Shift khi thả: 0 = chỉ trong khung)
export const FIT_EXPAND = 0.15
// ôm quanh điểm click khi chưa có khung: vùng vuông cạnh ngần này px ảnh
export const FIT_POINT_REGION_PX = 300

// Thanh "Độ sát" 1–10 <-> epsilon Douglas–Peucker (px): 6 -> 3 px (mặc định), 10 -> 0.6 px, 1 -> 6 px
export const FIT_TIGHTNESS_DEFAULT = 6
export const epsFromTightness = (v: number) => Math.round((11 - v) * 0.6 * 10) / 10
export const tightnessFromEps = (eps: number) => Math.min(10, Math.max(1, Math.round(11 - eps / 0.6)))

// Thanh "Bịt hở" (px): bịt khe hở của viền trước khi tìm viền kín
export const FIT_GAP_DEFAULT = 2
export const FIT_GAP_MIN = 1
export const FIT_GAP_MAX = 5

// làm trơn đường bao "Sát": close 9×9, bỏ chỗ lõm nông hơn DENT_PT pt
const SMOOTH_R = 4
const DENT_PT = 2
// viền khối ứng viên (chỉ để hiển thị)
const CAND_EPS = 1.5
// click / Alt+click lệch khỏi khối tối đa ngần này px
const PICK_R = 4

type Pt = [number, number]

const NO_VARIANTS: Record<FitMode, FitResult | null> = { closed: null, tight: null, hull: null, rect: null }

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
// ẢNH XÁM + NGƯỠNG THÍCH NGHI
// =========================================================

// RGBA -> xám theo công thức số nguyên của OpenCV (IMREAD_GRAYSCALE)
export function writeGray(rgba: Uint8ClampedArray, img: GrayImage, offset: number): void {
  const { gray } = img
  const n = rgba.length >> 2

  for (let i = 0, j = 0; i < n; i++, j += 4) {
    gray[offset + i] = (rgba[j] * 4899 + rgba[j + 1] * 9617 + rgba[j + 2] * 1868 + 8192) >> 14
  }
}

// Mặt nạ nét của vùng [a0, a0+w) × [b0, b0+h): trung bình cục bộ lấy cả điểm ngoài vùng (trong ảnh)
function adaptiveInk(img: GrayImage, a0: number, b0: number, w: number, h: number): Uint8Array {
  const { gray, w: W, h: H } = img
  const { adaptiveWindow, adaptiveC, inkAlways, paperMin } = FIT_CONFIG
  const R = (adaptiveWindow - 1) >> 1
  const ex0 = Math.max(0, a0 - R)
  const ey0 = Math.max(0, b0 - R)
  const ex1 = Math.min(W, a0 + w + R)
  const ey1 = Math.min(H, b0 + h + R)
  const ew = ex1 - ex0
  const eh = ey1 - ey0
  // ảnh tích phân (ew+1)×(eh+1)
  const sum = new Float64Array((ew + 1) * (eh + 1))

  for (let y = 0; y < eh; y++) {
    let row = 0

    for (let x = 0; x < ew; x++) {
      row += gray[(ey0 + y) * W + ex0 + x]
      sum[(y + 1) * (ew + 1) + x + 1] = sum[y * (ew + 1) + x + 1] + row
    }
  }

  const out = new Uint8Array(w * h)

  for (let y = 0; y < h; y++) {
    const gy = b0 + y
    const y0 = Math.max(ey0, gy - R) - ey0
    const y1 = Math.min(ey1, gy + R + 1) - ey0

    for (let x = 0; x < w; x++) {
      const gx = a0 + x
      const g = gray[gy * W + gx]

      if (g >= paperMin) continue
      if (g < inkAlways) {
        out[y * w + x] = 1
        continue
      }

      const x0 = Math.max(ex0, gx - R) - ex0
      const x1 = Math.min(ex1, gx + R + 1) - ex0
      const s = sum[y1 * (ew + 1) + x1] - sum[y0 * (ew + 1) + x1] - sum[y1 * (ew + 1) + x0] + sum[y0 * (ew + 1) + x0]
      const mean = s / ((x1 - x0) * (y1 - y0))

      if (g < mean - adaptiveC) out[y * w + x] = 1
    }
  }

  return out
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
  return r > 0 ? windowHas(src, w, h, r, 1) : src.slice()
}

// ngoài ảnh coi là 1 (như OpenCV)
function erode(src: Uint8Array, w: number, h: number, r: number): Uint8Array {
  if (r <= 0) return src.slice()

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

// Gán nhãn các điểm có src[i] === value (mặc định: điểm 1)
function label(src: Uint8Array, w: number, h: number, nb: Pt[], value = 1): Labels {
  const lab = new Int32Array(w * h)
  const stack = new Int32Array(w * h)
  const area = [0]
  const first = [0]
  let n = 0

  for (let s = 0; s < src.length; s++) {
    if (src[s] !== value || lab[s]) continue

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

        if (src[j] === value && !lab[j]) {
          lab[j] = n
          stack[sp++] = j
        }
      }
    }

    area.push(cnt)
  }

  return { lab, n, area, first }
}

interface BoxStat {
  x0: number
  y0: number
  x1: number
  y1: number
  // số điểm
  n: number
}

function boxStats(lab: Int32Array, n: number, w: number): BoxStat[] {
  const out: BoxStat[] = []

  for (let k = 0; k <= n; k++) out.push({ x0: Infinity, y0: Infinity, x1: -1, y1: -1, n: 0 })

  for (let i = 0; i < lab.length; i++) {
    const k = lab[i]

    if (!k) continue

    const s = out[k]
    const x = i % w
    const y = (i - x) / w

    if (x < s.x0) s.x0 = x
    if (x > s.x1) s.x1 = x
    if (y < s.y0) s.y0 = y
    if (y > s.y1) s.y1 = y
    s.n++
  }

  return out
}

// =========================================================
// XOÁ CHỮ
// =========================================================

// Khối nét thấp (cao < maxH) xếp thành hàng ngang (>= 2 khối cùng dòng, sát nhau),
// hoặc 1 khối thấp dài như cả chữ dính liền -> coi là chữ, xoá khỏi mặt nạ (sửa tại chỗ)
function removeText(ink: Uint8Array, w: number, h: number, maxH: number): void {
  const { lab, n } = label(ink, w, h, N8)
  const st = boxStats(lab, n, w)
  const cand: number[] = []

  for (let k = 1; k <= n; k++) {
    const s = st[k]
    const bh = s.y1 - s.y0 + 1
    const bw = s.x1 - s.x0 + 1

    // nét ngang 1–2 px (cạnh máy, đường kẻ) không phải chữ
    if (bh < maxH && bh > 2 && bw < maxH * 12) cand.push(k)
  }

  cand.sort((a, b) => st[a].x0 - st[b].x0)

  const parent = new Map<number, number>(cand.map((k) => [k, k]))
  const find = (k: number): number => {
    let r = k

    while (parent.get(r) !== r) r = parent.get(r)!
    parent.set(k, r)

    return r
  }

  for (let a = 0; a < cand.length; a++) {
    const A = st[cand[a]]
    const ha = A.y1 - A.y0 + 1

    for (let b = a + 1; b < cand.length; b++) {
      const B = st[cand[b]]
      const hb = B.y1 - B.y0 + 1
      const hm = Math.max(ha, hb)

      // đã sắp theo x0: khối sau ở quá xa về bên phải thì dừng
      if (B.x0 - A.x1 > hm * 1.2) break

      const sameLine = Math.abs((A.y0 + A.y1) - (B.y0 + B.y1)) / 2 < hm * 0.5
      const similar = Math.min(ha, hb) / hm >= 0.4

      if (sameLine && similar) parent.set(find(cand[a]), find(cand[b]))
    }
  }

  const size = new Map<number, number>()

  for (const k of cand) size.set(find(k), (size.get(find(k)) ?? 0) + 1)

  const isText = new Uint8Array(n + 1)

  for (const k of cand) {
    const s = st[k]
    const bh = s.y1 - s.y0 + 1
    const bw = s.x1 - s.x0 + 1
    const fill = s.n / (bw * bh)

    if ((size.get(find(k)) ?? 0) >= 2 || (bw >= 2.5 * bh && fill > 0.15 && fill < 0.75)) isText[k] = 1
  }

  for (let i = 0; i < ink.length; i++) if (isText[lab[i]]) ink[i] = 0
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

// Nắn vuông góc: cạnh lệch <= deg độ so với ngang / dọc thì nắn thẳng, gộp đỉnh thẳng hàng
export function orthogonalize(poly: Pt[], deg = FIT_CONFIG.orthoDeg): Pt[] {
  const tan = Math.tan(deg * Math.PI / 180)
  const kindOf = (a: Pt, b: Pt) => {
    const dx = Math.abs(b[0] - a[0])
    const dy = Math.abs(b[1] - a[1])

    return dy <= tan * dx ? 'h' : dx <= tan * dy ? 'v' : 'o'
  }
  let pts = poly.slice()

  // 1. gộp các cạnh liền nhau cùng hướng ngang / dọc thành 1 cạnh
  for (let changed = true; changed && pts.length > 3;) {
    changed = false

    for (let i = 0; i < pts.length && pts.length > 3; i++) {
      const a = pts[(i - 1 + pts.length) % pts.length]
      const b = pts[(i + 1) % pts.length]
      const k1 = kindOf(a, pts[i])

      if (k1 !== 'o' && k1 === kindOf(pts[i], b) && k1 === kindOf(a, b)) {
        pts.splice(i, 1)
        i--
        changed = true
      }
    }
  }

  // 2. cạnh ngang lấy y trung bình, cạnh dọc lấy x trung bình; đỉnh nhận giá trị từ cạnh kề
  const n = pts.length
  const kinds = pts.map((p, i) => kindOf(p, pts[(i + 1) % n]))
  const vals = pts.map((p, i) => {
    const q = pts[(i + 1) % n]

    return kinds[i] === 'h' ? (p[1] + q[1]) / 2 : (p[0] + q[0]) / 2
  })

  pts = pts.map((p, i) => {
    const prev = (i - 1 + n) % n
    let [x, y] = p

    if (kinds[prev] === 'h') y = vals[prev]
    if (kinds[i] === 'h') y = kinds[prev] === 'h' ? (vals[prev] + vals[i]) / 2 : vals[i]
    if (kinds[prev] === 'v') x = vals[prev]
    if (kinds[i] === 'v') x = kinds[prev] === 'v' ? (vals[prev] + vals[i]) / 2 : vals[i]

    return [x, y] as Pt
  })

  // 3. bỏ đỉnh trùng / thẳng hàng sau khi nắn
  const out: Pt[] = []

  for (let i = 0; i < pts.length; i++) {
    const a = out.length ? out[out.length - 1] : pts[pts.length - 1]
    const c = pts[i]
    const b = pts[(i + 1) % pts.length]

    if (Math.abs(c[0] - a[0]) < 1e-6 && Math.abs(c[1] - a[1]) < 1e-6) continue
    if (lineDist(c, a, b) < 0.25) continue
    out.push(c)
  }

  return out.length >= 3 ? out : poly
}

// Bỏ đỉnh trùng / thẳng hàng / mũi nhọn bẹt (lệch < tol px), lặp tới khi hết
function dropRedundant(poly: Pt[], tol = 0.25): Pt[] {
  const out = poly.slice()

  for (let changed = true; changed && out.length > 3;) {
    changed = false

    for (let i = 0; i < out.length && out.length > 3; i++) {
      const a = out[(i - 1 + out.length) % out.length]
      const c = out[i]
      const b = out[(i + 1) % out.length]

      if (Math.hypot(c[0] - a[0], c[1] - a[1]) < tol || Math.hypot(b[0] - a[0], b[1] - a[1]) < tol
        || lineDist(c, a, b) < tol) {
        out.splice(i, 1)
        i--
        changed = true
      }
    }
  }

  return out
}

// Cắt đa giác theo hình chữ nhật [x0, x1] × [y0, y1] (Sutherland–Hodgman)
function clipToRect(poly: Pt[], x0: number, y0: number, x1: number, y1: number): Pt[] {
  const sides: [(p: Pt) => boolean, (a: Pt, b: Pt) => Pt][] = [
    [(p) => p[0] >= x0, (a, b) => [x0, a[1] + (b[1] - a[1]) * (x0 - a[0]) / (b[0] - a[0])]],
    [(p) => p[0] <= x1, (a, b) => [x1, a[1] + (b[1] - a[1]) * (x1 - a[0]) / (b[0] - a[0])]],
    [(p) => p[1] >= y0, (a, b) => [a[0] + (b[0] - a[0]) * (y0 - a[1]) / (b[1] - a[1]), y0]],
    [(p) => p[1] <= y1, (a, b) => [a[0] + (b[0] - a[0]) * (y1 - a[1]) / (b[1] - a[1]), y1]],
  ]
  let out = poly

  for (const [inside, cut] of sides) {
    const src = out

    out = []

    for (let i = 0; i < src.length; i++) {
      const a = src[(i - 1 + src.length) % src.length]
      const b = src[i]

      if (inside(b)) {
        if (!inside(a)) out.push(cut(a, b))
        out.push(b)
      } else if (inside(a)) {
        out.push(cut(a, b))
      }
    }

    if (!out.length) break
  }

  return out
}

// Đa giác tự cắt: 2 cạnh không kề nhau cắt / chạm nhau
function selfIntersects(poly: Pt[]): boolean {
  const n = poly.length
  const orient = (a: Pt, b: Pt, c: Pt) => {
    const v = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])

    return Math.abs(v) < 1e-9 ? 0 : Math.sign(v)
  }
  const onSeg = (a: Pt, b: Pt, p: Pt) =>
    Math.min(a[0], b[0]) - 1e-9 <= p[0] && p[0] <= Math.max(a[0], b[0]) + 1e-9
    && Math.min(a[1], b[1]) - 1e-9 <= p[1] && p[1] <= Math.max(a[1], b[1]) + 1e-9

  for (let i = 0; i < n; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % n]

    for (let j = i + 2; j < n; j++) {
      // cạnh đầu và cạnh cuối kề nhau
      if (i === 0 && j === n - 1) continue

      const c = poly[j]
      const d = poly[(j + 1) % n]
      const o1 = orient(a, b, c)
      const o2 = orient(a, b, d)
      const o3 = orient(c, d, a)
      const o4 = orient(c, d, b)

      if (o1 * o2 < 0 && o3 * o4 < 0) return true
      if ((!o1 && onSeg(a, b, c)) || (!o2 && onSeg(a, b, d)) || (!o3 && onSeg(c, d, a)) || (!o4 && onSeg(c, d, b))) {
        return true
      }
    }
  }

  return false
}

// Cạnh đã nắn thẳng: ngang (cùng y) / dọc (cùng x) / xiên
function axisOf(a: Pt, b: Pt): 'h' | 'v' | 'o' {
  return Math.abs(b[1] - a[1]) < 1e-6 ? 'h' : Math.abs(b[0] - a[0]) < 1e-6 ? 'v' : 'o'
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

// Điểm của mask gần (x, y) nhất trong bán kính r; -1 nếu không có
function nearestOn(test: (i: number) => boolean, w: number, h: number, x: number, y: number, r = PICK_R): number {
  let best = -1
  let bd = Infinity
  const cx = Math.round(x)
  const cy = Math.round(y)

  for (let yy = cy - r; yy <= cy + r; yy++) {
    for (let xx = cx - r; xx <= cx + r; xx++) {
      if (xx < 0 || yy < 0 || xx >= w || yy >= h || !test(yy * w + xx)) continue

      const d = (xx - x) ** 2 + (yy - y) ** 2

      if (d <= r * r && d < bd) {
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

// Vẽ nét bút (đĩa bán kính r px dọc đường) vào mask
function paintStroke(mask: Uint8Array, w: number, h: number, pts: Pt[], r: number): void {
  const rr = Math.max(1, r)
  const disc = (cx: number, cy: number) => {
    for (let y = Math.floor(cy - rr); y <= Math.ceil(cy + rr); y++) {
      for (let x = Math.floor(cx - rr); x <= Math.ceil(cx + rr); x++) {
        if (x >= 0 && y >= 0 && x < w && y < h && (x - cx) ** 2 + (y - cy) ** 2 <= rr * rr) mask[y * w + x] = 1
      }
    }
  }

  pts.forEach((p, i) => {
    const q = pts[i - 1] ?? p
    const steps = Math.max(1, Math.ceil(Math.hypot(p[0] - q[0], p[1] - q[1]) / (rr * 0.5)))

    for (let s = 0; s <= steps; s++) disc(q[0] + (p[0] - q[0]) * s / steps, q[1] + (p[1] - q[1]) * s / steps)
  })
}

// =========================================================
// VÙNG TÌM
// =========================================================

interface Roi {
  a0: number
  b0: number
  w: number
  h: number
  // khung gốc (ref, hoặc b khi ôm quanh điểm) theo px vùng tìm
  bx0: number
  by0: number
  bx1: number
  by1: number
  // diện tích khung gốc (px²)
  A: number
  // điểm hạt giống (px vùng tìm)
  sx: number
  sy: number
  // pt -> px vùng tìm
  toPx: (p: readonly number[]) => Pt
  toPt: (x: number, y: number) => [number, number]
}

function makeRoi(img: GrayImage, recipe: FitRecipe, crop: readonly number[], ppp: number): Roi | null {
  const { w: W, h: H } = img
  const [x, y, bw, bh] = recipe.b
  const X0 = (x - crop[0]) * ppp
  const Y0 = (y - crop[1]) * ppp
  const X1 = (x + bw - crop[0]) * ppp
  const Y1 = (y + bh - crop[1]) * ppp
  const e = recipe.expand
  const mx = e > 0 ? Math.max(12, e * (X1 - X0)) : 0
  const my = e > 0 ? Math.max(12, e * (Y1 - Y0)) : 0
  const a0 = Math.trunc(Math.max(0, X0 - mx))
  const b0 = Math.trunc(Math.max(0, Y0 - my))
  const a1 = Math.trunc(Math.min(W, X1 + mx))
  const b1 = Math.trunc(Math.min(H, Y1 + my))

  if (a1 - a0 < 10 || b1 - b0 < 10) return null

  const w = a1 - a0
  const h = b1 - b0
  const toPx = (p: readonly number[]): Pt => [(p[0] - crop[0]) * ppp - a0, (p[1] - crop[1]) * ppp - b0]
  const toPt = (px: number, py: number): [number, number] =>
    [round1((a0 + px) / ppp + crop[0]), round1((b0 + py) / ppp + crop[1])]
  const ref = recipe.ref ?? recipe.b
  const [rx0, ry0] = toPx(ref)
  const [rx1, ry1] = toPx([ref[0] + ref[2], ref[1] + ref[3]])
  const [sx, sy] = toPx(recipe.seed ?? [x + bw / 2, y + bh / 2])

  return {
    a0,
    b0,
    w,
    h,
    // cắt như slice numpy
    bx0: Math.max(0, Math.min(w, Math.trunc(rx0))),
    by0: Math.max(0, Math.min(h, Math.trunc(ry0))),
    bx1: Math.max(0, Math.min(w, Math.trunc(rx1))),
    by1: Math.max(0, Math.min(h, Math.trunc(ry1))),
    A: Math.max(1, (rx1 - rx0) * (ry1 - ry0)),
    sx,
    sy,
    toPx,
    toPt,
  }
}

// Mặt nạ nét của vùng tìm: ngưỡng thích nghi, bỏ ô chữ mã máy, xoá chữ, áp nét bút.
// raw: nét trước khi xoá chữ / bút (dùng tính điểm tin cậy)
function inkOf(
  img: GrayImage,
  roi: Roi,
  recipe: FitRecipe,
  ppp: number,
  labels: readonly RawBox[],
): { ink: Uint8Array, raw: Uint8Array, erase: Uint8Array, add: Uint8Array } {
  const { w, h } = roi
  const raw = adaptiveInk(img, roi.a0, roi.b0, w, h)
  const ink = raw.slice()

  // ô chữ mã máy (field t)
  for (const t of labels) {
    const [x0, y0] = roi.toPx([t[0] - 1, t[1] - 1])
    const [x1, y1] = roi.toPx([t[0] + t[2] + 1, t[1] + t[3] + 1])

    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(h, Math.ceil(y1)); y++) {
      for (let x = Math.max(0, Math.floor(x0)); x < Math.min(w, Math.ceil(x1)); x++) ink[y * w + x] = 0
    }
  }

  const { textHeightRatio, textMinHeightPt } = FIT_CONFIG

  removeText(ink, w, h, Math.max(textHeightRatio * Math.min(w, h), textMinHeightPt * ppp))

  const erase = new Uint8Array(w * h)
  const add = new Uint8Array(w * h)

  strokesInto(recipe.strokes, roi, ppp, erase, add)

  for (let i = 0; i < ink.length; i++) {
    if (erase[i]) ink[i] = 0
    else if (add[i]) ink[i] = 1
  }

  return { ink, raw, erase, add }
}

function strokesInto(strokes: readonly FitStroke[], roi: Roi, ppp: number, erase: Uint8Array, add: Uint8Array): void {
  for (const s of strokes) {
    paintStroke(s.mode === 'erase' ? erase : add, roi.w, roi.h, s.pts.map((p) => roi.toPx(p)), s.r * ppp)
  }
}

// =========================================================
// ĐIỂM TIN CẬY
// =========================================================

// 0–100: 70% tỉ lệ chu vi trùng nét mực (±scoreTolPx) + 30% mức sát diện tích với khung gốc
function scoreOf(polys: Pt[][], inkNear: Uint8Array, roi: Roi, hasRef: boolean): number {
  const { w, h } = roi
  let hit = 0
  let total = 0
  let area = 0

  for (const poly of polys) {
    area += Math.abs(signedArea(poly))

    for (let i = 0; i < poly.length; i++) {
      const a = poly[i]
      const b = poly[(i + 1) % poly.length]
      const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])))

      for (let s = 0; s < steps; s++) {
        const x = Math.round(a[0] + (b[0] - a[0]) * s / steps)
        const y = Math.round(a[1] + (b[1] - a[1]) * s / steps)

        total++
        if (x >= 0 && y >= 0 && x < w && y < h && inkNear[y * w + x]) hit++
        // điểm sát mép trong (đường bao điểm ảnh lệch nửa px so với nét)
        else if (x > 0 && y > 0 && x <= w && y <= h && inkNear[(y - 1) * w + x - 1]) hit++
      }
    }
  }

  if (!total) return 0

  const edge = hit / total

  if (!hasRef) return Math.round(edge * 100)

  const ratio = area / roi.A
  const areaScore = Math.max(0, 1 - Math.abs(Math.log(Math.max(ratio, 1e-6))) / Math.log(2.5))

  return Math.round((0.7 * edge + 0.3 * areaScore) * 100)
}

// =========================================================
// "THEO VIỀN KÍN"
// =========================================================

// Cây lồng nhau của vùng nền (4-liên thông) và khối nét (8-liên thông). Viền kín chứa hạt giống =
// khối nét trên đường từ vùng chứa hạt giống ra ngoài; chọn viền nhỏ nhất có diện tích (kể cả bên trong)
// >= minArea và không chạm mép vùng tìm. Trả về mặt nạ hình đã lấp kín, hoặc null
function closedShape(
  ink: Uint8Array,
  w: number,
  h: number,
  sx: number,
  sy: number,
  minArea: number,
  gapR: number,
): Uint8Array | null {
  // bịt chỗ hở <= 2·gapR px của nét (close (2·gapR+1)²)
  const m = erode(dilate(ink, w, h, gapR), w, h, gapR)
  const bg = label(m, w, h, N4, 0)
  const fg = label(m, w, h, N8, 1)
  const nb = bg.n
  const N = nb + fg.n
  const nodeOf = (i: number) => (m[i] ? nb + fg.lab[i] : bg.lab[i])
  const size = new Float64Array(N + 1)
  const touch = new Uint8Array(N + 1)
  const adj: Set<number>[] = Array.from({ length: N + 1 }, () => new Set<number>())

  for (let i = 0; i < m.length; i++) {
    const x = i % w
    const a = nodeOf(i)

    size[a]++
    if (x === 0 || x === w - 1 || i < w || i >= w * (h - 1)) touch[a] = 1

    if (x < w - 1) {
      const b = nodeOf(i + 1)

      if (m[i] !== m[i + 1]) {
        adj[a].add(b)
        adj[b].add(a)
      }
    }
    if (i < w * (h - 1)) {
      const b = nodeOf(i + w)

      if (m[i] !== m[i + w]) {
        adj[a].add(b)
        adj[b].add(a)
      }
    }
  }

  // BFS từ các vùng nền chạm mép (gốc)
  const depth = new Int32Array(N + 1).fill(-1)
  const parent = new Int32Array(N + 1)
  const order: number[] = []

  for (let k = 1; k <= nb; k++) {
    if (touch[k]) {
      depth[k] = 0
      order.push(k)
    }
  }

  for (let q = 0; q < order.length; q++) {
    const a = order[q]

    for (const b of adj[a]) {
      if (depth[b] < 0) {
        depth[b] = depth[a] + 1
        parent[b] = a
        order.push(b)
      }
    }
  }

  const seed = nearestOn(() => true, w, h, sx, sy)

  if (seed < 0) return null

  const start = nodeOf(seed)

  if (depth[start] <= 0) return null

  // diện tích cây con + cây con có chạm mép vùng tìm không
  const sub = Float64Array.from(size)
  const subTouch = Uint8Array.from(touch)
  const children: number[][] = Array.from({ length: N + 1 }, () => [])

  for (let q = order.length - 1; q >= 0; q--) {
    const a = order[q]

    if (depth[a] > 0) {
      const p = parent[a]

      sub[p] += sub[a]
      subTouch[p] |= subTouch[a]
      children[p].push(a)
    }
  }

  let chosen = -1

  for (let a = start; depth[a] > 0; a = parent[a]) {
    // khối nét có bên trong (vùng nền con) = viền kín
    if (a > nb && children[a].length && !subTouch[a] && sub[a] >= minArea) {
      chosen = a
      break
    }
  }

  if (chosen < 0) return null

  const inShape = new Uint8Array(N + 1)
  const stack = [chosen]

  while (stack.length) {
    const a = stack.pop()!

    inShape[a] = 1
    stack.push(...children[a])
  }

  const out = new Uint8Array(w * h)

  for (let i = 0; i < m.length; i++) if (inShape[nodeOf(i)]) out[i] = 1

  return out
}

// =========================================================
// FIT
// =========================================================

interface Analysis {
  roi: Roi
  lab: Int32Array
  first: number[]
  area: number[]
  // on[k]: khối k đang dùng
  on: Uint8Array
  // tự chọn được (tổng khối chọn >= 20% khung)
  recognized: boolean
}

// "Sát": close 5×5 ×2 -> lấp lỗ -> open 7×7 -> bút / cắt -> chọn khối như fit_frames.py
function analyseTight(ink: Uint8Array, erase: Uint8Array, add: Uint8Array, roi: Roi, recipe: FitRecipe): Analysis {
  const { w, h, A } = roi
  let solid = erode(dilate(ink, w, h, 4), w, h, 4)

  solid = fillHoles(solid, w, h)
  solid = dilate(erode(solid, w, h, 3), w, h, 3)

  for (let i = 0; i < solid.length; i++) {
    if (erase[i]) solid[i] = 0
    else if (add[i]) solid[i] = 1
  }

  for (const c of recipe.cuts) {
    const [x, y] = roi.toPx(c)

    cutAt(solid, w, h, x, y)
  }

  const { lab, n, area, first } = label(solid, w, h, N4)
  const inside = new Array<number>(n + 1).fill(0)

  for (let y = roi.by0; y < roi.by1; y++) {
    for (let x = roi.bx0; x < roi.bx1; x++) {
      const k = lab[y * w + x]

      if (k) inside[k]++
    }
  }

  const on = new Uint8Array(n + 1)
  let kept = 0

  for (let k = 1; k <= n; k++) {
    // khối thuộc máy: nằm phần lớn trong khung, hoặc là khối lớn phủ tâm khung
    if (area[k] >= 0.02 * A && (inside[k] >= 0.6 * area[k] || (inside[k] >= 0.25 * A && area[k] <= 2.5 * A))) {
      on[k] = 1
      kept += area[k]
    }
  }

  // click bật / tắt khối chứa điểm
  for (const t of recipe.toggles) {
    const [x, y] = roi.toPx(t)
    const i = nearestOn((j) => lab[j] > 0, w, h, x, y)

    if (i >= 0) on[lab[i]] ^= 1
  }

  return { roi, lab, first, area, on, recognized: kept >= 0.2 * A || recipe.toggles.length > 0 }
}

function bboxOf(mask: Uint8Array, w: number): [number, number, number, number] | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -1
  let maxY = -1

  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue

    const x = i % w
    const y = (i - x) / w

    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }

  return maxX < 0 ? null : [minX, minY, maxX + 1, maxY + 1]
}

function resultOf(
  mask: Uint8Array,
  polys: Pt[][] | null,
  roi: Roi,
  inkNear: Uint8Array,
  hasRef: boolean,
): FitResult | null {
  const bb = bboxOf(mask, roi.w)

  if (!bb) return null

  const p0 = roi.toPt(bb[0], bb[1])
  const p1 = roi.toPt(bb[2], bb[3])
  const b: RawBox = [p0[0], p0[1], round1(p1[0] - p0[0]), round1(p1[1] - p0[1])]
  const rectPoly: Pt[] = [[bb[0], bb[1]], [bb[2], bb[1]], [bb[2], bb[3]], [bb[0], bb[3]]]

  return {
    b,
    p: polys ? polys.map((poly) => poly.map(([x, y]) => roi.toPt(x, y))) : null,
    score: scoreOf(polys ?? [rectPoly], inkNear, roi, hasRef),
  }
}

// Đường bao của mask đã làm trơn: rings ngoài -> DP -> (bỏ lõm) -> (nắn vuông)
function ringsOf(mask: Uint8Array, w: number, h: number, minArea: number, eps: number, ortho: boolean, dentPx: number): Pt[][] {
  const out: Pt[][] = []

  for (const ring of outerRings(mask, w, h)) {
    if (Math.abs(signedArea(ring)) < minArea) continue

    let c = simplifyClosed(ring, eps)

    if (dentPx > 0) c = dropDents(c, dentPx)
    if (ortho) c = orthogonalize(c)
    if (c.length >= 3) out.push(c)
  }

  return out
}

function tightVariants(an: Analysis, recipe: FitRecipe, inkNear: Uint8Array, ppp: number, hasRef: boolean) {
  const { roi, lab, on } = an
  const { w, h, A } = roi
  const keep = new Uint8Array(w * h)

  for (let i = 0; i < keep.length; i++) if (on[lab[i]]) keep[i] = 1

  // Sát: làm trơn (close 9×9, đệm mép để không dính mép vùng tìm) rồi lấy đường bao
  const pad = SMOOTH_R + 1
  const pw = w + pad * 2
  const ph = h + pad * 2
  const padded = new Uint8Array(pw * ph)

  for (let y = 0; y < h; y++) padded.set(keep.subarray(y * w, y * w + w), (y + pad) * pw + pad)

  const smooth = erode(dilate(padded, pw, ph, SMOOTH_R), pw, ph, SMOOTH_R)
  const tightRings = ringsOf(smooth, pw, ph, 0.02 * A, recipe.eps, recipe.ortho, DENT_PT * ppp)
    .map((r) => r.map(([x, y]) => [x - pad, y - pad] as Pt))

  // Gọn: bao lồi các khối đã chọn
  let hull = convexHull(keep, w, h)

  if (recipe.ortho && hull.length >= 3) hull = orthogonalize(hull)

  return {
    tight: tightRings.length ? resultOf(keep, tightRings, roi, inkNear, hasRef) : null,
    hull: hull.length >= 3 ? resultOf(keep, [hull], roi, inkNear, hasRef) : null,
    rect: resultOf(keep, null, roi, inkNear, hasRef),
  }
}

// Thu nhỏ 1/2: điểm nhỏ = 1 nếu có điểm 1 trong ô 2×2 (giữ nét mảnh)
function halve(src: Uint8Array, w: number, h: number): { m: Uint8Array, w: number, h: number } {
  const sw = Math.ceil(w / 2)
  const sh = Math.ceil(h / 2)
  const m = new Uint8Array(sw * sh)

  for (let i = 0; i < src.length; i++) {
    if (!src[i]) continue

    const x = i % w
    const y = (i - x) / w

    m[(y >> 1) * sw + (x >> 1)] = 1
  }

  return { m, w: sw, h: sh }
}

// Kết quả từ đa giác (px vùng tìm): bbox theo đỉnh đa giác
function resultOfPolys(polys: Pt[][], roi: Roi, inkNear: Uint8Array, hasRef: boolean): FitResult {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity

  for (const poly of polys) {
    for (const [x, y] of poly) {
      x0 = Math.min(x0, x)
      y0 = Math.min(y0, y)
      x1 = Math.max(x1, x)
      y1 = Math.max(y1, y)
    }
  }

  const p0 = roi.toPt(x0, y0)
  const p1 = roi.toPt(x1, y1)

  return {
    b: [p0[0], p0[1], round1(p1[0] - p0[0]), round1(p1[1] - p0[1])],
    p: polys.map((poly) => poly.map(([x, y]) => roi.toPt(x, y))),
    score: scoreOf(polys, inkNear, roi, hasRef),
  }
}

// "Theo viền kín". Có khung gốc: viền phải >= closedMinArea vùng tìm; ôm quanh điểm click: chỉ cần chứa
// điểm click, không chạm mép vùng tìm và >= closedMinAreaPx. Vùng tìm lớn (> closedDownscaleAbove điểm ảnh):
// dựng cây viền kín trên ảnh thu nhỏ 1/2, phóng đa giác về tỉ lệ gốc rồi bắt dính lại theo nét
function closedVariant(
  ink: Uint8Array,
  raw: Uint8Array,
  erase: Uint8Array,
  roi: Roi,
  recipe: FitRecipe,
  inkNear: Uint8Array,
  hasRef: boolean,
): { result: FitResult | null, downscaled: boolean } {
  const { closedMinArea, closedMinAreaPx, closedDownscaleAbove, thinCutPx, snapPx } = FIT_CONFIG
  const big = roi.w * roi.h > closedDownscaleAbove
  const k = big ? 2 : 1
  const src = big ? halve(ink, roi.w, roi.h) : { m: ink, w: roi.w, h: roi.h }
  const er = big ? halve(erase, roi.w, roi.h).m : erase
  const { w, h } = src
  const sx = roi.sx / k
  const sy = roi.sy / k
  const minArea = (hasRef ? closedMinArea * roi.w * roi.h : closedMinAreaPx) / (k * k)
  // bịt hở "gap" px ảnh gốc: close bán kính ceil(gap / 2), tính theo ảnh đang dùng
  const gapR = Math.max(1, Math.ceil((recipe.gap ?? 2) / 2 / k))
  const shape = closedShape(src.m, w, h, sx, sy, minArea, gapR)

  if (!shape) return { result: null, downscaled: big }

  for (let i = 0; i < shape.length; i++) if (er[i]) shape[i] = 0

  for (const c of recipe.cuts) {
    const [x, y] = roi.toPx(c)

    cutAt(shape, w, h, x / k, y / k)
  }

  // cắt đường mảnh (mũi tên / đường nối) rồi giữ phần chứa hạt giống
  const r = Math.max(1, Math.round((thinCutPx >> 1) / k))
  const opened = dilate(erode(shape, w, h, r), w, h, r)
  const parts = label(opened, w, h, N4)
  const at = nearestOn((i) => parts.lab[i] > 0, w, h, sx, sy, Math.max(w, h))

  if (at < 0) return { result: null, downscaled: big }

  const keepK = parts.lab[at]
  const keep = new Uint8Array(w * h)

  for (let i = 0; i < keep.length; i++) if (parts.lab[i] === keepK) keep[i] = 1

  let rings = ringsOf(keep, w, h, 0.02 * roi.A / (k * k), recipe.eps / k, false, 0)

  if (big) {
    // tâm điểm ảnh nhỏ -> toạ độ gốc, rồi bắt dính từng đỉnh vào nét gần nhất (<= snapPx)
    rings = rings.map((ring) => ring.map(([x, y]) => {
      const gx = x * 2 + 0.5
      const gy = y * 2 + 0.5
      const i = nearestOn((j) => raw[j] === 1, roi.w, roi.h, gx, gy, snapPx)

      return i < 0 ? [gx, gy] as Pt : [i % roi.w, Math.floor(i / roi.w)] as Pt
    }))
  }

  if (recipe.ortho) rings = rings.map((ring) => orthogonalize(ring))

  return {
    result: rings.length ? (big ? resultOfPolys(rings, roi, inkNear, hasRef) : resultOf(keep, rings, roi, inkNear, hasRef)) : null,
    downscaled: big,
  }
}

function candidatesOf(an: Analysis): FitCandidate[] {
  const { roi, lab, first, area, on } = an
  const out: FitCandidate[] = []

  for (let k = 1; k < area.length; k++) {
    // khối vụn không đáng hiện
    if (!on[k] && area[k] < 0.02 * roi.A) continue

    const ring = simplifyClosed(traceOuter(lab, roi.w, roi.h, k, first[k]), CAND_EPS)

    if (ring.length < 3) continue

    out.push({ poly: ring.map(([x, y]) => roi.toPt(x, y)), on: !!on[k], text: false })
  }

  return out
}

// "Giới hạn trong khung": cắt kết quả theo khung gốc nới boxOverflowPx, bỏ đỉnh thừa,
// nắn vuông góc (nếu bật) rồi tính lại bbox + điểm tin cậy. Nằm gọn trong khung thì giữ nguyên
function clipVariant(r: FitResult | null, roi: Roi, recipe: FitRecipe, inkNear: Uint8Array): FitResult | null {
  const ref = recipe.ref

  if (!r || !ref) return r

  const o = FIT_CONFIG.boxOverflowPx
  const [rx0, ry0] = roi.toPx(ref)
  const [rx1, ry1] = roi.toPx([ref[0] + ref[2], ref[1] + ref[3]])
  const x0 = rx0 - o
  const y0 = ry0 - o
  const x1 = rx1 + o
  const y1 = ry1 + o
  // kết quả đã làm tròn 0.1 pt: lệch ra ngoài < 0.5 px coi như trong khung
  const inside = ([x, y]: Pt) => x >= x0 - 0.5 && x <= x1 + 0.5 && y >= y0 - 0.5 && y <= y1 + 0.5

  if (!r.p) {
    const [bx0, by0] = roi.toPx(r.b)
    const [bx1, by1] = roi.toPx([r.b[0] + r.b[2], r.b[1] + r.b[3]])

    if (inside([bx0, by0]) && inside([bx1, by1])) return r

    const cx0 = Math.max(bx0, x0)
    const cy0 = Math.max(by0, y0)
    const cx1 = Math.min(bx1, x1)
    const cy1 = Math.min(by1, y1)

    if (cx1 - cx0 < 1 || cy1 - cy0 < 1) return null

    const rect: Pt[] = [[cx0, cy0], [cx1, cy0], [cx1, cy1], [cx0, cy1]]

    return { ...resultOfPolys([rect], roi, inkNear, true), p: null, fallback: r.fallback }
  }

  const polys = r.p.map((poly) => poly.map((p) => roi.toPx(p)))

  if (polys.every((poly) => poly.every(inside))) return r

  const clipped: Pt[][] = []

  for (const poly of polys) {
    let c = dropRedundant(clipToRect(poly, x0, y0, x1, y1))

    if (recipe.ortho && c.length >= 3) c = orthogonalize(c)
    if (c.length >= 3 && Math.abs(signedArea(c)) >= 1) clipped.push(c)
  }

  return clipped.length ? { ...resultOfPolys(clipped, roi, inkNear, true), fallback: r.fallback } : null
}

// Thời gian từng bước của 1 lần tính (ms) – worker ghi ra console.debug
export interface FitTiming {
  px: number
  downscaled: boolean
  ink: number
  tight: number
  closed: number
  total: number
}

// Ôm theo công thức. Trả về khối ứng viên ("Sát") + 4 kiểu kết quả kèm điểm tin cậy
// (variants null hết = không nhận ra hình máy). labels: ô chữ mã máy quanh khung (pt).
// timing: nếu truyền vào thì điền thời gian từng bước
export function fitView(
  img: GrayImage,
  recipe: FitRecipe,
  crop: readonly number[],
  ppp: number,
  labels: readonly RawBox[] = [],
  timing?: FitTiming,
): FitView {
  const t0 = performance.now()
  const roi = makeRoi(img, recipe, crop, ppp)

  if (!roi) return { candidates: [], variants: NO_VARIANTS }

  const { ink, raw, erase, add } = inkOf(img, roi, recipe, ppp, labels)
  const inkNear = dilate(raw, roi.w, roi.h, FIT_CONFIG.scoreTolPx)
  const hasRef = !!recipe.ref
  const t1 = performance.now()
  const an = analyseTight(ink, erase, add, roi, recipe)
  const t = an.recognized ? tightVariants(an, recipe, inkNear, ppp, hasRef) : null
  const t2 = performance.now()
  const cv = closedVariant(ink, raw, erase, roi, recipe, inkNear, hasRef)
  const closed = cv.result
  const t3 = performance.now()

  if (timing) {
    Object.assign(timing, {
      px: roi.w * roi.h,
      downscaled: cv.downscaled,
      ink: t1 - t0,
      tight: t2 - t1,
      closed: t3 - t2,
      total: t3 - t0,
    })
  }

  const variants: Record<FitMode, FitResult | null> = {
    // không có viền kín -> dùng "Sát"
    closed: closed ?? (t?.tight ? { ...t.tight, fallback: true } : null),
    tight: t?.tight ?? null,
    hull: t?.hull ?? null,
    rect: t?.rect ?? (closed ? { b: closed.b, p: null, score: closed.score } : null),
  }

  if (recipe.clip && recipe.ref) {
    for (const m of FIT_MODES) variants[m] = clipVariant(variants[m], roi, recipe, inkNear)
  }

  return { candidates: candidatesOf(an), variants }
}

// Bắt dính điểm (pt) vào nét mực gần nhất trong r px; null nếu không có nét gần
export function snapToInk(
  img: GrayImage,
  pt: readonly number[],
  crop: readonly number[],
  ppp: number,
  r = FIT_CONFIG.snapPx,
): [number, number] | null {
  const px = (pt[0] - crop[0]) * ppp
  const py = (pt[1] - crop[1]) * ppp
  const a0 = Math.max(0, Math.floor(px - r - 1))
  const b0 = Math.max(0, Math.floor(py - r - 1))
  const a1 = Math.min(img.w, Math.ceil(px + r + 2))
  const b1 = Math.min(img.h, Math.ceil(py + r + 2))

  if (a1 <= a0 || b1 <= b0) return null

  const w = a1 - a0
  const ink = adaptiveInk(img, a0, b0, w, b1 - b0)
  const i = nearestOn((j) => ink[j] === 1, w, b1 - b0, px - a0, py - b0, r)

  if (i < 0) return null

  const x = i % w
  const y = (i - x) / w

  // tâm điểm ảnh nét
  return [round1((a0 + x + 0.5) / ppp + crop[0]), round1((b0 + y + 0.5) / ppp + crop[1])]
}

// =========================================================
// "LÀM GỌN" ĐƯỜNG BAO HIỆN TẠI (không ôm lại)
// =========================================================

// Gom cạnh ngang (cùng y) / dọc (cùng x) cách nhau <= tol px về cùng toạ độ (trung bình theo độ dài).
// Mỗi nhóm nằm gọn trong tol để không trượt dây chuyền
function alignParallel(polys: Pt[][], tol: number): Pt[][] {
  const out = polys.map((poly) => poly.map(([x, y]) => [x, y] as Pt))

  for (const ca of [1, 0] as const) {
    const kind = ca === 1 ? 'h' : 'v'
    const edges: { k: number, i: number, v: number, len: number }[] = []

    out.forEach((poly, k) => poly.forEach((a, i) => {
      const b = poly[(i + 1) % poly.length]

      if (axisOf(a, b) === kind) edges.push({ k, i, v: a[ca], len: Math.abs(b[1 - ca] - a[1 - ca]) })
    }))

    edges.sort((a, b) => a.v - b.v)

    for (let s = 0; s < edges.length;) {
      let e = s + 1

      while (e < edges.length && edges[e].v - edges[s].v <= tol) e++

      if (e - s > 1) {
        const group = edges.slice(s, e)
        const total = group.reduce((n, g) => n + g.len, 0) || 1
        const v = group.reduce((n, g) => n + g.v * g.len, 0) / total

        for (const g of group) {
          const poly = out[g.k]

          poly[g.i][ca] = v
          poly[(g.i + 1) % poly.length][ca] = v
        }
      }

      s = e
    }
  }

  return out
}

// Bỏ bậc thang: cạnh ngang / dọc ngắn hơn minPx nối 2 cạnh vuông góc đi cùng chiều (hình chữ Z).
// Dời cạnh kề ngắn hơn về toạ độ cạnh kề dài hơn rồi bỏ đỉnh thừa (khấc / gờ hình chữ U giữ nguyên)
function dropSteps(poly: Pt[], minPx: number): Pt[] {
  let pts = poly.map(([x, y]) => [x, y] as Pt)

  for (let changed = true, guard = 0; changed && pts.length > 4 && guard < 200; guard++) {
    changed = false

    const n = pts.length

    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n]
      const a = pts[i]
      const b = pts[(i + 1) % n]
      const p3 = pts[(i + 2) % n]
      const k = axisOf(a, b)

      if (k === 'o' || Math.hypot(b[0] - a[0], b[1] - a[1]) >= minPx) continue

      const other = k === 'h' ? 'v' : 'h'

      if (axisOf(p0, a) !== other || axisOf(b, p3) !== other) continue

      // toạ độ chạy dọc 2 cạnh kề / toạ độ không đổi trên 2 cạnh kề
      const along = other === 'h' ? 0 : 1
      const ca = 1 - along
      const d1 = a[along] - p0[along]
      const d2 = p3[along] - b[along]

      if (d1 * d2 <= 0) continue

      if (Math.abs(d1) >= Math.abs(d2)) {
        b[ca] = a[ca]
        p3[ca] = a[ca]
      } else {
        a[ca] = b[ca]
        p0[ca] = b[ca]
      }

      pts = dropRedundant(pts)
      changed = true
      break
    }
  }

  return pts
}

interface InkPatch {
  ink: Uint8Array
  a0: number
  b0: number
  w: number
  h: number
}

// Mặt nạ nét quanh các đa giác (px ảnh), nới pad px
function inkPatch(img: GrayImage, polys: Pt[][], pad: number): InkPatch | null {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity

  for (const poly of polys) {
    for (const [x, y] of poly) {
      x0 = Math.min(x0, x)
      y0 = Math.min(y0, y)
      x1 = Math.max(x1, x)
      y1 = Math.max(y1, y)
    }
  }

  const a0 = Math.max(0, Math.floor(x0 - pad))
  const b0 = Math.max(0, Math.floor(y0 - pad))
  const a1 = Math.min(img.w, Math.ceil(x1 + pad + 1))
  const b1 = Math.min(img.h, Math.ceil(y1 + pad + 1))

  if (a1 <= a0 || b1 <= b0) return null

  return { ink: adaptiveInk(img, a0, b0, a1 - a0, b1 - b0), a0, b0, w: a1 - a0, h: b1 - b0 }
}

// Bắt dính vào nét: cạnh ngang / dọc dời vuông góc (<= r px) tới hàng / cột điểm ảnh trùng nét nhiều nhất;
// đỉnh giữa 2 cạnh xiên bắt vào điểm nét gần nhất (như snapToInk). Toạ độ = tâm điểm ảnh nét
function snapEdges(poly: Pt[], patch: InkPatch, r: number, cover: number): Pt[] {
  const { ink, a0, b0, w, h } = patch
  const at = (x: number, y: number) => {
    const xx = x - a0
    const yy = y - b0

    return xx >= 0 && yy >= 0 && xx < w && yy < h && ink[yy * w + xx] === 1
  }
  const out = poly.map(([x, y]) => [x, y] as Pt)
  const n = out.length
  const onAxis = new Uint8Array(n)

  for (let i = 0; i < n; i++) {
    const a = out[i]
    const b = out[(i + 1) % n]
    const k = axisOf(a, b)

    if (k === 'o') continue

    onAxis[i] = 1
    onAxis[(i + 1) % n] = 1

    const along = k === 'h' ? 0 : 1
    const ca = 1 - along
    const lo = Math.ceil(Math.min(a[along], b[along]))
    const hi = Math.floor(Math.max(a[along], b[along]))
    const c0 = Math.floor(a[ca])
    let best = 0
    let bestHit = -1
    let total = 0

    for (let d = -r; d <= r; d++) {
      let hit = 0

      total = 0

      for (let s = lo; s < hi; s++) {
        total++
        if (k === 'h' ? at(s, c0 + d) : at(c0 + d, s)) hit++
      }

      if (hit > bestHit || (hit === bestHit && Math.abs(d) < Math.abs(best))) {
        bestHit = hit
        best = d
      }
    }

    if (!total || bestHit < cover * total) continue

    const v = c0 + best + 0.5

    a[ca] = v
    b[ca] = v
  }

  for (let i = 0; i < n; i++) {
    if (onAxis[i]) continue

    const j = nearestOn((q) => ink[q] === 1, w, h, out[i][0] - a0, out[i][1] - b0, r)

    if (j >= 0) out[i] = [a0 + (j % w) + 0.5, b0 + Math.floor(j / w) + 0.5]
  }

  return out
}

// Làm gọn đường bao (pt) theo "Mức gọn": Douglas–Peucker -> nắn ngang / dọc (<= orthoDeg) ->
// gom cạnh song song gần nhau -> bỏ bậc thang nhỏ -> bắt dính cạnh vào nét. Bước nào làm đa giác
// tự cắt (hoặc suy biến) thì bỏ bước đó cho đa giác ấy
export function tidyOutline(
  img: GrayImage,
  polys: readonly Polygon[],
  crop: readonly number[],
  ppp: number,
  level: number,
): Polygon[] {
  const { orthoDeg, alignPx, stepPx, snapPx, snapCover } = TIDY_CONFIG
  const eps = epsFromTidyLevel(level)
  const ok = (q: Pt[], p: Pt[]) =>
    q.length >= 3 && Math.abs(signedArea(q)) >= 1 && (!selfIntersects(q) || selfIntersects(p))
  const stage = (src: Pt[][], f: (p: Pt[], k: number) => Pt[]) => src.map((p, k) => {
    const q = dropRedundant(f(p, k))

    return ok(q, p) ? q : p
  })

  let cur: Pt[][] = polys
    .map((poly) => poly.map(([x, y]) => [(x - crop[0]) * ppp, (y - crop[1]) * ppp] as Pt))
    .filter((poly) => poly.length >= 3)

  cur = stage(cur, (p) => simplifyClosed(p, eps))
  cur = stage(cur, (p) => orthogonalize(p, orthoDeg))

  const aligned = alignParallel(cur, alignPx)

  cur = stage(cur, (_, k) => aligned[k])
  cur = stage(cur, (p) => dropSteps(p, stepPx))

  const patch = inkPatch(img, cur, snapPx + 2)

  if (patch) cur = stage(cur, (p) => snapEdges(p, patch, snapPx, snapCover))

  return cur.map((poly) => poly.map(([x, y]) => [round1(x / ppp + crop[0]), round1(y / ppp + crop[1])] as [number, number]))
}

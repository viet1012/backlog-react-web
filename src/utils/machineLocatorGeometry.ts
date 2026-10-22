import type {
  Bounds,
  Box,
  EffectiveMachine,
  LayoutData,
  MachineDraft,
  MachineEdits,
  MachineMap,
  Outline,
  Polygon,
  ResizeHandle,
} from '../types/machineLocator'

// Hệ số phóng của stage: 1 pt PDF = U px CSS ở scale 1
export const STAGE_UNIT = 4

// =========================================================
// CODE
// =========================================================

export const round1 = (v: number) =>
  Math.round(v * 10) / 10

// 1443 -> null, A1443 / a-1443 -> A-1443, L123 -> L-123
export function normalizeCode(
  value: string | null | undefined,
): string | null {
  const s = (value || '').toUpperCase().replace(/\s+/g, '')
  const m = s.match(/^([AL])-?(\d{2,5})$/)

  return m ? `${m[1]}-${m[2]}` : null
}

export function compareCodes(a: string, b: string): number {
  const pa = a.split('-')
  const pb = b.split('-')

  return pa[0] === pb[0]
    ? (+pa[1]) - (+pb[1])
    : pa[0] < pb[0] ? -1 : 1
}

export function matchesQuery(code: string, query: string): boolean {
  const v = query.trim().toUpperCase().replace(/\s+/g, '')

  return !v || code.includes(v) || code.replace('-', '').includes(v)
}

// =========================================================
// TRẠNG THÁI MÁY (màu / nét khung, legend, bộ lọc nhóm)
// =========================================================

export type MachineStatus = 'auto' | 'manual' | 'review'

export type GroupVisibility = Record<MachineStatus, boolean>

export const ALL_GROUPS_VISIBLE: GroupVisibility = { auto: true, manual: true, review: true }

export const MACHINE_STATUS_LABEL: Record<MachineStatus, string> = {
  auto: 'Từ CAD',
  manual: 'Đã sửa',
  review: 'Cần soát',
}

// "cần soát" chỉ có ý nghĩa với ADMIN; người khác thấy máy đó như khung tự động
export function machineStatus(m: EffectiveMachine, canWrite: boolean): MachineStatus {
  if (canWrite && m.review) return 'review'

  return m.manual ? 'manual' : 'auto'
}

export function matchesMachineFilter(
  code: string,
  machines: MachineMap,
  query: string,
  groups: GroupVisibility,
  canWrite: boolean,
): boolean {
  return matchesQuery(code, query) && groups[machineStatus(machines[code], canWrite)]
}

// =========================================================
// MACHINES
// =========================================================

export function buildBaseBoxes(
  data: LayoutData,
): Record<string, Box[]> {
  const out: Record<string, Box[]> = {}

  for (const c in data.m) {
    const p = data.m[c].p

    out[c] = data.m[c].b.map((b, i) => ({
      x: b[0],
      y: b[1],
      w: b[2],
      h: b[3],
      p: normalizeOutline(p?.[i]),
    }))
  }

  return out
}

// =========================================================
// OUTLINE (đường bao CAD)
// =========================================================

// Chuẩn hoá đường bao đọc từ JSON; dữ liệu sai -> null (vẽ hình chữ nhật)
export function normalizeOutline(value: unknown): Outline {
  if (!Array.isArray(value)) return null

  const polys: Polygon[] = []

  for (const poly of value) {
    if (!Array.isArray(poly)) continue

    const pts = poly
      .filter((pt): pt is [unknown, unknown] => Array.isArray(pt) && pt.length >= 2)
      .map((pt) => [Number(pt[0]), Number(pt[1])] as [number, number])
      .filter((pt) => Number.isFinite(pt[0]) && Number.isFinite(pt[1]))

    if (pts.length >= 3) polys.push(pts)
  }

  return polys.length ? polys : null
}

// SVG path: mỗi đa giác M..L..Z
export function outlinePath(outline: Polygon[]): string {
  return outline
    .map((poly) => 'M' + poly.map(([x, y]) => `${x} ${y}`).join('L') + 'Z')
    .join('')
}

export function rectPath(b: Box): string {
  const w = Math.max(b.w, 0.5)
  const h = Math.max(b.h, 0.5)

  return `M${b.x} ${b.y}h${w}v${h}h${-w}Z`
}

export function sameOutlines(a: Box[], b: Box[]): boolean {
  return a.length === b.length
    && a.every((x, i) => JSON.stringify(x.p ?? null) === JSON.stringify(b[i].p ?? null))
}

// Danh sách máy hiệu lực = khung tự động + chỉnh tay + kết quả ôm hàng loạt chờ lưu + bản nháp đang sửa
export function buildEffectiveMachines(
  data: LayoutData,
  base: Record<string, Box[]>,
  edits: MachineEdits,
  draft: MachineDraft | null,
  pending?: Record<string, Box[]>,
): MachineMap {
  const out: MachineMap = {}

  for (const c in base) {
    out[c] = {
      boxes: base[c],
      // src = manual: khung đã chỉnh tay và ghi thẳng vào dữ liệu gốc
      manual: data.m[c].src === 'manual',
      u: !!data.m[c].u,
      review: !!data.m[c].r,
    }
  }

  for (const c in edits) {
    const e = edits[c]

    if (e.deleted) {
      delete out[c]
      continue
    }

    if (Array.isArray(e.boxes) && e.boxes.length) {
      // keepStatus: khung chỉ được ôm lại theo ảnh, trạng thái máy giữ như dữ liệu gốc
      const raw = e.keepStatus ? data.m[c] : undefined

      out[c] = {
        boxes: e.boxes.map((b) => ({ x: +b.x, y: +b.y, w: +b.w, h: +b.h, p: normalizeOutline(b.p) })),
        manual: raw ? raw.src === 'manual' : true,
        u: !!raw?.u,
        review: !!raw?.r,
      }
    }
  }

  for (const c in pending) {
    if (out[c] && pending[c].length) out[c] = { ...out[c], boxes: pending[c] }
  }

  // Bản nháp chưa lưu không làm mất trạng thái "cần soát"
  if (draft && draft.boxes.length) {
    out[draft.code] = {
      boxes: draft.boxes,
      manual: true,
      u: false,
      review: !edits[draft.code] && !!data.m[draft.code]?.r,
    }
  }

  return out
}

export function boundsOf(boxes: Box[]): Bounds {
  let x0 = 1e9
  let y0 = 1e9
  let x1 = -1e9
  let y1 = -1e9

  boxes.forEach((b) => {
    x0 = Math.min(x0, b.x)
    y0 = Math.min(y0, b.y)
    x1 = Math.max(x1, b.x + b.w)
    y1 = Math.max(y1, b.y + b.h)
  })

  return [x0, y0, x1, y1]
}

export function sameBoxes(a: Box[], b: Box[]): boolean {
  return a.length === b.length
    && a.every((x, i) =>
      (['x', 'y', 'w', 'h'] as const).every((k) => Math.abs(x[k] - b[i][k]) < 0.05),
    )
}

export function editBody(boxes: Box[]) {
  return {
    boxes: boxes.map((b) => ({
      x: round1(b.x),
      y: round1(b.y),
      w: round1(b.w),
      h: round1(b.h),
      // giữ đường bao nếu khung chưa bị sửa (sửa khung đã đặt p = null)
      ...(b.p ? { p: b.p } : {}),
    })),
    deleted: false,
    updatedAt: new Date().toISOString(),
  }
}

// =========================================================
// RESIZE
// =========================================================

export const RESIZE_HANDLES: ResizeHandle[] =
  ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

export const HANDLE_CURSOR: Record<ResizeHandle, string> = {
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
}

export function handlePosition(b: Box, h: ResizeHandle): [number, number] {
  const cx = b.x + b.w / 2
  const cy = b.y + b.h / 2
  const x = h.includes('w') ? b.x : h.includes('e') ? b.x + b.w : cx
  const y = h.includes('n') ? b.y : h.includes('s') ? b.y + b.h : cy

  return [x, y]
}

export function resizeBox(
  b0: Box,
  h: ResizeHandle,
  dx: number,
  dy: number,
): Box {
  let x0 = b0.x
  let y0 = b0.y
  let x1 = b0.x + b0.w
  let y1 = b0.y + b0.h

  if (h.includes('w')) x0 = Math.min(b0.x + dx, x1 - 1)
  if (h.includes('e')) x1 = Math.max(x1 + dx, x0 + 1)
  if (h.includes('n')) y0 = Math.min(b0.y + dy, y1 - 1)
  if (h.includes('s')) y1 = Math.max(y1 + dy, y0 + 1)

  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

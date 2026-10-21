import type {
  Box,
  MachineEdit,
  MachineEdits,
  MachineLayoutConfig,
  MachineMap,
  Polygon,
} from '../types/machineLocator'
import {
  compareCodes,
  editBody,
  normalizeCode,
  normalizeOutline,
  round1,
  sameBoxes,
  sameOutlines,
} from './machineLocatorGeometry'

// =========================================================
// EXPORT
// =========================================================

interface ExportRow {
  c: string
  i: number
  n: number
  b: Box
  src: 'manual' | 'auto'
  u: boolean
}

function exportRows(machines: MachineMap): ExportRow[] {
  const out: ExportRow[] = []

  Object.keys(machines).sort(compareCodes).forEach((c) => {
    const m = machines[c]

    m.boxes.forEach((b, i) =>
      out.push({ c, i: i + 1, n: m.boxes.length, b, src: m.manual ? 'manual' : 'auto', u: m.u }),
    )
  })

  return out
}

export function buildMachinesCsv(
  layout: MachineLayoutConfig,
  machines: MachineMap,
): string {
  const P = layout.data.page
  const header = [
    'machine_code', 'location_no', 'x_pt', 'y_pt', 'w_pt', 'h_pt',
    'center_x_pt', 'center_y_pt', 'x_rel', 'y_rel', 'w_rel', 'h_rel', 'source', 'note',
  ]
  const lines = [header.join(',')]

  exportRows(machines).forEach((r) => {
    const b = r.b
    const note = r.n > 1 ? 'multiple_locations' : r.u ? 'code_uncertain' : ''

    lines.push([
      r.c, r.i,
      round1(b.x), round1(b.y), round1(b.w), round1(b.h),
      round1(b.x + b.w / 2), round1(b.y + b.h / 2),
      (b.x / P[0]).toFixed(5), (b.y / P[1]).toFixed(5),
      (b.w / P[0]).toFixed(5), (b.h / P[1]).toFixed(5),
      r.src, note,
    ].join(','))
  })

  return '﻿' + lines.join('\r\n')
}

interface ExportMachine {
  code: string
  source: 'manual' | 'auto'
  code_uncertain: boolean
  // p: đường bao CAD của vị trí (chỉ có khi khác null)
  locations: { x: number, y: number, w: number, h: number, cx: number, cy: number, p?: Polygon[] }[]
}

export function buildMachinesJson(
  layout: MachineLayoutConfig,
  machines: MachineMap,
): string {
  const { crop, page, ppp } = layout.data
  const meta = layout.exportMeta
  const ms: Record<string, ExportMachine> = {}

  exportRows(machines).forEach((r) => {
    (ms[r.c] = ms[r.c] || { code: r.c, source: r.src, code_uncertain: r.u, locations: [] })
      .locations.push({
        x: round1(r.b.x),
        y: round1(r.b.y),
        w: round1(r.b.w),
        h: round1(r.b.h),
        cx: round1(r.b.x + r.b.w / 2),
        cy: round1(r.b.y + r.b.h / 2),
        ...(r.b.p ? { p: r.b.p } : {}),
      })
  })

  return JSON.stringify({
    layout: {
      factory: meta.factory,
      floor: meta.floor,
      source_pdf: meta.sourcePdf,
      coordinate_system: {
        unit: 'pt (1/72 inch), PDF page 1',
        origin: 'top-left',
        x_axis: 'right',
        y_axis: 'down',
        page_width: page[0],
        page_height: page[1],
      },
      image: {
        file: meta.imageFile,
        crop_pt: { x: crop[0], y: crop[1], w: crop[2], h: crop[3] },
        px_per_pt: ppp,
        to_pixel: 'px_x = (x - crop_pt.x) * px_per_pt ; px_y = (y - crop_pt.y) * px_per_pt',
      },
    },
    exported_at: new Date().toISOString(),
    machine_count: Object.keys(ms).length,
    machines: Object.values(ms),
  }, null, 2)
}

export const dateStamp = () =>
  new Date().toISOString().slice(0, 10).replace(/-/g, '')

const MIME_TYPES: Record<string, string> = {
  csv: 'text/csv;charset=utf-8',
  json: 'application/json',
  png: 'image/png',
}

export function downloadFile(name: string, data: string | Blob) {
  const blob = data instanceof Blob
    ? data
    : new Blob([data], { type: MIME_TYPES[name.split('.').pop() || ''] || 'application/octet-stream' })
  const a = document.createElement('a')

  a.href = URL.createObjectURL(blob)
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()

  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

// =========================================================
// IMPORT
// =========================================================

export type ImportOp =
  | ['set', string, MachineEdit]
  | ['del', string]

export type ImportPlan =
  | { ok: true, ops: ImportOp[] }
  | { ok: false, error: string }

// So sánh file JSON (định dạng Xuất JSON) với dữ liệu hiện tại,
// trả về danh sách thao tác cần ghi vào store
export function planJsonImport(
  text: string,
  base: Record<string, Box[]>,
  edits: MachineEdits,
  current: MachineMap,
): ImportPlan {
  let parsed: unknown

  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'File không phải JSON hợp lệ.' }
  }

  const machines = (parsed as { machines?: unknown } | null)?.machines

  if (!Array.isArray(machines)) {
    return { ok: false, error: 'File JSON không có danh sách machines. Dùng file xuất từ trang này.' }
  }

  const seen = new Set<string>()
  const ops: ImportOp[] = []

  for (const m of machines as { code?: string, locations?: unknown }[]) {
    const c = normalizeCode(m?.code)

    if (!c || !Array.isArray(m.locations)) continue

    seen.add(c)

    const boxes: Box[] = (m.locations as Partial<Box>[])
      .map((l) => ({
        x: Number(l?.x),
        y: Number(l?.y),
        w: Number(l?.w),
        h: Number(l?.h),
        p: normalizeOutline(l?.p),
      }))
      .filter((b) => [b.x, b.y, b.w, b.h].every(Number.isFinite))

    if (!boxes.length) continue

    const now = current[c]
    // giống cả khung lẫn đường bao CAD mới coi là không đổi
    const same = (other: Box[]) => sameBoxes(boxes, other) && sameOutlines(boxes, other)

    if (now && same(now.boxes)) continue

    if (base[c] && same(base[c])) {
      if (edits[c]) ops.push(['del', c])
    } else {
      ops.push(['set', c, editBody(boxes)])
    }
  }

  for (const c in current) {
    if (!seen.has(c)) {
      ops.push(['set', c, { boxes: [], deleted: true, updatedAt: new Date().toISOString() }])
    }
  }

  return { ok: true, ops }
}

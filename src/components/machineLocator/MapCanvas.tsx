import {
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
} from '@mui/material'
import type { Theme } from '@mui/material/styles'
import { keyframes } from '@emotion/react'
import {
  memo,
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import type {
  DropMods,
  RevealRequest,
} from '../../hooks/useMachineLocator'
import type {
  Bounds,
  Box as MachineBox,
  DrawMode,
  FitMode,
  FitSession,
  FitStroke,
  MachineLayoutConfig,
  MachineMap,
  Polygon,
  ResizeHandle,
} from '../../types/machineLocator'
import {
  HANDLE_CURSOR,
  MACHINE_STATUS_LABEL,
  RESIZE_HANDLES,
  STAGE_UNIT as U,
  boundsOf,
  handlePosition,
  machineStatus,
  outlinePath,
  pointInPolygon,
  rectPath,
  resizeBox,
  type GroupVisibility,
  type MachineStatus,
} from '../../utils/machineLocatorGeometry'
import { AppButton } from '../common/AppButton'
import { FitPreviews } from './FitPreviews'
import {
  codeFontFamily,
  mapColors,
} from './machineLocatorColors'

// =========================================================
// TYPES
// =========================================================

interface MapCanvasProps {
  layout: MachineLayoutConfig
  machines: MachineMap
  canWrite: boolean
  cur: string | null
  act: number
  editing: boolean
  drawMode: DrawMode | null
  // khung của bản nháp đang sửa (null khi không sửa)
  draftBoxes: MachineBox[] | null
  hint: string
  reveal: RevealRequest | null
  groups: GroupVisibility
  // máy đang được rê chuột trong danh sách bên phải
  listHover: string | null
  zoomOnSelect: boolean
  cadOutline: boolean
  dimBackground: boolean
  onToggleGroup: (g: MachineStatus) => void
  onCadOutlineChange: (on: boolean) => void
  onDimBackgroundChange: (on: boolean) => void
  onZoomOnSelectChange: (on: boolean) => void
  onSelectBox: (code: string, keepView: boolean) => void
  onClearSelection: () => void
  onActivate: (i: number) => void
  onBoxChange: (i: number, box: MachineBox) => void
  // mods: phím giữ khi thả chuột (Alt: không tự ôm; Shift: chỉ tìm trong khung)
  onDrawComplete: (box: MachineBox, mods: DropMods) => void
  // bắt đầu kéo / resize khung (trước lần onBoxChange đầu tiên)
  onGestureStart: () => void
  // thả chuột sau khi kéo / resize, box = khung vừa thả
  onGestureEnd: (i: number, box: MachineBox, mods: DropMods) => void
  // khung (index trong bản nháp) đang chờ kết quả ôm: viền nhấp nháy
  fittingIdx: number | null
  // khung đổi nhiều sau khi ôm: viền cam
  warnIdx: number[]
  // khung đang hiện 3 ảnh xem trước kiểu ôm
  fitPreviewIdx: number | null
  // kiểu ôm của khung đang chọn
  activeFitMode: FitMode
  onPickFitMode: (mode: FitMode) => void
  // click khối ứng viên (cut = false) / Alt+click cắt khối dính (cut = true), pt theo pt PDF
  onRefine: (pt: [number, number], cut: boolean) => void
  // chế độ fit: click vào máy -> ôm quanh điểm click
  fitTool: boolean
  onFitClick: (pt: [number, number]) => void
  // bút trên vùng tìm: Alt + kéo = loại trừ, Shift + kéo = bổ sung
  onStroke: (stroke: FitStroke) => void
  // sửa đỉnh đường bao của khung đang chọn
  onOutlineChange: (i: number, p: Polygon[]) => void
  // thả đỉnh vừa kéo (không giữ Ctrl): bắt dính vào nét mực
  onVertexDrop: (i: number, pi: number, vi: number, pt: [number, number]) => void
  // thanh "Độ sát" / "Nắn vuông góc" trong hàng xem trước
  fitTightness: number
  fitOrtho: boolean
  // thanh "Bịt hở" (px) cho "Theo viền kín"
  fitGap: number
  onTuneFit: (opts: { tightness?: number, ortho?: boolean, gap?: number }) => void
  onAcceptFit: () => void
  onRejectFit: () => void
  // bản xem trước khi click chế độ fit ngoài khung đang chọn (nét đứt, chưa đổi khung)
  fitGhost: { session: FitSession, mode: FitMode } | null
}

interface Point {
  x: number
  y: number
}

// 1 khung đã dựng sẵn path (không tính lại khi pan / zoom)
interface Shape {
  c: string
  i: number
  x: number
  y: number
  w: number
  h: number
  status: MachineStatus
  // hình hiển thị: đường bao CAD nếu có, không thì hình chữ nhật
  d: string
  // hình chữ nhật b (dùng cho khung đang chỉnh)
  dRect: string
}

interface Label {
  key: string
  code: string
  left: number
  top: number
}

type Op =
  // đã nhấn, chưa rõ là click hay kéo (chưa đi quá DRAG_THRESHOLD); pen: kéo sẽ là nét bút
  | { t: 'press', start: Point, p0: Point, hit: Shape | null, moveIdx: number | null, pen: FitStroke['mode'] | null }
  | { t: 'pen', mode: FitStroke['mode'], pts: Point[] }
  // kéo đỉnh pi:vi của khung i; orig = đường bao lúc bắt đầu
  | { t: 'vertex', i: number, pi: number, vi: number, p0: Point, orig: Polygon[], last: [number, number] | null }
  | { t: 'pan', last: Point }
  | { t: 'draw', p0: Point }
  // last: khung sau lần di chuyển gần nhất (null = chưa di chuyển)
  | { t: 'move', i: number, p0: Point, b0: MachineBox, last: MachineBox | null }
  | { t: 'resize', i: number, h: ResizeHandle, p0: Point, b0: MachineBox, last: MachineBox | null }

// px màn hình: đi quá ngưỡng này trước khi nhả chuột thì là kéo, không phải click
const DRAG_THRESHOLD = 4
const TOOLTIP_DELAY = 300
// scale (cho handle + nhãn mã) chỉ commit khi zoom dừng
const SCALE_COMMIT_DELAY = 120
// khung rộng hơn ngần này px trên màn hình mới hiện nhãn mã
const LABEL_MIN_BOX_PX = 40
const LABEL_H = 16
const LABEL_CHAR_W = 6.6
// bán kính bút loại trừ / bổ sung (px màn hình)
const PEN_PX = 6
// nhấp đúp cách cạnh đường bao <= ngần này px màn hình thì thêm đỉnh
const EDGE_HIT_PX = 8

const GROUP_ORDER: MachineStatus[] = ['auto', 'manual', 'review']

const pulse = keyframes`
  0% { stroke-width: 10; }
  100% { stroke-width: 3.5; }
`

// đang chờ kết quả ôm khung
const blink = keyframes`
  0%, 100% { stroke-opacity: 1; }
  50% { stroke-opacity: .3; }
`

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// =========================================================
// BOX LAYER (memo: không render lại khi pan / zoom / hover)
// =========================================================

interface BoxLayerProps {
  shapes: Shape[]
  crop: [number, number, number, number]
  cur: string | null
  act: number
  editing: boolean
  pulseKey: number
  groups: GroupVisibility
  maskId: string
  fittingIdx: number | null
  warnIdx: number[]
}

const MachineBoxLayer = memo(function MachineBoxLayer({
  shapes,
  crop,
  cur,
  act,
  editing,
  pulseKey,
  groups,
  maskId,
  fittingIdx,
  warnIdx,
}: BoxLayerProps) {
  const others = shapes.filter((s) => s.c !== cur && groups[s.status])
  const selected = shapes.filter((s) => s.c === cur)
  // kéo / resize đặt p = null nên khung đang chỉnh hiện đúng hình chữ nhật b khi kéo;
  // vừa ôm xong thì hiện đường bao, kèm hình chữ nhật b mờ (chỗ kéo / resize)
  const spotlight = !!selected.length && !editing
  const [CX, CY, CW, CH] = crop

  return (
    <>
      {spotlight && (
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x={CX} y={CY} width={CW} height={CH}>
            <rect x={CX} y={CY} width={CW} height={CH} fill="#fff" />
            {selected.map((s) => (
              <path key={`${s.c}-${s.i}`} d={s.d} fill="#000" />
            ))}
          </mask>
        </defs>
      )}

      {/* viền ngoài tối mảnh để khung nổi trên nền nhiều nét */}
      <g className="ml-halo">
        {others.map((s) => (
          <path key={`${s.c}-${s.i}`} d={s.d} data-c={s.c} />
        ))}
      </g>

      <g>
        {others.map((s) => (
          <path key={`${s.c}-${s.i}`} className={`ml-box s-${s.status}`} d={s.d} data-c={s.c} />
        ))}
      </g>

      {/* spotlight: phủ tối toàn bản đồ, khoét lỗ đúng hình khung đang chọn */}
      {spotlight && (
        <rect className="ml-spot" x={CX} y={CY} width={CW} height={CH} mask={`url(#${maskId})`} />
      )}

      <g className="ml-halo">
        {selected.map((s) => (
          <path key={`${s.c}-${s.i}`} className="on" d={s.d} />
        ))}
      </g>

      <g>
        {selected.map((s) => (
          <path
            key={`${s.c}-${s.i}-${pulseKey}`}
            className={`ml-box s-${s.status} on`
              + (pulseKey ? ' pulse' : '')
              + (editing && s.i === act ? ' act' : '')
              + (editing && s.i === fittingIdx ? ' fitting' : '')
              + (editing && warnIdx.includes(s.i) ? ' warn' : '')}
            d={s.d}
            data-c={s.c}
          />
        ))}
      </g>

      {editing && (
        <g>
          {selected
            .filter((s) => s.i === act && s.d !== s.dRect)
            .map((s) => (
              <path key={`${s.c}-${s.i}`} className="ml-bbox" d={s.dRect} />
            ))}
        </g>
      )}
    </>
  )
})

// =========================================================
// COMPONENT
// =========================================================

export const MapCanvas = memo(function MapCanvas({
  layout,
  machines,
  canWrite,
  cur,
  act,
  editing,
  drawMode,
  draftBoxes,
  hint,
  reveal,
  groups,
  listHover,
  zoomOnSelect,
  cadOutline,
  dimBackground,
  onToggleGroup,
  onCadOutlineChange,
  onDimBackgroundChange,
  onZoomOnSelectChange,
  onSelectBox,
  onClearSelection,
  onActivate,
  onBoxChange,
  onDrawComplete,
  onGestureStart,
  onGestureEnd,
  fittingIdx,
  warnIdx,
  fitPreviewIdx,
  activeFitMode,
  onPickFitMode,
  onRefine,
  fitTool,
  onFitClick,
  onStroke,
  onOutlineChange,
  onVertexDrop,
  fitTightness,
  fitOrtho,
  fitGap,
  onTuneFit,
  onAcceptFit,
  onRejectFit,
  fitGhost,
}: MapCanvasProps) {
  const crop = layout.data.crop
  const [CX, CY, CW, CH] = crop
  const SW = CW * U
  const SH = CH * U
  const maskId = `ml-spot-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  const mapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const draftRef = useRef<SVGRectElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Pan / zoom chỉ sống trong ref và DOM; scale chỉ commit vào state khi zoom xong
  // (cần cho kích thước handle resize và nhãn mã)
  const view = useRef({ s: 1, tx: 0, ty: 0 })
  const [scale, setScale] = useState(1)

  const frames = useRef({ view: 0, hover: 0, box: 0 })
  const timers = useRef({ scale: 0, tooltip: 0 })

  // Path của mọi khung, chỉ dựng lại khi dữ liệu máy / kiểu khung đổi.
  // Hit-test / click theo hình chữ nhật b
  const shapes = useMemo(() => {
    const out: Shape[] = []

    for (const c in machines) {
      const status = machineStatus(machines[c], canWrite)

      machines[c].boxes.forEach((b, i) => {
        const dRect = rectPath(b)

        out.push({
          c,
          i,
          x: b.x,
          y: b.y,
          w: b.w,
          h: b.h,
          status,
          dRect,
          d: cadOutline && b.p ? outlinePath(b.p) : dRect,
        })
      })
    }

    return out
  }, [machines, cadOutline, canWrite])

  // Số máy theo nhóm cho legend
  const groupCounts = useMemo(() => {
    const n: Record<MachineStatus, number> = { auto: 0, manual: 0, review: 0 }

    for (const c in machines) n[machineStatus(machines[c], canWrite)]++

    return n
  }, [machines, canWrite])

  // phiên ôm của khung đang chỉnh: hiện khối ứng viên, click để tinh chỉnh
  const activeFx = editing && cur && !drawMode ? machines[cur]?.boxes[act]?.fx : undefined
  // đường bao khung đang chỉnh: hiện đỉnh để kéo / thêm / xoá (khi đang vẽ theo hình CAD)
  const editOutline = editing && cur && !drawMode && !fitTool && cadOutline
    ? machines[cur]?.boxes[act]?.p ?? null
    : null
  // đỉnh đang chọn (Delete để xoá)
  const [selV, setSelV] = useState<{ i: number, pi: number, vi: number } | null>(null)
  const selVertex = selV && selV.i === act && editOutline?.[selV.pi]?.[selV.vi] ? selV : null
  const penRef = useRef<SVGPathElement>(null)

  // Delete / Backspace: xoá đỉnh đang chọn (đa giác giữ tối thiểu 3 đỉnh)
  const onDeleteKey = useEffectEvent((e: KeyboardEvent) => {
    const tag = (document.activeElement as HTMLElement | null)?.tagName

    if ((e.key !== 'Delete' && e.key !== 'Backspace') || !selVertex || !editOutline
      || tag === 'INPUT' || tag === 'TEXTAREA') return

    const poly = editOutline[selVertex.pi]

    if (poly.length <= 3) return

    e.preventDefault()
    onGestureStart()
    onOutlineChange(act, editOutline.map((q, k) => (k === selVertex.pi ? q.filter((_, j) => j !== selVertex.vi) : q)))
    setSelV(null)
  })

  useEffect(() => {
    const h = (e: KeyboardEvent) => onDeleteKey(e)

    document.addEventListener('keydown', h)

    return () => document.removeEventListener('keydown', h)
  }, [])

  // Nhấp đúp gần cạnh đường bao: thêm đỉnh tại điểm chiếu lên cạnh
  function onDoubleClick(e: { clientX: number, clientY: number }) {
    if (!editOutline) return

    const p = toPt(e.clientX, e.clientY)
    const k = view.current.s * U
    let best: { pi: number, vi: number, q: [number, number], d: number } | null = null

    editOutline.forEach((poly, pi) => {
      poly.forEach((a, vi) => {
        const b = poly[(vi + 1) % poly.length]
        const dx = b[0] - a[0]
        const dy = b[1] - a[1]
        const len2 = dx * dx + dy * dy || 1
        const t = Math.max(0, Math.min(1, ((p.x - a[0]) * dx + (p.y - a[1]) * dy) / len2))
        const q: [number, number] = [a[0] + t * dx, a[1] + t * dy]
        const d = Math.hypot(p.x - q[0], p.y - q[1]) * k

        if (d <= EDGE_HIT_PX && (!best || d < best.d)) best = { pi, vi, q, d }
      })
    })

    if (!best) return

    const { pi, vi, q } = best as { pi: number, vi: number, q: [number, number] }

    onGestureStart()
    onOutlineChange(act, editOutline.map((poly, k2) => (k2 === pi ? [...poly.slice(0, vi + 1), q, ...poly.slice(vi + 1)] : poly)))
    setSelV({ i: act, pi, vi: vi + 1 })
  }

  // vùng tìm của phiên ôm (khung lúc ôm nới theo expand, tối thiểu 12 px ảnh như worker)
  function inFitArea(fx: FitSession, p: Point): boolean {
    const [x, y, w, h] = fx.recipe.b
    const e = fx.recipe.expand
    const mx = e > 0 ? Math.max(12 / layout.data.ppp, e * w) : 0
    const my = e > 0 ? Math.max(12 / layout.data.ppp, e * h) : 0

    return p.x >= x - mx && p.x <= x + w + mx && p.y >= y - my && p.y <= y + h + my
  }

  function hitTest(p: Point): Shape | null {
    let best: Shape | null = null

    for (const h of shapes) {
      if (h.c !== cur && !groups[h.status]) continue

      if (p.x >= h.x && p.x <= h.x + h.w && p.y >= h.y && p.y <= h.y + h.h
        && (!best || h.w * h.h < best.w * best.h)) {
        best = h
      }
    }

    return best
  }

  // =======================================================
  // VIEW TRANSFORM
  // =======================================================

  function writeTransform(anim: boolean) {
    const stage = stageRef.current

    if (!stage) return

    const { s, tx, ty } = view.current

    stage.style.transition = anim ? 'transform .45s ease' : 'none'
    stage.style.transform = `translate(${tx}px,${ty}px) scale(${s})`
    // nhãn mã giữ cỡ chữ cố định trên màn hình: scale ngược bằng 1 biến CSS
    stage.style.setProperty('--ml-inv', String(1 / s))
  }

  function commitScaleSoon() {
    window.clearTimeout(timers.current.scale)
    timers.current.scale = window.setTimeout(() => setScale(view.current.s), SCALE_COMMIT_DELAY)
  }

  // Gộp nhiều pointermove / wheel thành 1 lần ghi DOM mỗi frame
  function scheduleApply() {
    if (!frames.current.view) {
      frames.current.view = requestAnimationFrame(() => {
        frames.current.view = 0
        writeTransform(false)
      })
    }
  }

  function applyNow(anim: boolean) {
    cancelAnimationFrame(frames.current.view)
    frames.current.view = 0
    writeTransform(anim)
    commitScaleSoon()
  }

  function mapSize() {
    const map = mapRef.current

    return { W: map?.clientWidth ?? 0, H: map?.clientHeight ?? 0 }
  }

  function minScale() {
    const { W, H } = mapSize()

    return Math.min(W / SW, H / SH)
  }

  function fit(anim: boolean) {
    const { W, H } = mapSize()
    const s = minScale()

    view.current = { s, tx: (W - SW * s) / 2, ty: (H - SH * s) / 2 }
    applyNow(anim)
  }

  function zoomAt(f: number, cx: number, cy: number) {
    const { s, tx, ty } = view.current
    const ns = Math.max(minScale() * 0.8, Math.min(s * f, 6))

    view.current = {
      s: ns,
      tx: cx - (cx - tx) * ns / s,
      ty: cy - (cy - ty) * ns / s,
    }
    scheduleApply()
    commitScaleSoon()
  }

  function zoomCenter(f: number) {
    const { W, H } = mapSize()

    zoomAt(f, W / 2, H / 2)
  }

  function focusBox([x0, y0, x1, y1]: Bounds) {
    const { W, H } = mapSize()
    const pad = 70
    const w = (x1 - x0) * U
    const h = (y1 - y0) * U
    const s = Math.max(Math.min((W - pad * 2) / w, (H - pad * 2) / h, 1.0), minScale())

    view.current = {
      s,
      tx: W / 2 - (((x0 + x1) / 2 - CX) * U) * s,
      ty: H / 2 - (((y0 + y1) / 2 - CY) * U) * s,
    }
    applyNow(!prefersReducedMotion())
  }

  function ensureVisible([x0, y0, x1, y1]: Bounds) {
    const { W, H } = mapSize()
    const m = 40
    const { s, tx, ty } = view.current
    const k = s * U
    const a0 = tx + (x0 - CX) * k
    const b0 = ty + (y0 - CY) * k
    const a1 = tx + (x1 - CX) * k
    const b1 = ty + (y1 - CY) * k

    if (a0 >= m && b0 >= m && a1 <= W - m && b1 <= H - m) return

    view.current = {
      s,
      tx: W / 2 - ((x0 + x1) / 2 - CX) * k,
      ty: H / 2 - ((y0 + y1) / 2 - CY) * k,
    }
    applyNow(!prefersReducedMotion())
  }

  function toPt(clientX: number, clientY: number): Point {
    const r = mapRef.current!.getBoundingClientRect()
    const { s, tx, ty } = view.current

    return {
      x: CX + ((clientX - r.left) - tx) / (s * U),
      y: CY + ((clientY - r.top) - ty) / (s * U),
    }
  }

  const refit = useEffectEvent(() => fit(false))

  const revealBox = useEffectEvent((r: RevealRequest) => {
    if (r.zoom) focusBox(r.bounds)
    else ensureVisible(r.bounds)
  })

  const onWheel = useEffectEvent((e: WheelEvent) => {
    e.preventDefault()
    hideHover()

    const r = mapRef.current!.getBoundingClientRect()

    zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top)
  })

  // Fit lần đầu và mỗi khi khung bản vẽ đổi kích thước
  useLayoutEffect(() => {
    const map = mapRef.current

    if (!map) return

    refit()

    const observer = new ResizeObserver(() => refit())

    observer.observe(map)

    return () => observer.disconnect()
  }, [SW, SH])

  // Wheel cần passive:false để chặn cuộn trang
  useEffect(() => {
    const map = mapRef.current

    if (!map) return

    const handler = (e: WheelEvent) => onWheel(e)

    map.addEventListener('wheel', handler, { passive: false })

    return () => map.removeEventListener('wheel', handler)
  }, [])

  useEffect(() => {
    if (reveal) revealBox(reveal)
  }, [reveal])

  useEffect(() => {
    const f = frames.current
    const t = timers.current

    return () => {
      cancelAnimationFrame(f.view)
      cancelAnimationFrame(f.hover)
      cancelAnimationFrame(f.box)
      window.clearTimeout(t.scale)
      window.clearTimeout(t.tooltip)
    }
  }, [])

  // =======================================================
  // HOVER (thuộc tính data-hov trên khung, không setState) + TOOLTIP dùng chung
  // =======================================================

  const hover = useRef<{ code: string | null, x: number, y: number }>({ code: null, x: 0, y: 0 })
  const hovMarked = useRef<string | null>(null)

  // Đánh dấu hover cho mọi khung của 1 máy (rê trên bản đồ hoặc trong danh sách)
  // force: đánh dấu lại từ đầu (sau khi lớp khung render lại, phần tử có thể đã thay mới)
  function markHover(code: string | null, force = false) {
    const svg = svgRef.current

    if (!svg || (!force && hovMarked.current === code)) return

    svg.querySelectorAll('[data-hov]').forEach((el) => el.removeAttribute('data-hov'))

    if (code) {
      svg.querySelectorAll(`[data-c="${CSS.escape(code)}"]`)
        .forEach((el) => el.setAttribute('data-hov', ''))
    }

    hovMarked.current = code
  }

  const listHoverRef = useRef(listHover)

  useEffect(() => {
    listHoverRef.current = listHover
    markHover(hover.current.code ?? listHover, true)
  })

  function hideTooltip() {
    window.clearTimeout(timers.current.tooltip)
    if (tooltipRef.current) tooltipRef.current.style.visibility = 'hidden'
  }

  function hideHover() {
    cancelAnimationFrame(frames.current.hover)
    frames.current.hover = 0
    hover.current.code = null
    markHover(listHoverRef.current)
    hideTooltip()

    if (mapRef.current && !gesture.current.op) mapRef.current.style.cursor = ''
  }

  function placeTooltip() {
    const tip = tooltipRef.current
    const map = mapRef.current

    if (!tip || !map) return

    const r = map.getBoundingClientRect()

    tip.style.left = `${hover.current.x - r.left + 12}px`
    tip.style.top = `${hover.current.y - r.top + 14}px`
  }

  function runHover() {
    frames.current.hover = 0

    if (gesture.current.op || pts.current.size) return

    const map = mapRef.current
    const hit = hitTest(toPt(hover.current.x, hover.current.y))
    const code = hit?.c ?? null

    markHover(code ?? listHoverRef.current)

    if (map && !hint) {
      map.style.cursor = hit
        ? (editing && hit.c === cur ? 'move' : 'pointer')
        : ''
    }

    const tip = tooltipRef.current

    if (code !== hover.current.code) hideTooltip()
    hover.current.code = code

    if (!hit || !tip) return

    if (tip.style.visibility === 'visible') {
      placeTooltip()
      return
    }

    // chỉ hiện khi con trỏ đứng yên TOOLTIP_DELAY ms
    window.clearTimeout(timers.current.tooltip)
    timers.current.tooltip = window.setTimeout(() => {
      if (hover.current.code !== hit.c || gesture.current.op) return
      tip.textContent = `${hit.c} · ${MACHINE_STATUS_LABEL[hit.status]}`
      placeTooltip()
      tip.style.visibility = 'visible'
    }, TOOLTIP_DELAY)
  }

  function scheduleHover(clientX: number, clientY: number) {
    hover.current.x = clientX
    hover.current.y = clientY

    if (!frames.current.hover) frames.current.hover = requestAnimationFrame(runHover)
  }

  // =======================================================
  // POINTER
  // =======================================================

  const pts = useRef(new Map<number, Point>())
  const gesture = useRef<{
    pinch: { d: number } | null
    op: Op | null
  }>({ pinch: null, op: null })
  const pendingBox = useRef<{ i: number, box: MachineBox } | null>(null)

  function flushBox() {
    cancelAnimationFrame(frames.current.box)
    frames.current.box = 0

    const p = pendingBox.current

    pendingBox.current = null
    if (p) onBoxChange(p.i, p.box)
  }

  // Gộp cập nhật khung đang kéo / resize thành 1 lần setState mỗi frame
  function scheduleBox(i: number, box: MachineBox) {
    pendingBox.current = { i, box }

    if (!frames.current.box) {
      frames.current.box = requestAnimationFrame(() => {
        frames.current.box = 0
        flushBox()
      })
    }
  }

  function startPanVisual() {
    if (stageRef.current) {
      stageRef.current.style.transition = 'none'
      stageRef.current.style.willChange = 'transform'
    }
    if (mapRef.current) mapRef.current.style.cursor = 'grabbing'
  }

  function endPanVisual() {
    if (stageRef.current) stageRef.current.style.willChange = ''
    if (mapRef.current) mapRef.current.style.cursor = ''
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return

    const g = gesture.current

    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    hideHover()

    // Giữ mọi pointermove / pointerup về map: lướt qua khung khác không cắt ngang thao tác
    try {
      mapRef.current?.setPointerCapture(e.pointerId)
    } catch {
      // pointer có thể đã kết thúc
    }

    if (pts.current.size === 2) {
      if (g.op?.t === 'pan') endPanVisual()
      g.op = null
      draftRef.current?.setAttribute('visibility', 'hidden')

      const [a, b] = [...pts.current.values()]

      g.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) }
      return
    }

    const p = toPt(e.clientX, e.clientY)

    if (editing && cur && draftBoxes) {
      const handle = (e.target as SVGElement).dataset?.h as ResizeHandle | undefined

      if (drawMode) {
        g.op = { t: 'draw', p0: p }
        return
      }

      if (handle && draftBoxes[act]) {
        g.op = { t: 'resize', i: act, h: handle, p0: p, b0: { ...draftBoxes[act] }, last: null }
        return
      }

      // đỉnh đường bao: data-v="pi:vi"
      const v = (e.target as SVGElement).dataset?.v

      if (v && editOutline) {
        const [pi, vi] = v.split(':').map(Number)

        setSelV({ i: act, pi, vi })
        g.op = { t: 'vertex', i: act, pi, vi, p0: p, orig: editOutline.map((q) => q.slice()), last: null }
        return
      }
    }

    const hit = hitTest(p)
    // Sửa: chỉ khung của máy đang chọn mới kéo được
    const moveIdx = editing && cur && draftBoxes && hit && hit.c === cur && draftBoxes[hit.i]
      ? hit.i
      : null
    // Alt / Shift + kéo trong vùng tìm của phiên ôm = bút loại trừ / bổ sung
    const pen = activeFx && !fitTool && (e.altKey || e.shiftKey) && inFitArea(activeFx, p)
      ? (e.altKey ? 'erase' : 'add')
      : null

    setSelV(null)
    g.op = { t: 'press', start: { x: e.clientX, y: e.clientY }, p0: p, hit, moveIdx, pen }
  }

  function penPath(pts: Point[]) {
    return pts.map((q, k) => `${k ? 'L' : 'M'}${q.x} ${q.y}`).join('')
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!pts.current.has(e.pointerId)) {
      // không nhấn: chỉ cập nhật hover
      if (e.pointerType === 'mouse') scheduleHover(e.clientX, e.clientY)
      return
    }

    const g = gesture.current

    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pts.current.size === 2 && g.pinch) {
      const [a, b] = [...pts.current.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      const r = mapRef.current!.getBoundingClientRect()

      zoomAt(d / g.pinch.d, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top)
      g.pinch.d = d
      return
    }

    let op = g.op

    if (!op) return

    if (op.t === 'press') {
      if (Math.hypot(e.clientX - op.start.x, e.clientY - op.start.y) <= DRAG_THRESHOLD) return

      if (op.pen) {
        op = { t: 'pen', mode: op.pen, pts: [op.p0] }

        const el = penRef.current

        if (el) {
          el.setAttribute('class', `ml-pen ${op.mode}`)
          el.style.strokeWidth = String(PEN_PX * 2)
          el.setAttribute('visibility', 'visible')
        }
      } else if (op.moveIdx !== null && draftBoxes?.[op.moveIdx]) {
        onActivate(op.moveIdx)
        op = { t: 'move', i: op.moveIdx, p0: op.p0, b0: { ...draftBoxes[op.moveIdx] }, last: null }
      } else {
        op = { t: 'pan', last: op.start }
        startPanVisual()
      }

      g.op = op
    }

    if (op.t === 'pan') {
      view.current.tx += e.clientX - op.last.x
      view.current.ty += e.clientY - op.last.y
      op.last = { x: e.clientX, y: e.clientY }
      scheduleApply()
      return
    }

    const p = toPt(e.clientX, e.clientY)

    if (op.t === 'pen') {
      op.pts.push(p)
      penRef.current?.setAttribute('d', penPath(op.pts))
      return
    }

    if (op.t === 'vertex') {
      // lần di chuyển đầu: chụp bản nháp để hoàn tác
      if (!op.last) onGestureStart()

      const { pi, vi } = op
      const q: [number, number] = [op.orig[pi][vi][0] + p.x - op.p0.x, op.orig[pi][vi][1] + p.y - op.p0.y]

      op.last = q
      onOutlineChange(op.i, op.orig.map((poly, k) => (k === pi ? poly.map((u, j) => (j === vi ? q : u)) : poly)))
      return
    }

    if (op.t === 'draw') {
      const el = draftRef.current

      if (el) {
        el.setAttribute('x', String(Math.min(op.p0.x, p.x)))
        el.setAttribute('y', String(Math.min(op.p0.y, p.y)))
        el.setAttribute('width', String(Math.abs(p.x - op.p0.x)))
        el.setAttribute('height', String(Math.abs(p.y - op.p0.y)))
        el.setAttribute('visibility', 'visible')
      }
      return
    }

    const ddx = p.x - op.p0.x
    const ddy = p.y - op.p0.y

    // lần di chuyển đầu: chụp bản nháp để hoàn tác, huỷ lần ôm đang chờ
    if (!op.last) onGestureStart()

    op.last = op.t === 'move'
      ? { x: op.b0.x + ddx, y: op.b0.y + ddy, w: op.b0.w, h: op.b0.h }
      : resizeBox(op.b0, op.h, ddx, ddy)

    scheduleBox(op.i, op.last)
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!pts.current.has(e.pointerId)) return

    const g = gesture.current
    const op = g.op

    pts.current.delete(e.pointerId)
    if (pts.current.size < 2) g.pinch = null

    if (pts.current.size > 0) return

    g.op = null

    if (!op) return

    const mods: DropMods = { alt: e.altKey, shift: e.shiftKey }

    if (op.t === 'pen') {
      penRef.current?.setAttribute('visibility', 'hidden')
      onStroke({
        mode: op.mode,
        r: PEN_PX / (view.current.s * U),
        pts: op.pts.map((q) => [q.x, q.y] as [number, number]),
      })
    } else if (op.t === 'vertex') {
      // thả đỉnh: bắt dính vào nét mực gần nhất, giữ Ctrl để tắt
      if (op.last && !e.ctrlKey && !e.metaKey) onVertexDrop(op.i, op.pi, op.vi, op.last)
    } else if (op.t === 'press') {
      const fx = activeFx
      const pt: [number, number] = [op.p0.x, op.p0.y]

      // chế độ fit: click = ôm quanh điểm click
      if (fitTool && editing && cur) onFitClick(pt)
      // tinh chỉnh khung vừa ôm: Alt+click trong vùng tìm = cắt khối dính; click khối ứng viên = thêm / bớt
      else if (fx && e.altKey && inFitArea(fx, op.p0)) onRefine(pt, true)
      else if (fx && fx.view.candidates.some((c) => pointInPolygon(op.p0.x, op.p0.y, c.poly))) onRefine(pt, false)
      // nhả khi chưa đi quá ngưỡng: là click; click nền thì bỏ chọn
      else if (op.moveIdx !== null) onActivate(op.moveIdx)
      else if (op.hit) onSelectBox(op.hit.c, editing)
      else onClearSelection()
    } else if (op.t === 'pan') {
      endPanVisual()
    } else if (op.t === 'draw') {
      draftRef.current?.setAttribute('visibility', 'hidden')

      const p = toPt(e.clientX, e.clientY)
      const w = Math.abs(p.x - op.p0.x)
      const h = Math.abs(p.y - op.p0.y)

      if (w > 1.5 && h > 1.5) {
        onDrawComplete({ x: Math.min(op.p0.x, p.x), y: Math.min(op.p0.y, p.y), w, h }, mods)
      }
    } else {
      flushBox()
      if (op.last) onGestureEnd(op.i, op.last, mods)
    }

    if (e.pointerType === 'mouse') scheduleHover(e.clientX, e.clientY)
  }

  function onPointerCancel(e: ReactPointerEvent<HTMLDivElement>) {
    const op = gesture.current.op

    pts.current.delete(e.pointerId)
    gesture.current.pinch = null

    if (pts.current.size === 0) {
      gesture.current.op = null
      draftRef.current?.setAttribute('visibility', 'hidden')
      penRef.current?.setAttribute('visibility', 'hidden')
      if (op?.t === 'pan') endPanVisual()
      if (op?.t === 'move' || op?.t === 'resize') flushBox()
    }
  }

  // =======================================================
  // NHÃN MÃ (chỉ tính lại khi zoom dừng, không theo pan)
  // =======================================================

  const labels = useMemo(() => {
    const k = U * scale
    const cand = shapes
      .filter((s) => s.c !== cur && groups[s.status] && s.w * k > LABEL_MIN_BOX_PX)
      .sort((a, b) => b.w * b.h - a.w * a.h)
    const placed: [number, number, number, number][] = []
    const out: Label[] = []

    for (const s of cand) {
      // chip ở góc trên-trái bên trong khung, toạ độ màn hình tương đối (bất biến khi pan)
      const x0 = (s.x - CX) * k + 2
      const y0 = (s.y - CY) * k + 2
      const r: [number, number, number, number] = [x0, y0, x0 + s.c.length * LABEL_CHAR_W + 8, y0 + LABEL_H]

      if (placed.some((p) => r[0] < p[2] && r[2] > p[0] && r[1] < p[3] && r[3] > p[1])) continue

      placed.push(r)
      out.push({ key: `${s.c}-${s.i}`, code: s.c, left: (s.x - CX) * U, top: (s.y - CY) * U })
    }

    return out
  }, [shapes, scale, cur, groups, CX, CY])

  // Chip mã máy đang chọn: giữa cạnh trên của vùng bao các khung
  const selChip = useMemo(() => {
    const boxes = cur ? machines[cur]?.boxes : undefined

    if (!cur || !boxes?.length) return null

    const [x0, y0, x1] = boundsOf(boxes)

    return { code: cur, left: ((x0 + x1) / 2 - CX) * U, top: (y0 - CY) * U }
  }, [cur, machines, CX, CY])

  // =======================================================
  // RENDER
  // =======================================================

  const pulseKey = reveal?.pulse ? reveal.id : 0
  const previewBox = editing && cur && fitPreviewIdx !== null ? machines[cur]?.boxes[fitPreviewIdx] : undefined
  // bản xem trước click ngoài khung: kiểu đang chọn (không có kết quả thì kiểu đầu tiên có)
  const ghostResult = fitGhost
    ? fitGhost.session.view.variants[fitGhost.mode]
      ?? Object.values(fitGhost.session.view.variants).find(Boolean) ?? null
    : null
  // hàng xem trước: neo dưới bản xem trước nét đứt, hoặc dưới khung vừa ôm
  const previewAt = fitGhost
    ? {
      fx: fitGhost.session,
      mode: fitGhost.mode,
      b: ghostResult?.b ?? fitGhost.session.recipe.b,
    }
    : previewBox?.fx
      ? { fx: previewBox.fx, mode: activeFitMode, b: [previewBox.x, previewBox.y, previewBox.w, previewBox.h] }
      : null
  const handleBox = editing && cur && !drawMode ? machines[cur]?.boxes[act] : undefined
  const z = 9 / (scale * U)
  const legendGroups = canWrite ? GROUP_ORDER : GROUP_ORDER.filter((g) => g !== 'review')

  return (
    <Box
      ref={mapRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onDoubleClick={onDoubleClick}
      onPointerLeave={() => {
        if (!pts.current.size) hideHover()
      }}
      sx={mapRootSx}
      style={{ cursor: hint || fitTool ? 'crosshair' : undefined }}
    >
      {/* STAGE: ảnh bản vẽ + SVG overlay + nhãn, cùng hệ toạ độ crop */}
      <Box
        ref={stageRef}
        className={dimBackground ? 'dim' : undefined}
        sx={stageSx}
        style={{ width: SW, height: SH }}
      >
        <Box
          component="img"
          src={layout.image}
          alt={layout.imageAlt}
          draggable={false}
          decoding="async"
          className="ml-bg"
        />

        <Box
          component="svg"
          ref={svgRef}
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`${CX} ${CY} ${CW} ${CH}`}
          className={editing ? 'editing' : undefined}
          sx={svgSx}
        >
          <MachineBoxLayer
            shapes={shapes}
            crop={crop}
            cur={cur}
            act={act}
            editing={editing}
            pulseKey={pulseKey}
            groups={groups}
            maskId={maskId}
            fittingIdx={fittingIdx}
            warnIdx={warnIdx}
          />

          {/* khối ứng viên của phiên ôm: xanh = đang dùng, xám = bỏ; click để thêm / bớt */}
          {activeFx && (
            <g className="ml-cands">
              {activeFx.view.candidates.map((c, k) => (
                <path key={k} className={c.on ? 'on' : 'off'} d={outlinePath([c.poly])} />
              ))}
            </g>
          )}

          <g>
            {handleBox && RESIZE_HANDLES.map((h) => {
              const [hx, hy] = handlePosition(handleBox, h)

              return (
                <rect
                  key={h}
                  className="ml-handle"
                  x={hx - z / 2}
                  y={hy - z / 2}
                  width={z}
                  height={z}
                  data-h={h}
                  style={{ cursor: HANDLE_CURSOR[h] }}
                />
              )
            })}
          </g>

          {/* đỉnh đường bao: kéo để sửa, nhấp đúp cạnh để thêm, chọn + Delete để xoá */}
          {editOutline && (
            <g>
              {editOutline.map((poly, pi) => poly.map(([x, y], vi) => (
                <circle
                  key={`${pi}:${vi}`}
                  className={'ml-vertex' + (selVertex?.pi === pi && selVertex.vi === vi ? ' sel' : '')}
                  cx={x}
                  cy={y}
                  r={z * 0.45}
                  data-v={`${pi}:${vi}`}
                />
              )))}
            </g>
          )}

          {/* bản xem trước click ngoài khung: nét đứt, chưa đổi khung (Enter áp dụng, Esc bỏ) */}
          {ghostResult && (
            <path
              className="ml-ghost"
              d={ghostResult.p
                ? outlinePath(ghostResult.p)
                : rectPath({ x: ghostResult.b[0], y: ghostResult.b[1], w: ghostResult.b[2], h: ghostResult.b[3] })}
            />
          )}

          <path ref={penRef} className="ml-pen" visibility="hidden" />

          <rect ref={draftRef} className="ml-draft" visibility="hidden" />
        </Box>

        {/* nhãn mã: neo theo toạ độ stage, scale ngược để cỡ chữ cố định */}
        {labels.map((l) => (
          <div key={l.key} className="ml-anchor" style={{ left: l.left, top: l.top }}>
            <span className="ml-label">{l.code}</span>
          </div>
        ))}

        {selChip && (
          <div className="ml-anchor" style={{ left: selChip.left, top: selChip.top }}>
            <span className="ml-chip-sel">{selChip.code}</span>
          </div>
        )}

        {previewAt && (
          <div
            className="ml-anchor"
            style={{ left: (previewAt.b[0] - CX) * U, top: (previewAt.b[1] + previewAt.b[3] - CY) * U }}
          >
            <FitPreviews
              fx={previewAt.fx}
              image={layout.image}
              crop={crop}
              mode={previewAt.mode}
              tightness={fitTightness}
              ortho={fitOrtho}
              gap={fitGap}
              ghost={!!fitGhost}
              onPick={onPickFitMode}
              onTune={onTuneFit}
              onAccept={onAcceptFit}
              onReject={onRejectFit}
            />
          </div>
        )}
      </Box>

      {/* TOOLTIP dùng chung: mã máy · trạng thái */}
      <Box ref={tooltipRef} sx={tooltipSx} />

      {/* LEGEND kiêm bộ lọc nhóm */}
      <Box
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => {
          e.stopPropagation()
          hideHover()
        }}
        sx={legendSx}
      >
        {legendGroups.map((g) => (
          <Box
            key={g}
            component="button"
            type="button"
            aria-pressed={groups[g]}
            title={groups[g] ? `Ẩn nhóm ${MACHINE_STATUS_LABEL[g]}` : `Hiện nhóm ${MACHINE_STATUS_LABEL[g]}`}
            className={`ml-legend s-${g}${groups[g] ? '' : ' off'}`}
            onClick={() => onToggleGroup(g)}
          >
            <span className="sw" />
            {MACHINE_STATUS_LABEL[g]}
            <b>{groupCounts[g]}</b>
          </Box>
        ))}
      </Box>

      {/* TITLE */}
      <Typography sx={titleSx}>
        {layout.drawingTitle}
      </Typography>

      {/* HINT */}
      {hint && (
        <Typography sx={hintSx}>
          {hint}
        </Typography>
      )}

      {/* TOOLS */}
      <Box
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => {
          e.stopPropagation()
          hideHover()
        }}
        sx={toolsSx}
      >
        <AppButton compact aria-label="Phóng to" onClick={() => zoomCenter(1.4)} sx={toolSx}>
          +
        </AppButton>
        <AppButton compact aria-label="Thu nhỏ" onClick={() => zoomCenter(1 / 1.4)} sx={toolSx}>
          −
        </AppButton>
        <AppButton onClick={() => fit(true)} sx={toolSx}>
          Xem toàn bộ
        </AppButton>

        <FormControlLabel
          sx={toolLabelSx}
          control={(
            <Checkbox
              size="small"
              checked={dimBackground}
              onChange={(e) => onDimBackgroundChange(e.target.checked)}
            />
          )}
          label="Làm mờ nền"
        />
        <FormControlLabel
          sx={toolLabelSx}
          control={(
            <Checkbox
              size="small"
              checked={cadOutline}
              onChange={(e) => onCadOutlineChange(e.target.checked)}
            />
          )}
          label="Khung theo hình CAD"
        />
        <FormControlLabel
          sx={toolLabelSx}
          control={(
            <Checkbox
              size="small"
              checked={zoomOnSelect}
              onChange={(e) => onZoomOnSelectChange(e.target.checked)}
            />
          )}
          label="Zoom tới máy khi chọn"
        />
      </Box>
    </Box>
  )
})

// =========================================================
// STYLES (hằng số module: không tạo lại object sx mỗi lần render)
// =========================================================

// Màu khung theo trạng thái đặt bằng CSS variables cho light / dark
const mapRootSx = (theme: Theme) => {
  const dark = theme.palette.mode === 'dark'

  return {
    '--ml-auto': dark ? '#4c9dff' : '#1d6fe0',
    '--ml-manual': dark ? '#34c46b' : '#15903f',
    '--ml-review': dark ? '#ff7a2f' : '#e8590c',
    '--ml-sel': dark ? '#ffc928' : mapColors.mark,
    '--ml-halo': dark ? 'rgba(0,0,0,.6)' : 'rgba(15,23,42,.42)',
    '--ml-spot': 'rgba(0,0,0,.35)',

    position: 'relative',
    overflow: 'hidden',
    touchAction: 'none',
    userSelect: 'none',
    minWidth: 0,
    minHeight: 0,
    bgcolor: mapColors.paper,
    cursor: 'grab',
  }
}

const stageSx = {
  '--ml-inv': '1',

  position: 'absolute',
  left: 0,
  top: 0,
  transformOrigin: '0 0',
  bgcolor: mapColors.paper,
  boxShadow: (theme: Theme) => `0 0 0 1px ${theme.palette.divider}`,

  '& .ml-bg': {
    display: 'block',
    width: '100%',
    height: '100%',
    userSelect: 'none',
    pointerEvents: 'none',
  },
  // nền dịu xuống để khung máy nổi bật
  '&.dim .ml-bg': {
    opacity: 0.55,
    filter: 'grayscale(.2) contrast(.9)',
  },

  // điểm neo theo toạ độ stage; scale ngược -> nhãn giữ cỡ chữ cố định trên màn hình
  '& .ml-anchor': {
    position: 'absolute',
    width: 0,
    height: 0,
    transform: 'scale(var(--ml-inv))',
    transformOrigin: '0 0',
    pointerEvents: 'none',
  },
  '& .ml-label': {
    position: 'absolute',
    left: 2,
    top: 2,
    px: '4px',
    height: LABEL_H,
    lineHeight: `${LABEL_H}px`,
    borderRadius: '3px',
    bgcolor: 'rgba(255,255,255,.88)',
    color: '#1f2933',
    boxShadow: '0 0 0 1px rgba(15,23,42,.25)',
    font: `600 10.5px ${codeFontFamily}`,
    whiteSpace: 'nowrap',
  },
  '& .ml-chip-sel': {
    position: 'absolute',
    left: 0,
    bottom: 6,
    transform: 'translateX(-50%)',
    px: '7px',
    py: '2px',
    borderRadius: '5px',
    bgcolor: 'var(--ml-sel)',
    color: mapColors.markInk,
    boxShadow: '0 2px 6px rgba(0,0,0,.3)',
    font: `700 13px ${codeFontFamily}`,
    whiteSpace: 'nowrap',
  },
}

const svgSx = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',

  // khung máy không nhận sự kiện: hit-test tự tính theo toạ độ
  '& .ml-halo path': {
    fill: 'none',
    stroke: 'var(--ml-halo)',
    strokeWidth: 4,
    strokeLinejoin: 'round',
    vectorEffect: 'non-scaling-stroke',
    pointerEvents: 'none',
  },
  '& .ml-halo path[data-hov]': { strokeWidth: 5 },
  '& .ml-halo path.on': { strokeWidth: 5.5 },

  '& .ml-box': {
    strokeWidth: 2,
    fillOpacity: 0.18,
    strokeLinejoin: 'round',
    vectorEffect: 'non-scaling-stroke',
    pointerEvents: 'none',
  },
  // phân biệt nhóm bằng cả màu lẫn nét
  '& .s-auto': { fill: 'var(--ml-auto)', stroke: 'var(--ml-auto)' },
  '& .s-manual': { fill: 'var(--ml-manual)', stroke: 'var(--ml-manual)' },
  '& .s-review': { fill: 'var(--ml-review)', stroke: 'var(--ml-review)', strokeDasharray: '6 3' },

  '& .ml-box[data-hov]': {
    strokeWidth: 3,
    fillOpacity: 0.3,
  },

  '& .ml-spot': {
    fill: 'var(--ml-spot)',
    pointerEvents: 'none',
  },

  '& .ml-box.on': {
    fill: 'var(--ml-sel)',
    stroke: 'var(--ml-sel)',
    strokeWidth: 3.5,
    fillOpacity: 0.22,
    strokeDasharray: 'none',
  },
  '& .ml-box.on.pulse': {
    animation: `${pulse} 1.2s ease-out 2`,
  },

  '&.editing .ml-box.on': {
    fill: mapColors.edit,
    stroke: mapColors.edit,
    fillOpacity: 0.12,
    strokeWidth: 1.5,
    strokeDasharray: '4 3',
    animation: 'none',
  },
  '&.editing .ml-box.on.act': {
    strokeDasharray: 'none',
    strokeWidth: 2,
  },
  // khung đổi nhiều sau khi ôm: cần kiểm tra lại
  '&.editing .ml-box.on.warn': {
    stroke: 'var(--ml-review)',
    strokeWidth: 2.5,
  },
  '&.editing .ml-box.on.fitting': {
    animation: `${blink} .9s ease-in-out infinite`,
  },
  '& .ml-ghost': {
    fill: mapColors.edit,
    fillOpacity: 0.08,
    stroke: mapColors.edit,
    strokeWidth: 2,
    strokeDasharray: '6 4',
    strokeLinejoin: 'round',
    vectorEffect: 'non-scaling-stroke',
    pointerEvents: 'none',
  },
  '& .ml-vertex': {
    fill: mapColors.paper,
    stroke: mapColors.edit,
    strokeWidth: 1.5,
    vectorEffect: 'non-scaling-stroke',
    cursor: 'move',
  },
  '& .ml-vertex.sel': { fill: mapColors.edit },
  // nét bút: đỏ = loại trừ, xanh lá = bổ sung (độ dày đặt theo px màn hình)
  '& .ml-pen': {
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeOpacity: 0.4,
    vectorEffect: 'non-scaling-stroke',
    pointerEvents: 'none',
  },
  '& .ml-pen.erase': { stroke: '#dc2626' },
  '& .ml-pen.add': { stroke: '#16a34a' },
  // khối ứng viên của phiên ôm (viền mờ): xanh = đang dùng, xám = bỏ
  '& .ml-cands path': {
    strokeWidth: 1,
    strokeLinejoin: 'round',
    vectorEffect: 'non-scaling-stroke',
    pointerEvents: 'none',
  },
  '& .ml-cands .on': {
    fill: mapColors.edit,
    fillOpacity: 0.2,
    stroke: mapColors.edit,
    strokeOpacity: 0.6,
  },
  '& .ml-cands .off': {
    fill: '#64748b',
    fillOpacity: 0.16,
    stroke: '#64748b',
    strokeOpacity: 0.55,
    strokeDasharray: '3 2',
  },
  '& .ml-bbox': {
    fill: 'none',
    stroke: mapColors.edit,
    strokeWidth: 1,
    strokeDasharray: '2 3',
    strokeOpacity: 0.7,
    vectorEffect: 'non-scaling-stroke',
    pointerEvents: 'none',
  },
  '& .ml-handle': {
    fill: mapColors.paper,
    stroke: mapColors.edit,
    strokeWidth: 1.5,
    vectorEffect: 'non-scaling-stroke',
  },
  '& .ml-draft': {
    fill: mapColors.editHit,
    stroke: mapColors.edit,
    strokeWidth: 2,
    vectorEffect: 'non-scaling-stroke',
    pointerEvents: 'none',
  },
  '@media (prefers-reduced-motion: reduce)': {
    '& .ml-box.on.pulse': { animation: 'none' },
    '&.editing .ml-box.on.fitting': { animation: 'none', strokeOpacity: 0.5 },
  },
} as const

const tooltipSx = {
  position: 'absolute',
  left: 0,
  top: 0,
  visibility: 'hidden',
  pointerEvents: 'none',
  px: 0.75,
  py: 0.25,
  borderRadius: '4px',
  bgcolor: 'rgba(31,41,51,0.92)',
  color: '#fff',
  fontSize: 12,
  fontFamily: codeFontFamily,
  whiteSpace: 'nowrap',
  zIndex: 2,
} as const

const legendSx = {
  position: 'absolute',
  left: 12,
  top: 10,
  display: 'flex',
  gap: 0.6,
  flexWrap: 'wrap',
  maxWidth: 'calc(100% - 24px)',
  cursor: 'default',

  '& .ml-legend': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.6,
    height: 28,
    px: 1,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: '999px',
    bgcolor: 'background.paper',
    color: 'text.primary',
    font: 'inherit',
    fontSize: 12,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,.12)',
  },
  '& .ml-legend b': {
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  // mẫu nét: liền / đứt giống khung trên bản đồ
  '& .ml-legend .sw': {
    width: 14,
    height: 10,
    borderRadius: '2px',
    border: '2px solid',
  },
  '& .ml-legend.s-auto .sw': { borderColor: 'var(--ml-auto)', bgcolor: 'color-mix(in srgb, var(--ml-auto) 18%, transparent)' },
  '& .ml-legend.s-manual .sw': { borderColor: 'var(--ml-manual)', bgcolor: 'color-mix(in srgb, var(--ml-manual) 18%, transparent)' },
  '& .ml-legend.s-review .sw': {
    borderColor: 'var(--ml-review)',
    borderStyle: 'dashed',
    bgcolor: 'color-mix(in srgb, var(--ml-review) 18%, transparent)',
  },
  '& .ml-legend.off': {
    opacity: 0.5,
    textDecoration: 'line-through',
    boxShadow: 'none',
  },
  '& .ml-legend:focus-visible': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: 1,
  },
} as const

const titleSx = {
  position: 'absolute',
  right: 12,
  top: 10,
  px: 1,
  py: 0.25,
  fontSize: 12,
  color: 'text.secondary',
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  pointerEvents: 'none',
} as const

const hintSx = {
  position: 'absolute',
  left: '50%',
  top: 46,
  transform: 'translateX(-50%)',
  px: 1.5,
  py: 0.75,
  fontSize: 13,
  color: '#fff',
  bgcolor: mapColors.edit,
  borderRadius: 1.5,
  pointerEvents: 'none',
  zIndex: 1,
} as const

const toolsSx = {
  position: 'absolute',
  left: 12,
  bottom: 12,
  display: 'flex',
  gap: 0.75,
  flexWrap: 'wrap',
  alignItems: 'center',
  maxWidth: 'calc(100% - 24px)',
  cursor: 'default',
} as const

const toolSx = {
  height: 32,
  minWidth: 32,
  bgcolor: 'background.paper',
}

const toolLabelSx = {
  m: 0,
  height: 32,
  pr: 1.25,
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: '10px',
  '& .MuiFormControlLabel-label': {
    fontSize: 12.5,
    whiteSpace: 'nowrap',
  },
  '& .MuiCheckbox-root': {
    p: 0.5,
  },
}

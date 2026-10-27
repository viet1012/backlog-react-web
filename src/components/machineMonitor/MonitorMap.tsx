import GpsFixedRoundedIcon from '@mui/icons-material/GpsFixedRounded'
import {
  Box,
  FormControlLabel,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import type { Theme } from '@mui/material/styles'
import {
  memo,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { keyframes } from '@emotion/react'

import type {
  Bounds,
  LayoutData,
  MachineLayoutConfig,
  MachineMap,
} from '../../types/machineLocator'
import {
  STAGE_UNIT as U,
  boundsOf,
  outlinePath,
  rectPath,
} from '../../utils/machineLocatorGeometry'
import {
  loadPreference,
  savePreference,
} from '../../utils/uiPreferences'
import { AppButton } from '../common/AppButton'
import {
  codeFontFamily,
  mapColors,
} from '../machineLocator/machineLocatorColors'
import { toneColors } from './monitorColors'
import { segmentedSx } from './segmentedSx'
import {
  MONITOR_TONES,
  type MachineMark,
  type MonitorTone,
} from './monitorTypes'

// =========================================================
// BẢN ĐỒ CHỈ XEM (dùng chung cho mọi tab giám sát)
// Cùng hệ toạ độ / ảnh nền / khung với Machine Locator (MapCanvas),
// bỏ phần sửa: chỉ pan / zoom / rê chuột / click chọn máy
// =========================================================

interface MonitorMapProps {
  layout: MachineLayoutConfig
  data: LayoutData
  machines: MachineMap
  // code -> màu / badge; mã không có = tone none
  marks: Record<string, MachineMark>
  // null = không lọc; có Set: máy ngoài Set bị làm mờ
  visible: Set<string> | null
  cur: string | null
  // tăng mỗi lần cần định vị máy cur (bấm dòng / bấm máy): zoom tới máy + hiệu ứng vòng lan
  locateKey: number
  // máy đang được rê chuột trong danh sách bên phải
  listHover: string | null
  onSelect: (code: string | null) => void
  // rê chuột trên bản đồ: máy dưới con trỏ (null = không có) -> highlight dòng ở panel
  onHover: (code: string | null) => void
}

interface Point {
  x: number
  y: number
}

interface Shape {
  c: string
  x: number
  y: number
  w: number
  h: number
  tone: MonitorTone
  dashed: boolean
  d: string
}

interface Label {
  c: string
  tone: MonitorTone
  badge?: number
  // điểm neo (px stage): giữa cạnh trên khối máy
  left: number
  top: number
}

type BackgroundMode = 'clear' | 'dim' | 'hidden'

const BACKGROUND_MODES: { id: BackgroundMode, label: string }[] = [
  { id: 'clear', label: 'Rõ' },
  { id: 'dim', label: 'Mờ' },
  { id: 'hidden', label: 'Ẩn' },
]

const PREF_BACKGROUND = 'machine-monitor:background'
const PREF_SHOW_SAFE = 'machine-monitor:showSafe'
const DRAG_THRESHOLD = 4
const TOOLTIP_DELAY = 250
// scale (cho chống chồng nhãn) chỉ commit khi zoom dừng
const SCALE_COMMIT_DELAY = 120
// "Xem toàn bộ": lề quanh crop (px màn hình)
const FIT_PAD = 24
// ước lượng kích thước pill nhãn (px màn hình) để chống chồng
const LABEL_H = 18
const LABEL_CHAR_W = 6.7
const LABEL_PAD_X = 12
const LABEL_BADGE_W = 20
const LABEL_GAP = 3

// máy có lỗi chưa đóng: fill đậm, halo, viền trắng, nhãn
const ACTIVE_TONES = new Set<MonitorTone>(['critical', 'bad', 'warn'])

// hiệu ứng định vị: 3 vòng × 3 lần ≈ 2.5s
const RIPPLE_CYCLE_MS = 830
const RIPPLE_MS = RIPPLE_CYCLE_MS * 3 + 100

const ripplePulse = keyframes`
  0% { transform: translate(-50%, -50%) scale(.15); opacity: .9; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
`

// OVERDUE: halo nhấp nháy nhẹ
const haloPulse = keyframes`
  0%, 100% { stroke-opacity: .35; stroke-width: 6px; }
  50% { stroke-opacity: .15; stroke-width: 10px; }
`

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// lớp khung: memo, không render lại khi pan / zoom / hover.
// shapes đã sắp nhẹ -> nặng; halo + viền trắng + khung vẽ theo từng máy để máy nặng nằm trên.
// quiet: không vẽ máy SAFE / không dữ liệu (nền CAD đã có nét máy), trừ máy đang chọn.
// showSafe: vẫn vẽ máy SAFE (có lỗi đã an toàn trong khoảng) bằng viền xanh, nằm dưới máy lỗi chưa đóng
const ShapeLayer = memo(function ShapeLayer({
  shapes,
  visible,
  cur,
  quiet,
  showSafe,
}: {
  shapes: Shape[]
  visible: Set<string> | null
  cur: string | null
  quiet: boolean
  showSafe: boolean
}) {
  return (
    <>
      {shapes.map((s, k) => {
        const active = ACTIVE_TONES.has(s.tone)
        const hist = showSafe && s.tone === 'ok'

        if (quiet && !active && !hist && s.c !== cur) return null

        const dim = visible && !visible.has(s.c) && s.c !== cur ? ' dim' : ''

        return (
          <g
            key={k}
            className={`t-${s.tone}${s.dashed ? ' dash' : ''}${hist ? ' hist' : ''}${dim}${s.c === cur ? ' sel' : ''}`}
            data-c={s.c}
          >
            {active && <path className="mm-halo" d={s.d} />}
            {active && <path className="mm-edge" d={s.d} />}
            <path className={'mm-box' + (s.c === cur ? ' on' : '')} d={s.d} />
          </g>
        )
      })}
    </>
  )
})

export const MonitorMap = memo(function MonitorMap({
  layout,
  data,
  machines,
  marks,
  visible,
  cur,
  locateKey,
  listHover,
  onSelect,
  onHover,
}: MonitorMapProps) {
  const [CX, CY, CW, CH] = data.crop
  const SW = CW * U
  const SH = CH * U

  const mapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const view = useRef({ s: 1, tx: 0, ty: 0 })
  const [scale, setScale] = useState(1)
  const frame = useRef(0)
  const timers = useRef({ tip: 0, scale: 0, ripple: 0 })

  // nền bản vẽ: rõ / mờ (mặc định) / ẩn
  const [background, setBackground] = useState<BackgroundMode>(() => {
    const v = loadPreference(PREF_BACKGROUND)

    return BACKGROUND_MODES.some((m) => m.id === v) ? v as BackgroundMode : 'dim'
  })

  useEffect(() => {
    savePreference(PREF_BACKGROUND, background)
  }, [background])

  // vẽ máy có lỗi đã an toàn trong khoảng lịch sử; mặc định tắt
  const [showSafe, setShowSafe] = useState(() => loadPreference(PREF_SHOW_SAFE) === true)

  useEffect(() => {
    savePreference(PREF_SHOW_SAFE, showSafe)
  }, [showSafe])

  // khung tô màu theo mark của tab
  const shapes = useMemo(() => {
    const out: Shape[] = []

    for (const c in machines) {
      const tone = marks[c]?.tone ?? 'none'
      const dashed = !!marks[c]?.dashed

      for (const b of machines[c].boxes) {
        out.push({ c, x: b.x, y: b.y, w: b.w, h: b.h, tone, dashed, d: b.p ? outlinePath(b.p) : rectPath(b) })
      }
    }

    // máy nặng vẽ sau (nằm trên)
    const order = (t: MonitorTone) => MONITOR_TONES.length - MONITOR_TONES.indexOf(t)

    return out.sort((a, b) => order(a.tone) - order(b.tone))
  }, [machines, marks])

  // =======================================================
  // NHÃN MÃ MÁY (máy có lỗi chưa đóng): pill sát cạnh trên khối máy, badge ở cuối pill.
  // Chống chồng theo px màn hình (tính lại khi zoom dừng): chồng nhau thì máy nhẹ hơn ẩn nhãn
  // =======================================================

  const labels = useMemo(() => {
    const cand: (Label & { rank: number })[] = []

    for (const c in marks) {
      const m = marks[c]
      const boxes = machines[c]?.boxes

      if (!boxes?.length || (!ACTIVE_TONES.has(m.tone) && c !== cur)) continue

      const [x0, y0, x1] = boundsOf(boxes)

      cand.push({
        c,
        tone: m.tone,
        badge: m.badge,
        left: ((x0 + x1) / 2 - CX) * U,
        top: (y0 - CY) * U,
        // máy đang chọn luôn có nhãn
        rank: c === cur ? Infinity : m.rank,
      })
    }

    cand.sort((a, b) => b.rank - a.rank)

    const placed: [number, number, number, number][] = []
    const out: Label[] = []

    for (const l of cand) {
      const w = l.c.length * LABEL_CHAR_W + LABEL_PAD_X + (l.badge ? LABEL_BADGE_W : 0)
      const x = l.left * scale
      const y = l.top * scale
      const r: [number, number, number, number] = [x - w / 2, y - LABEL_GAP - LABEL_H, x + w / 2, y - LABEL_GAP]

      if (placed.some((p) => r[0] < p[2] && r[2] > p[0] && r[1] < p[3] && r[3] > p[1])) continue

      placed.push(r)
      out.push(l)
    }

    // máy nhẹ vẽ trước, máy nặng nằm trên
    return out.reverse()
  }, [marks, machines, cur, scale, CX, CY])

  // máy đang chọn không có trong marks (không dữ liệu): chip vàng như Machine Locator
  const selChip = useMemo(() => {
    const boxes = cur ? machines[cur]?.boxes : undefined

    if (!cur || !boxes?.length || marks[cur]) return null

    const [x0, y0, x1] = boundsOf(boxes)

    return { code: cur, left: ((x0 + x1) / 2 - CX) * U, top: (y0 - CY) * U }
  }, [cur, machines, marks, CX, CY])

  // =======================================================
  // VIEW TRANSFORM
  // =======================================================

  function writeTransform(anim: boolean) {
    const stage = stageRef.current

    if (!stage) return

    const { s, tx, ty } = view.current

    stage.style.transition = anim ? 'transform .4s ease' : 'none'
    stage.style.transform = `translate(${tx}px,${ty}px) scale(${s})`
    stage.style.setProperty('--mm-inv', String(1 / s))
  }

  function commitScaleSoon() {
    window.clearTimeout(timers.current.scale)
    timers.current.scale = window.setTimeout(() => setScale(view.current.s), SCALE_COMMIT_DELAY)
  }

  function scheduleApply() {
    if (!frame.current) {
      frame.current = requestAnimationFrame(() => {
        frame.current = 0
        writeTransform(false)
      })
    }
  }

  function mapSize() {
    const map = mapRef.current

    return { W: map?.clientWidth ?? 0, H: map?.clientHeight ?? 0 }
  }

  // "Xem toàn bộ" (mặc định khi mở tab): cả crop của floor, lề FIT_PAD, không cắt tường trên / dưới
  function fitScale() {
    const { W, H } = mapSize()

    return Math.max(Math.min((W - FIT_PAD * 2) / SW, (H - FIT_PAD * 2) / SH), 0.01)
  }

  function fit(anim: boolean) {
    const { W, H } = mapSize()
    const s = fitScale()

    view.current = { s, tx: (W - SW * s) / 2, ty: (H - SH * s) / 2 }
    writeTransform(anim)
    commitScaleSoon()
  }

  function zoomAt(f: number, cx: number, cy: number) {
    const { s, tx, ty } = view.current
    const ns = Math.max(fitScale() * 0.8, Math.min(s * f, 6))

    view.current = { s: ns, tx: cx - (cx - tx) * ns / s, ty: cy - (cy - ty) * ns / s }
    scheduleApply()
    commitScaleSoon()
  }

  function zoomCenter(f: number) {
    const { W, H } = mapSize()

    zoomAt(f, W / 2, H / 2)
  }

  function focusBox([x0, y0, x1, y1]: Bounds) {
    const { W, H } = mapSize()
    const pad = 80
    const s = Math.max(Math.min((W - pad * 2) / ((x1 - x0) * U), (H - pad * 2) / ((y1 - y0) * U), 0.8), fitScale())

    view.current = {
      s,
      tx: W / 2 - (((x0 + x1) / 2 - CX) * U) * s,
      ty: H / 2 - (((y0 + y1) / 2 - CY) * U) * s,
    }
    writeTransform(!prefersReducedMotion())
    commitScaleSoon()
  }

  function toPt(clientX: number, clientY: number): Point {
    const r = mapRef.current!.getBoundingClientRect()
    const { s, tx, ty } = view.current

    return { x: CX + ((clientX - r.left) - tx) / (s * U), y: CY + ((clientY - r.top) - ty) / (s * U) }
  }

  // khung nhỏ nhất chứa điểm (máy không vẽ / đang bị làm mờ vẫn chọn được)
  function hitTest(p: Point): Shape | null {
    let best: Shape | null = null

    for (const h of shapes) {
      if (p.x >= h.x && p.x <= h.x + h.w && p.y >= h.y && p.y <= h.y + h.h
        && (!best || h.w * h.h < best.w * best.h)) best = h
    }

    return best
  }

  const refit = useEffectEvent(() => fit(false))

  const onWheel = useEffectEvent((e: WheelEvent) => {
    e.preventDefault()
    hideHover()

    const r = mapRef.current!.getBoundingClientRect()

    zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top)
  })

  // =======================================================
  // ĐỊNH VỊ: zoom mượt tới máy + 3 vòng tròn lan từ tâm máy (màu status), ~2.5s rồi tắt
  // =======================================================

  const [ripple, setRipple] = useState<{ id: number, left: number, top: number, tone: MonitorTone } | null>(null)

  function locate(code: string | null) {
    const boxes = code ? machines[code]?.boxes : undefined

    window.clearTimeout(timers.current.ripple)
    setRipple(null)

    if (!code || !boxes?.length) return

    const [x0, y0, x1, y1] = boundsOf(boxes)

    focusBox([x0, y0, x1, y1])

    if (prefersReducedMotion()) return

    setRipple({
      id: Date.now(),
      left: ((x0 + x1) / 2 - CX) * U,
      top: ((y0 + y1) / 2 - CY) * U,
      tone: marks[code]?.tone ?? 'none',
    })
    timers.current.ripple = window.setTimeout(() => setRipple(null), RIPPLE_MS)
  }

  const locateCur = useEffectEvent(() => locate(cur))

  useLayoutEffect(() => {
    const map = mapRef.current

    if (!map) return

    refit()

    const observer = new ResizeObserver(() => refit())

    observer.observe(map)

    return () => observer.disconnect()
  }, [SW, SH])

  useEffect(() => {
    const map = mapRef.current

    if (!map) return

    const handler = (e: WheelEvent) => onWheel(e)

    map.addEventListener('wheel', handler, { passive: false })

    return () => map.removeEventListener('wheel', handler)
  }, [])

  // bấm dòng / bấm máy (parent tăng locateKey) -> định vị
  useEffect(() => {
    if (locateKey) locateCur()
  }, [locateKey])

  // bỏ chọn -> tắt hiệu ứng
  useEffect(() => {
    if (!cur) setRipple(null)
  }, [cur])

  useEffect(() => {
    const t = timers.current

    return () => {
      cancelAnimationFrame(frame.current)
      window.clearTimeout(t.tip)
      window.clearTimeout(t.scale)
      window.clearTimeout(t.ripple)
    }
  }, [])

  // =======================================================
  // HOVER đồng bộ với panel (data-hov trên <g> của máy, class has-hov trên svg; không setState)
  // + TOOLTIP
  // =======================================================

  const hoverCode = useRef<string | null>(null)

  // máy được highlight: viền đậm; các máy lỗi khác giảm opacity
  function markHover(code: string | null) {
    const svg = svgRef.current
    const stage = stageRef.current

    if (!svg) return

    svg.querySelectorAll('[data-hov]').forEach((el) => el.removeAttribute('data-hov'))
    stage?.querySelectorAll('.mm-label[data-hov]').forEach((el) => el.removeAttribute('data-hov'))

    const sel = code ? `[data-c="${CSS.escape(code)}"]` : null
    const hits = sel ? svg.querySelectorAll(sel) : []

    hits.forEach((el) => el.setAttribute('data-hov', ''))
    if (sel) stage?.querySelectorAll(`.mm-label${sel}`).forEach((el) => el.setAttribute('data-hov', ''))
    svg.classList.toggle('has-hov', hits.length > 0)
  }

  // rê trong danh sách / lớp khung render lại -> đánh dấu lại
  useEffect(() => {
    markHover(hoverCode.current ?? listHover)
  })

  function setHoverCode(code: string | null) {
    if (code === hoverCode.current) return

    hoverCode.current = code
    markHover(code ?? listHover)
    onHover(code)
  }

  function hideHover() {
    window.clearTimeout(timers.current.tip)
    setHoverCode(null)
    if (tooltipRef.current) tooltipRef.current.style.visibility = 'hidden'
    if (mapRef.current && !press.current) mapRef.current.style.cursor = ''
  }

  function onHoverMove(clientX: number, clientY: number) {
    const hit = hitTest(toPt(clientX, clientY))
    const code = hit?.c ?? null
    const tip = tooltipRef.current
    const map = mapRef.current

    if (map) map.style.cursor = hit ? 'pointer' : ''

    if (code !== hoverCode.current) {
      setHoverCode(code)
      window.clearTimeout(timers.current.tip)
      if (tip) tip.style.visibility = 'hidden'
    }

    if (!code || !tip || !map) return

    const r = map.getBoundingClientRect()

    tip.style.left = `${clientX - r.left + 12}px`
    tip.style.top = `${clientY - r.top + 14}px`

    if (tip.style.visibility === 'visible') return

    // mã · status · area · quá hạn N ngày …
    timers.current.tip = window.setTimeout(() => {
      if (hoverCode.current !== code) return
      tip.textContent = `${code} · ${marks[code]?.sub ?? 'Không có dữ liệu'}`
      tip.style.visibility = 'visible'
    }, TOOLTIP_DELAY)
  }

  // =======================================================
  // POINTER: kéo = pan, 2 ngón = zoom, click = chọn máy / bỏ chọn
  // =======================================================

  const pts = useRef(new Map<number, Point>())
  const press = useRef<{ start: Point, last: Point, pan: boolean } | null>(null)
  const pinch = useRef<number | null>(null)

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return

    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    hideHover()

    try {
      mapRef.current?.setPointerCapture(e.pointerId)
    } catch {
      // pointer có thể đã kết thúc
    }

    if (pts.current.size === 2) {
      const [a, b] = [...pts.current.values()]

      press.current = null
      pinch.current = Math.hypot(a.x - b.x, a.y - b.y)
      return
    }

    const p = { x: e.clientX, y: e.clientY }

    press.current = { start: p, last: p, pan: false }
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!pts.current.has(e.pointerId)) {
      if (e.pointerType === 'mouse') onHoverMove(e.clientX, e.clientY)
      return
    }

    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pts.current.size === 2 && pinch.current) {
      const [a, b] = [...pts.current.values()]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      const r = mapRef.current!.getBoundingClientRect()

      zoomAt(d / pinch.current, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top)
      pinch.current = d
      return
    }

    const op = press.current

    if (!op) return

    if (!op.pan) {
      if (Math.hypot(e.clientX - op.start.x, e.clientY - op.start.y) <= DRAG_THRESHOLD) return
      op.pan = true
      if (mapRef.current) mapRef.current.style.cursor = 'grabbing'
    }

    view.current.tx += e.clientX - op.last.x
    view.current.ty += e.clientY - op.last.y
    op.last = { x: e.clientX, y: e.clientY }
    scheduleApply()
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!pts.current.has(e.pointerId)) return

    pts.current.delete(e.pointerId)
    if (pts.current.size < 2) pinch.current = null
    if (pts.current.size > 0) return

    const op = press.current

    press.current = null
    if (mapRef.current) mapRef.current.style.cursor = ''

    if (op && !op.pan) {
      const hit = hitTest(toPt(e.clientX, e.clientY))

      onSelect(hit ? hit.c : null)
    }

    if (e.pointerType === 'mouse') onHoverMove(e.clientX, e.clientY)
  }

  function onPointerCancel(e: ReactPointerEvent<HTMLDivElement>) {
    pts.current.delete(e.pointerId)
    pinch.current = null

    if (!pts.current.size) {
      press.current = null
      if (mapRef.current) mapRef.current.style.cursor = ''
    }
  }

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <Box sx={rootSx}>
      {/* TOOLBAR riêng phía trên bản đồ: chỉ nền + zoom (số liệu nằm ở panel phải) */}
      <Box sx={toolbarSx}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Nền:</Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={background}
          onChange={(_, v: BackgroundMode | null) => {
            if (v) setBackground(v)
          }}
          aria-label="Nền bản vẽ"
          sx={segmentedSx}
        >
          {BACKGROUND_MODES.map((m) => (
            <ToggleButton key={m.id} value={m.id}>{m.label}</ToggleButton>
          ))}
        </ToggleButtonGroup>

        <FormControlLabel
          sx={{
            m: 0,
            ml: 0.5,
            '& .MuiFormControlLabel-label': { fontSize: 12, whiteSpace: 'nowrap' },
          }}
          control={(
            <Switch
              size="small"
              checked={showSafe}
              onChange={(e) => setShowSafe(e.target.checked)}
            />
          )}
          label="Hiện máy đã an toàn"
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 'auto' }}>
          {cur && machines[cur] && (
            <Tooltip title={`Định vị lại ${cur}`}>
              <AppButton
                compact
                aria-label="Định vị lại"
                icon={<GpsFixedRoundedIcon sx={{ fontSize: 17 }} />}
                onClick={() => locate(cur)}
                sx={toolSx}
              />
            </Tooltip>
          )}
          <AppButton compact aria-label="Thu nhỏ" onClick={() => zoomCenter(1 / 1.4)} sx={toolSx}>
            −
          </AppButton>
          <AppButton compact aria-label="Phóng to" onClick={() => zoomCenter(1.4)} sx={toolSx}>
            +
          </AppButton>
          <AppButton onClick={() => fit(true)} sx={toolSx}>
            Xem toàn bộ
          </AppButton>
        </Box>
      </Box>

      <Box
        ref={mapRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={() => {
          if (!pts.current.size) hideHover()
        }}
        sx={mapAreaSx}
      >
        <Box
          ref={stageRef}
          className={`bg-${background}${cur ? ' has-sel' : ''}`}
          sx={stageSx}
          style={{ width: SW, height: SH }}
        >
          {/* Ẩn: không vẽ ảnh, chỉ còn đường bao máy trên nền trắng */}
          {background !== 'hidden' && (
            <Box
              component="img"
              src={layout.image}
              alt={layout.imageAlt}
              draggable={false}
              decoding="async"
              className="mm-bg"
            />
          )}

          <Box
            component="svg"
            ref={svgRef}
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`${CX} ${CY} ${CW} ${CH}`}
            className={cur ? 'has-sel' : undefined}
            sx={svgSx}
          >
            <ShapeLayer
              shapes={shapes}
              visible={visible}
              cur={cur}
              quiet={background !== 'hidden'}
              showSafe={showSafe}
            />
          </Box>

          {/* nhãn mã máy: cỡ cố định trên màn hình (scale ngược), badge số lỗi ở cuối pill */}
          {labels.map((l) => (
            <div key={l.c} className="mm-anchor" style={{ left: l.left, top: l.top }}>
              <span
                className={`mm-label t-${l.tone}`
                  + (l.c === cur ? ' on' : '')
                  + (visible && !visible.has(l.c) && l.c !== cur ? ' dim' : '')}
                data-c={l.c}
              >
                {l.c}
                {l.badge ? <b>{l.badge}</b> : null}
              </span>
            </div>
          ))}

          {selChip && (
            <div className="mm-anchor" style={{ left: selChip.left, top: selChip.top }}>
              <span className="mm-chip-sel">{selChip.code}</span>
            </div>
          )}

          {/* hiệu ứng định vị: key mới mỗi lần -> chạy lại animation */}
          {ripple && (
            <div key={ripple.id} className="mm-anchor" style={{ left: ripple.left, top: ripple.top }}>
              <span className={`mm-ripple t-${ripple.tone}`}>
                <i />
                <i />
                <i />
              </span>
            </div>
          )}
        </Box>

        <Box ref={tooltipRef} sx={tooltipSx} />
      </Box>
    </Box>
  )
})

// =========================================================
// STYLES
// =========================================================

// --mm-<tone>: màu theo mức cho light / dark
const rootSx = (theme: Theme) => {
  const dark = theme.palette.mode === 'dark'
  const vars: Record<string, string> = {}

  for (const t of MONITOR_TONES) vars[`--mm-${t}`] = dark ? toneColors[t].dark : toneColors[t].light

  return {
    ...vars,
    '--mm-sel': dark ? '#ffc928' : mapColors.mark,
    // viền máy đang chọn: đen (sáng) / trắng (tối)
    '--mm-sel-line': dark ? '#ffffff' : '#0b0f0d',
    // máy đã an toàn trong khoảng (toggle "Hiện máy đã an toàn")
    '--mm-hist': dark ? toneColors.ok.dark : '#2b7d50',

    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: 0,
  }
}

const toolbarSx = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 0.75,
  px: 1.5,
  py: 0.75,
  borderBottom: '1px solid',
  borderColor: 'divider',
} as const

const mapAreaSx = (theme: Theme) => ({
  position: 'relative',
  flex: 1,
  overflow: 'hidden',
  touchAction: 'none',
  userSelect: 'none',
  minWidth: 0,
  minHeight: 0,
  bgcolor: theme.palette.mode === 'dark' ? '#1b201e' : '#f5f6f4',
  cursor: 'grab',
})

const stageSx = {
  '--mm-inv': '1',

  position: 'absolute',
  left: 0,
  top: 0,
  transformOrigin: '0 0',
  bgcolor: mapColors.paper,
  boxShadow: (theme: Theme) => `0 0 0 1px ${theme.palette.divider}`,

  '& .mm-bg': {
    display: 'block',
    width: '100%',
    height: '100%',
    userSelect: 'none',
    pointerEvents: 'none',
  },
  // Rõ: xám, gần như nguyên bản
  '&.bg-clear .mm-bg': {
    opacity: 0.85,
    filter: 'grayscale(1)',
  },
  // Mờ: giữ nét CAD sắc nhưng chìm (giảm tương phản + sáng lên), không giảm opacity cả ảnh
  '&.bg-dim .mm-bg': {
    filter: 'grayscale(1) contrast(.55) brightness(1.18)',
  },

  // điểm neo theo toạ độ stage; scale ngược -> nhãn giữ cỡ cố định trên màn hình
  '& .mm-anchor': {
    position: 'absolute',
    width: 0,
    height: 0,
    transform: 'scale(var(--mm-inv))',
    transformOrigin: '0 0',
    pointerEvents: 'none',
  },
  '& .mm-anchor:has(.mm-label)': { zIndex: 2 },
  '& .mm-anchor:has(.mm-label.on), & .mm-anchor:has(.mm-chip-sel)': { zIndex: 3 },

  // pill mã máy: sát cạnh trên khối máy, viền màu status
  '& .mm-label': {
    position: 'absolute',
    left: 0,
    bottom: LABEL_GAP,
    transform: 'translateX(-50%)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    boxSizing: 'border-box',
    height: LABEL_H,
    pl: '5px',
    pr: '5px',
    borderRadius: '9px',
    border: '1.5px solid var(--mm-c)',
    bgcolor: '#fff',
    color: '#1f2933',
    boxShadow: '0 1px 3px rgba(0,0,0,.22)',
    font: `600 11px/1 ${codeFontFamily}`,
    whiteSpace: 'nowrap',
    transition: 'opacity .15s',
  },
  // badge số lỗi ở cuối pill
  '& .mm-label b': {
    minWidth: 14,
    height: 13,
    px: '3px',
    mr: '-2px',
    borderRadius: '7px',
    bgcolor: 'var(--mm-c)',
    color: '#fff',
    font: `700 10px/13px ${codeFontFamily}`,
    textAlign: 'center',
  },
  '& .mm-label.t-critical': { '--mm-c': 'var(--mm-critical)' },
  '& .mm-label.t-bad': { '--mm-c': 'var(--mm-bad)' },
  '& .mm-label.t-warn': { '--mm-c': 'var(--mm-warn)' },
  '& .mm-label.t-ok': { '--mm-c': 'var(--mm-ok)' },
  '& .mm-label.t-none': { '--mm-c': 'var(--mm-none)' },
  // nhãn máy đang chọn: phóng to + viền đậm
  '& .mm-label.on': {
    transform: 'translateX(-50%) scale(1.25)',
    transformOrigin: '50% 100%',
    borderWidth: '2.5px',
    borderColor: 'var(--mm-sel-line)',
    boxShadow: '0 2px 8px rgba(0,0,0,.4)',
  },
  '& .mm-label[data-hov]': { boxShadow: '0 0 0 2px var(--mm-c), 0 2px 6px rgba(0,0,0,.3)' },
  // đang chọn 1 máy: nhãn các máy khác lùi xuống
  '&.has-sel .mm-label:not(.on):not(.dim)': { opacity: 0.35 },
  '& .mm-label.dim': { opacity: 0.1 },

  // hiệu ứng định vị: 3 vòng tròn lan từ tâm máy, màu status
  '& .mm-anchor:has(.mm-ripple)': { zIndex: 1 },
  '& .mm-ripple i': {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 96,
    height: 96,
    borderRadius: '50%',
    border: '3px solid var(--mm-c)',
    boxShadow: '0 0 0 1px rgba(255,255,255,.7)',
    opacity: 0,
    animation: `${ripplePulse} ${RIPPLE_CYCLE_MS}ms ease-out 3`,
  },
  '& .mm-ripple i:nth-of-type(2)': { animationDelay: '180ms' },
  '& .mm-ripple i:nth-of-type(3)': { animationDelay: '360ms' },
  '& .mm-ripple.t-critical': { '--mm-c': 'var(--mm-critical)' },
  '& .mm-ripple.t-bad': { '--mm-c': 'var(--mm-bad)' },
  '& .mm-ripple.t-warn': { '--mm-c': 'var(--mm-warn)' },
  '& .mm-ripple.t-ok': { '--mm-c': 'var(--mm-ok)' },
  '& .mm-ripple.t-none': { '--mm-c': 'var(--mm-sel-line)' },
  '@media (prefers-reduced-motion: reduce)': {
    '& .mm-ripple': { display: 'none' },
  },

  '& .mm-chip-sel': {
    position: 'absolute',
    left: 0,
    bottom: 6,
    transform: 'translateX(-50%)',
    px: '7px',
    py: '2px',
    borderRadius: '5px',
    bgcolor: 'var(--mm-sel)',
    color: mapColors.markInk,
    boxShadow: '0 2px 6px rgba(0,0,0,.3)',
    font: `700 13px ${codeFontFamily}`,
    whiteSpace: 'nowrap',
  },
} as const

const svgSx = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',

  // mỗi máy = <g class="t-<tone>" data-c> chứa halo + viền trắng (máy có lỗi chưa đóng) + khung
  '& .t-critical': { '--mm-c': 'var(--mm-critical)' },
  '& .t-bad': { '--mm-c': 'var(--mm-bad)' },
  '& .t-warn': { '--mm-c': 'var(--mm-warn)' },
  '& .t-ok': { '--mm-c': 'var(--mm-ok)' },
  '& .t-none': { '--mm-c': 'var(--mm-none)' },
  '& g': { transition: 'opacity .15s' },
  // "chỉ hiện chưa đóng" / đang tìm: máy khác gần như ẩn
  '& g.dim': { opacity: 0.1 },
  // đang hover / đang chọn 1 máy: các máy lỗi khác lùi xuống (tới khi bỏ chọn)
  // (:not(.dim): máy đang bị lọc vẫn giữ 0.1)
  '&.has-hov g.t-critical:not([data-hov]):not(.dim), &.has-hov g.t-bad:not([data-hov]):not(.dim), &.has-hov g.t-warn:not([data-hov]):not(.dim)': {
    opacity: 0.35,
  },
  '&.has-sel g.t-critical:not(.sel):not([data-hov]):not(.dim), &.has-sel g.t-bad:not(.sel):not([data-hov]):not(.dim), &.has-sel g.t-warn:not(.sel):not([data-hov]):not(.dim)': {
    opacity: 0.35,
  },

  '& path': {
    strokeLinejoin: 'round',
    vectorEffect: 'non-scaling-stroke',
    pointerEvents: 'none',
  },

  // halo: viền ngoài cùng màu để máy nhỏ vẫn thấy
  '& .mm-halo': {
    fill: 'none',
    stroke: 'var(--mm-c)',
    strokeWidth: 6,
    strokeOpacity: 0.35,
  },
  '& .t-critical .mm-halo': { animation: `${haloPulse} 1.6s ease-in-out infinite` },
  // viền trắng 1.5px bên ngoài viền màu (2.5 + 2×1.5) để tách khỏi nét CAD
  '& .mm-edge': {
    fill: 'none',
    stroke: '#fff',
    strokeWidth: 5.5,
  },

  '& .mm-box': { stroke: 'var(--mm-c)' },
  // không có dữ liệu (chỉ vẽ ở nền Ẩn): không fill, viền xám nhạt, không nổi khi hover
  '& .t-none .mm-box': { fill: 'none', strokeWidth: 1, strokeOpacity: 0.55 },
  // SAFE (chỉ vẽ ở nền Ẩn): không fill, viền xanh nhạt mảnh
  '& .t-ok .mm-box': { fill: 'none', strokeWidth: 1.2, strokeOpacity: 0.6 },
  // "Hiện máy đã an toàn": viền xanh 2px + fill rất nhạt
  '& .t-ok.hist .mm-box': {
    stroke: 'var(--mm-hist)',
    fill: 'var(--mm-hist)',
    fillOpacity: 0.08,
    strokeWidth: 2,
    strokeOpacity: 1,
  },
  // lỗi chưa đóng: fill đậm, viền dày
  '& .t-critical .mm-box, & .t-bad .mm-box': { fill: 'var(--mm-c)', fillOpacity: 0.55, strokeWidth: 2.5 },
  '& .t-warn .mm-box': { fill: 'var(--mm-c)', fillOpacity: 0.5, strokeWidth: 2.5 },
  // NG: viền nét đứt để phân biệt với OPEN (cùng màu)
  '& .dash .mm-box': { strokeDasharray: '5 3' },

  '& .t-ok[data-hov] .mm-box': { strokeWidth: 2, strokeOpacity: 1 },
  '& g[data-hov] .mm-box': { strokeWidth: 3.5 },
  '& g.t-critical[data-hov] .mm-edge, & g.t-bad[data-hov] .mm-edge, & g.t-warn[data-hov] .mm-edge': {
    strokeWidth: 6.5,
  },

  // máy đang chọn: viền đen / trắng đậm, luôn rõ kể cả khi bị lọc
  '& .mm-box.on': {
    stroke: 'var(--mm-sel-line)',
    strokeWidth: 3.5,
    strokeOpacity: 1,
  },

  '@media (prefers-reduced-motion: reduce)': {
    '& .t-critical .mm-halo': { animation: 'none' },
  },
} as const

const tooltipSx = {
  position: 'absolute',
  left: 0,
  top: 0,
  visibility: 'hidden',
  pointerEvents: 'none',
  maxWidth: 360,
  px: 0.75,
  py: 0.25,
  borderRadius: '4px',
  bgcolor: 'rgba(31,41,51,0.92)',
  color: '#fff',
  fontSize: 12,
  whiteSpace: 'normal',
  zIndex: 4,
} as const

const toolSx = {
  height: 30,
  minWidth: 30,
}

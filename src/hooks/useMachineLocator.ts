import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  deleteMachineEdit,
  getBrowserEdits,
  loadMachineStore,
  machineStoreErrorMessage,
  machineStoreMode,
  migrateBrowserEdits,
  setMachineEdit,
  type MachineStoreState,
} from '../services/machineLocatorService'
import type {
  Bounds,
  Box,
  DrawMode,
  FitBatch,
  FitBatchRow,
  FitMode,
  FitRecipe,
  FitResult,
  FitSession,
  FitStroke,
  FitToast,
  FitTune,
  FitView,
  Polygon,
  LayoutData,
  MachineDraft,
  MachineEdits,
  MachineLayoutConfig,
  PanelMode,
  RawBox,
  StatusKind,
  StatusMessage,
} from '../types/machineLocator'
import {
  FIT_EXPAND,
  FIT_GAP_DEFAULT,
  FIT_GAP_MAX,
  FIT_GAP_MIN,
  FIT_POINT_REGION_PX,
  FIT_REVIEW_SHIFT,
  FIT_TIGHTNESS_DEFAULT,
  TIDY_LEVEL_DEFAULT,
  TIDY_LEVEL_MAX,
  TIDY_LEVEL_MIN,
  epsFromTightness,
  fitShift,
} from '../utils/machineLocatorFit'
import {
  MachineFitter,
  type FitOutcome,
  type FitterState,
} from '../utils/machineLocatorFitClient'
import {
  ALL_GROUPS_VISIBLE,
  boundsOf,
  buildBaseBoxes,
  buildEffectiveMachines,
  compareCodes,
  editBody,
  normalizeFitMode,
  round1,
  sameBoxes,
  sameOutlines,
  type GroupVisibility,
  type MachineStatus,
} from '../utils/machineLocatorGeometry'
import {
  buildMachinesCsv,
  buildMachinesJson,
  dateStamp,
  downloadFile,
  planJsonImport,
} from '../utils/machineLocatorExport'
import {
  loadPreference,
  savePreference,
} from '../utils/uiPreferences'

// Yêu cầu MapCanvas đưa vùng bounds vào tầm nhìn (hoặc zoom tới)
export interface RevealRequest {
  id: number
  bounds: Bounds
  zoom: boolean
  pulse: boolean
}

interface SelectOptions {
  keepView?: boolean
  // dùng khi vừa bật chế độ sửa trong cùng thao tác (state chưa cập nhật)
  editing?: boolean
  // ép zoom tới máy (bỏ qua tuỳ chọn "Zoom tới máy khi chọn")
  zoom?: boolean
}

// 1 bước hoàn tác: bản nháp ngay trước khi kéo / ôm / sửa
interface UndoEntry {
  id: number
  code: string
  boxes: Box[]
  act: number
  dirty: boolean
}

// yêu cầu ôm 1 khung của bản nháp; from = khung lúc yêu cầu (phải còn y nguyên khi có kết quả)
interface FitRequest {
  code: string
  i: number
  // null: thêm khung mới ở vị trí i (ôm quanh điểm click khi máy chưa có khung)
  from: Box | null
  recipe: FitRecipe
  // fit: ôm mới (thả chuột / nút F / click chế độ fit); refine: tinh chỉnh (click khối, bút, cắt);
  // tune: đổi "Độ sát" / "Nắn vuông góc"
  kind: 'fit' | 'refine' | 'tune'
  // bấm nút / phím F / click (không phải tự ôm sau khi thả)
  manual: boolean
  // chỉ xem trước (nét đứt), chưa đổi bản nháp – click chế độ fit ngoài khung đang chọn
  ghost?: { append: boolean }
}

// Kết quả ôm quanh điểm click ngoài khung đang chọn: chỉ xem trước, Enter mới áp dụng
// (thay khung i, hoặc thêm khung khi máy chưa có khung), Esc bỏ
interface FitGhost {
  code: string
  i: number
  append: boolean
  session: FitSession
  mode: FitMode
}

// Đang xem trước kết quả ôm của 1 khung (Enter = nhận, Esc = hủy về trước lần ôm)
interface FitPreviewState {
  code: string
  i: number
  // bước hoàn tác ngay trước lần ôm (Esc quay về đó)
  undoId: number
}

// Đang xem trước "Làm gọn" đường bao khung i (Enter = áp dụng, Esc = bỏ).
// from: đường bao lúc bấm – khung đổi đường bao (kéo đỉnh, ôm lại, hoàn tác…) thì bản xem trước hết hiệu lực
interface TidyPreviewState {
  code: string
  i: number
  from: Polygon[]
  // null: đang tính lần đầu
  polys: Polygon[] | null
}

// Phím giữ khi thả chuột: alt = không tự ôm, shift = chỉ tìm trong khung (không nới)
export interface DropMods {
  alt: boolean
  shift: boolean
}

const PREF_ZOOM_ON_SELECT = 'machine-locator:zoomOnSelect'
const PREF_DIM_BACKGROUND = 'machine-locator:dimBackground'
const PREF_CAD_OUTLINE = 'machine-locator:cadOutline'
const PREF_AUTO_FIT = 'machine-locator:autoFit'
const PREF_FIT_MODE = 'machine-locator:fitMode'
const PREF_FIT_TIGHTNESS = 'machine-locator:fitTightness'
const PREF_FIT_ORTHO = 'machine-locator:fitOrtho'
const PREF_FIT_GAP = 'machine-locator:fitGap'
const PREF_FIT_CLIP = 'machine-locator:fitClip'
const PREF_TIDY_LEVEL = 'machine-locator:tidyLevel'

// chờ sau khi thả chuột rồi mới ôm (thả rồi kéo tiếp ngay thì không tính)
const FIT_DEBOUNCE = 150
// kéo thanh "Độ sát" / bật "Nắn vuông góc": tính lại xem trước sau ngần này ms
const TUNE_DEBOUNCE = 120
const UNDO_LIMIT = 50
// các lần dịch bằng phím mũi tên liền nhau gộp thành 1 bước hoàn tác
const NUDGE_MERGE_MS = 800

const EMPTY_STATUS: StatusMessage = { t: '', k: '' }
const NO_INDEXES: number[] = []

function cloneBoxes(boxes: Box[]): Box[] {
  return boxes.map((b) => ({ ...b }))
}

function toRawBox(b: Box): RawBox {
  return [b.x, b.y, b.w, b.h]
}

function sameRect(a: Box, b: Box): boolean {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h
}

// Khung chưa có đường bao (khung đã chọn kiểu "Chữ nhật" thì không cần)
function needsOutline(b: Box): boolean {
  return !b.p && b.fit !== 'rect'
}

// Khung theo 1 kiểu kết quả ôm (giữ phiên ôm để tinh chỉnh / đổi kiểu tiếp)
function fittedBox(r: FitResult, mode: FitMode, fx: FitSession): Box {
  return { x: r.b[0], y: r.b[1], w: r.b[2], h: r.b[3], p: r.p, fit: mode, fx }
}

// Ô chữ mã máy giao vùng quanh khung (nới rộng hơn vùng tìm để chắc đủ)
function labelsNear(all: RawBox[], b: RawBox): RawBox[] {
  const mx = b[2] * 0.5 + 6
  const my = b[3] * 0.5 + 6

  return all.filter((t) =>
    t[0] < b[0] + b[2] + mx && t[0] + t[2] > b[0] - mx && t[1] < b[1] + b[3] + my && t[1] + t[3] > b[1] - my)
}

// Polygon mới -> bbox (pt, 1 chữ số)
function bboxOfOutline(p: Polygon[]): Pick<Box, 'x' | 'y' | 'w' | 'h'> {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity

  for (const poly of p) {
    for (const [x, y] of poly) {
      x0 = Math.min(x0, x)
      y0 = Math.min(y0, y)
      x1 = Math.max(x1, x)
      y1 = Math.max(y1, y)
    }
  }

  return { x: round1(x0), y: round1(y0), w: round1(x1 - x0), h: round1(y1 - y0) }
}

export function useMachineLocator(
  layout: MachineLayoutConfig,
  canWrite: boolean,
) {
  // dữ liệu gốc: bản đóng gói sẵn, dev thì thay bằng bản đọc từ file khi tải xong
  const [data, setData] = useState<LayoutData>(layout.data)
  const base = useMemo(() => buildBaseBoxes(data), [data])

  const [edits, setEdits] = useState<MachineEdits>({})
  const [loaded, setLoaded] = useState(false)
  // dev: số chỉnh sửa cũ còn trong localStorage chưa ghi vào file
  const [browserEditCount, setBrowserEditCount] = useState(0)
  const [cur, setCur] = useState<string | null>(null)
  const [act, setAct] = useState(0)
  const [draft, setDraft] = useState<MachineDraft | null>(null)
  const [editing, setEditingState] = useState(false)
  const [drawMode, setDrawMode] = useState<DrawMode | null>(null)
  const [panelMode, setPanelMode] = useState<PanelMode | null>(null)
  const [status, setStatusMessage] = useState<StatusMessage>(EMPTY_STATUS)
  const [query, setQuery] = useState('')
  // nhóm máy đang hiện (legend trên bản đồ + danh sách)
  const [groups, setGroups] = useState<GroupVisibility>(ALL_GROUPS_VISIBLE)
  const [reveal, setReveal] = useState<RevealRequest | null>(null)

  const [zoomOnSelect, setZoomOnSelectState] = useState(
    () => loadPreference(PREF_ZOOM_ON_SELECT) === true,
  )
  // làm mờ ảnh nền để khung máy nổi bật; mặc định bật
  const [dimBackground, setDimBackgroundState] = useState(
    () => loadPreference(PREF_DIM_BACKGROUND) !== false,
  )

  // ôm hàng loạt: tiến độ, bảng kết quả, khung chờ lưu
  const [batch, setBatch] = useState<FitBatch | null>(null)
  const pending = batch?.pending

  const machines = useMemo(
    () => buildEffectiveMachines(data, base, edits, draft, pending),
    [data, base, edits, draft, pending],
  )

  function setStatus(t: string, k: StatusKind = '') {
    setStatusMessage({ t, k })
  }

  function setZoomOnSelect(on: boolean) {
    setZoomOnSelectState(on)
    savePreference(PREF_ZOOM_ON_SELECT, on)
  }

  function setDimBackground(on: boolean) {
    setDimBackgroundState(on)
    savePreference(PREF_DIM_BACKGROUND, on)
  }

  function toggleGroup(g: MachineStatus) {
    setGroups((v) => ({ ...v, [g]: !v[g] }))
  }

  // "Chỉ hiện máy cần soát" = chỉ bật nhóm cần soát (đồng bộ với legend)
  const reviewOnly = !groups.auto && !groups.manual && groups.review

  function setReviewOnly(on: boolean) {
    setGroups(on ? { auto: false, manual: false, review: true } : ALL_GROUPS_VISIBLE)
  }

  // Vẽ khung theo đường bao CAD (p) thay vì hình chữ nhật; mặc định bật
  const [cadOutline, setCadOutlineState] = useState(
    () => loadPreference(PREF_CAD_OUTLINE) !== false,
  )

  function setCadOutline(on: boolean) {
    setCadOutlineState(on)
    savePreference(PREF_CAD_OUTLINE, on)
  }

  const current: MachineStoreState = { data, edits }

  // Máy đã lưu (không tính bản nháp) theo một trạng thái store
  function savedMachines(state: MachineStoreState) {
    return buildEffectiveMachines(state.data, buildBaseBoxes(state.data), state.edits, null)
  }

  // Bản nháp sạch dựng từ dữ liệu đã lưu (không tính bản nháp hiện tại);
  // máy có kết quả ôm hàng loạt chờ lưu thì lấy khung đó
  function freshDraft(
    code: string,
    state: MachineStoreState,
    waiting: Record<string, Box[]> | undefined = pending,
  ): MachineDraft {
    const m = savedMachines(state)[code]
    const boxes = (m && waiting?.[code]) || m?.boxes

    return { code, boxes: boxes ? cloneBoxes(boxes) : [], dirty: false, isNew: !m }
  }

  function setStore(state: MachineStoreState) {
    setData(state.data)
    setEdits(state.edits)
  }

  // Nhận trạng thái mới từ store; bản nháp chưa sửa thì dựng lại theo dữ liệu mới
  function applyStore(
    state: MachineStoreState,
    waiting: Record<string, Box[]> | undefined = pending,
  ) {
    setStore(state)
    setDraft((d) =>
      d && !d.dirty
        ? (editing && cur === d.code ? freshDraft(d.code, state, waiting) : null)
        : d,
    )
  }

  // Bỏ kết quả ôm hàng loạt chờ lưu của 1 máy; trả về phần còn lại
  function dropPending(code: string): Record<string, Box[]> | undefined {
    if (!pending?.[code]) return pending

    const rest = { ...pending }

    delete rest[code]
    setBatch((b) => b && { ...b, pending: rest })

    return rest
  }

  // =======================================================
  // ÔM KHUNG THEO ẢNH (tính trong worker, không chặn UI)
  // =======================================================

  // Tự ôm sau khi thả chuột; mặc định bật
  const [autoFit, setAutoFitState] = useState(
    () => loadPreference(PREF_AUTO_FIT) !== false,
  )
  // kiểu ôm mặc định cho khung chưa chọn kiểu riêng; mặc định "Theo viền kín"
  const [fitMode, setFitModeState] = useState<FitMode>(
    () => normalizeFitMode(loadPreference(PREF_FIT_MODE)) ?? 'closed',
  )
  // thanh "Độ sát" (1–10) và "Nắn vuông góc" cho các lần ôm mới
  const [fitTightness, setFitTightnessState] = useState(() => {
    const v = loadPreference(PREF_FIT_TIGHTNESS)

    return typeof v === 'number' && v >= 1 && v <= 10 ? v : FIT_TIGHTNESS_DEFAULT
  })
  const [fitOrtho, setFitOrthoState] = useState(() => loadPreference(PREF_FIT_ORTHO) === true)
  // thanh "Bịt hở" (px) cho "Theo viền kín"
  const [fitGap, setFitGapState] = useState(() => {
    const v = loadPreference(PREF_FIT_GAP)

    return typeof v === 'number' && v >= FIT_GAP_MIN && v <= FIT_GAP_MAX ? v : FIT_GAP_DEFAULT
  })
  // "Giới hạn trong khung" (khi có khung gốc); mặc định bật
  const [fitClip, setFitClipState] = useState(() => loadPreference(PREF_FIT_CLIP) !== false)
  // thanh "Mức gọn" (1–5) của "Làm gọn"
  const [tidyLevel, setTidyLevelState] = useState(() => {
    const v = loadPreference(PREF_TIDY_LEVEL)

    return typeof v === 'number' && v >= TIDY_LEVEL_MIN && v <= TIDY_LEVEL_MAX ? v : TIDY_LEVEL_DEFAULT
  })
  const [tidy, setTidy] = useState<TidyPreviewState | null>(null)
  const tidyTimer = useRef(0)
  const tidySeq = useRef(0)
  const [fitGhost, setFitGhost] = useState<FitGhost | null>(null)
  // chế độ fit: click vào máy -> ôm quanh điểm click
  const [fitTool, setFitTool] = useState(false)
  const fitter = useRef<MachineFitter | null>(null)
  const [fitterState, setFitterState] = useState<FitterState>('loading')
  // khung đang chờ kết quả ôm (viền nhấp nháy)
  const [fitting, setFitting] = useState<{ code: string, i: number } | null>(null)
  // khung đổi nhiều sau khi ôm (viền cam)
  const [fitWarn, setFitWarn] = useState<{ code: string, idx: number[] }>({ code: '', idx: [] })
  const [fitToast, setFitToast] = useState<FitToast | null>(null)
  // khung đang hiện hàng xem trước kiểu ôm
  const [fitPreview, setFitPreview] = useState<FitPreviewState | null>(null)

  const fitTimer = useRef(0)
  const fitSeq = useRef(0)
  const toastSeq = useRef(0)
  const batchStop = useRef(false)
  // công thức của lần ôm đang chờ: click liên tiếp cộng dồn lên nó, không mất click trước
  const pendingFit = useRef<FitRequest | null>(null)

  // bản nháp / khung đang chọn / kiểu mặc định mới nhất cho callback bất đồng bộ (kết quả worker)
  const live = useRef({ draft, act, fitMode })

  useEffect(() => {
    live.current = { draft, act, fitMode }
  })

  // ô chữ mã máy của cả layout (field t trong JSON)
  const labelRects = useMemo(() => Object.values(data.m).flatMap((m) => m.t ?? []), [data])

  // Ảnh + mặt nạ nét: tạo 1 lần cho layout này (view được dựng lại khi đổi tab xưởng)
  useEffect(() => {
    if (!canWrite) return

    const f = new MachineFitter(layout.image)
    const timer = fitTimer
    const tTimer = tidyTimer

    fitter.current = f
    f.ready.then(() => setFitterState('ready'), () => setFitterState('error'))

    return () => {
      batchStop.current = true
      window.clearTimeout(timer.current)
      window.clearTimeout(tTimer.current)
      f.dispose()
      if (fitter.current === f) fitter.current = null
    }
  }, [layout.image, canWrite])

  function setAutoFit(on: boolean) {
    setAutoFitState(on)
    savePreference(PREF_AUTO_FIT, on)
  }

  function showToast(text: string, kind: FitToast['kind'], undoId?: number) {
    setFitToast({ id: ++toastSeq.current, text, kind, undoId })
  }

  function closeFitToast() {
    setFitToast(null)
  }

  function markWarn(code: string, i: number, on: boolean) {
    setFitWarn((w) => {
      const idx = w.code === code ? w.idx.filter((k) => k !== i) : []

      return { code, idx: on ? [...idx, i] : idx }
    })
  }

  // Huỷ lần ôm đang chờ / đang chạy (người dùng kéo tiếp, hoàn tác…)
  function cancelFit() {
    window.clearTimeout(fitTimer.current)
    fitSeq.current++
    fitter.current?.cancel('single')
    pendingFit.current = null
    setFitting(null)
  }

  // Công thức ôm theo khung b (shift: chỉ tìm trong khung, không nới); seed = tâm khung nếu không có;
  // clip: "Giới hạn trong khung" (mặc định theo công tắc)
  function newRecipe(b: Box, shift: boolean, seed: [number, number] | null = null, clip = fitClip): FitRecipe {
    const raw = toRawBox(b)

    return {
      b: raw,
      expand: shift ? 0 : FIT_EXPAND,
      ref: raw,
      seed,
      eps: epsFromTightness(fitTightness),
      ortho: fitOrtho,
      gap: fitGap,
      clip,
      cuts: [],
      toggles: [],
      strokes: [],
    }
  }

  // Công thức ôm quanh điểm click khi chưa có khung: vùng vuông FIT_POINT_REGION_PX px ảnh
  function pointRecipe(pt: [number, number]): FitRecipe {
    const s = FIT_POINT_REGION_PX / data.ppp

    return {
      b: [pt[0] - s / 2, pt[1] - s / 2, s, s],
      expand: 0,
      ref: null,
      seed: pt,
      eps: epsFromTightness(fitTightness),
      ortho: fitOrtho,
      gap: fitGap,
      // không có khung gốc: không giới hạn
      clip: fitClip,
      cuts: [],
      toggles: [],
      strokes: [],
    }
  }

  function requestFit(req: FitRequest, delay = FIT_DEBOUNCE) {
    const f = fitter.current

    cancelFit()
    cancelTidy()

    if (!f) return

    if (f.status === 'error') {
      showToast('Chưa tải được ảnh layout – không ôm được khung.', 'info')
      return
    }

    const token = fitSeq.current
    const { crop, ppp } = data
    const labels = labelsNear(labelRects, req.recipe.b)

    pendingFit.current = req
    setFitting({ code: req.code, i: req.i })

    fitTimer.current = window.setTimeout(() => {
      f.fit('single', { recipe: req.recipe, crop, ppp, labels }).then(
        (o) => {
          if (token !== fitSeq.current) return
          pendingFit.current = null
          setFitting(null)
          if (!o.cancelled) applyFit(req, o.view)
        },
        (e: unknown) => {
          if (token !== fitSeq.current) return
          pendingFit.current = null
          setFitting(null)
          showToast(`Không ôm được khung: ${e instanceof Error ? e.message : e}`, 'info')
        },
      )
    }, delay)
  }

  function applyFit(req: FitRequest, view: FitView) {
    const { draft: d, act: a, fitMode: defMode } = live.current
    const b = d && d.code === req.code ? d.boxes[req.i] : undefined

    if (!d || d.code !== req.code) return

    // click ngoài khung: chỉ xem trước, chưa đổi bản nháp
    if (req.ghost) {
      const ghost = req.ghost
      const any = Object.values(view.variants).some(Boolean)

      setFitGhost((g) => ({
        code: req.code,
        i: req.i,
        append: ghost.append,
        session: { recipe: req.recipe, view },
        // chỉnh thanh trượt giữ kiểu đang chọn của bản xem trước
        mode: req.kind === 'tune' && g && g.code === req.code ? g.mode : defMode,
      }))
      if (!any) showToast('Không nhận ra hình máy quanh điểm click', 'info')
      return
    }

    // thêm khung mới: số khung phải còn như lúc yêu cầu
    if (!req.from && d.boxes.length !== req.i) return
    // khung đã đổi tiếp sau khi thả -> bỏ kết quả
    if (req.from && (!b || !sameRect(b, req.from))) return

    const fx: FitSession = { recipe: req.recipe, view }
    const mode = b?.fit ?? defMode
    const r = view.variants[mode]
    const boxes = d.boxes.slice()

    if (!r) {
      if (b && req.kind !== 'fit') {
        // đã tắt / xoá hết khối: về khung lúc ôm, không đường bao
        const [x, y, w, h] = req.recipe.ref ?? req.recipe.b

        pushUndo(d, a)
        boxes[req.i] = { x, y, w, h, p: null, fit: b.fit, fx }
        setDraft({ ...d, boxes, dirty: true })
        markWarn(d.code, req.i, false)
        return
      }

      // giữ khung như thả (kéo / vẽ đã đặt p = null); nhớ phiên ôm để tự chọn khối / tô bút
      if (b) {
        boxes[req.i] = { ...b, fx }
        setDraft({ ...d, boxes })
      }
      showToast(
        !b
          ? 'Không nhận ra hình máy quanh điểm click'
          : req.manual
            ? 'Không nhận ra hình máy – giữ nguyên khung'
            : 'Không nhận ra hình máy – giữ khung chữ nhật',
        'info',
      )
      return
    }

    // ôm quanh điểm click (không có khung gốc) thì không so độ dời
    const shift = req.recipe.ref ? fitShift(req.recipe.ref, r.b) : 0
    const big = shift > FIT_REVIEW_SHIFT
    const undoId = pushUndo(d, a)

    boxes[req.i] = fittedBox(r, mode, fx)
    if (!b) setAct(req.i)
    setDraft({ ...d, boxes, dirty: true })
    markWarn(d.code, req.i, big)

    if (req.kind === 'fit') {
      setFitPreview({ code: d.code, i: req.i, undoId })
      showToast(
        big
          ? `Khung đổi nhiều (${Math.round(shift)} pt) – kiểm tra lại · tin cậy ${r.score}`
          : `Đã ôm theo máy · tin cậy ${r.score}` + (r.fallback ? ' (không thấy viền kín, dùng “Sát”)' : ''),
        big || r.score < 50 ? 'warning' : 'success',
        undoId,
      )
    }
  }

  // Nút "Ôm theo máy" / phím F: ôm khung đang chọn ngay (dùng cả khi tắt tự ôm).
  // flipClip (giữ Shift): đảo "Giới hạn trong khung" cho riêng lần này
  function fitCurrent(flipClip = false) {
    const b = draft?.boxes[act]

    if (!draft || !b) return

    const recipe = newRecipe(b, false, null, flipClip ? !fitClip : fitClip)

    requestFit({ code: draft.code, i: act, from: b, recipe, kind: 'fit', manual: true }, 0)
  }

  // Chế độ fit: click vào máy -> ôm quanh điểm click.
  // Trong khung đang chọn (nới 15%): ôm lại khung đó, hạt giống = điểm click;
  // ngoài khung / máy chưa có khung: vùng vuông 300 px quanh điểm, CHỈ xem trước (nét đứt) –
  // Enter thay khung đang chọn (hoặc thêm khung khi máy chưa có), Esc bỏ
  function fitAtPoint(pt: [number, number]) {
    if (!editing || !draft) return

    const b = draft.boxes[act]
    const inside = b && pt[0] >= b.x - b.w * FIT_EXPAND && pt[0] <= b.x + b.w * (1 + FIT_EXPAND)
      && pt[1] >= b.y - b.h * FIT_EXPAND && pt[1] <= b.y + b.h * (1 + FIT_EXPAND)

    setFitPreview(null)
    setFitGhost(null)

    if (inside) {
      requestFit({ code: draft.code, i: act, from: b, recipe: newRecipe(b, false, pt), kind: 'fit', manual: true }, 0)
      return
    }

    const append = !draft.boxes.length

    requestFit({
      code: draft.code,
      i: append ? 0 : act,
      from: null,
      recipe: pointRecipe(pt),
      kind: 'fit',
      manual: true,
      ghost: { append },
    }, 0)
  }

  // Bản xem trước (click ngoài khung) còn đúng máy đang sửa
  const ghostView = editing && fitGhost && draft && fitGhost.code === draft.code ? fitGhost : null

  // Enter với bản xem trước: thay khung đang chọn / thêm khung theo kiểu đang chọn
  function applyGhost() {
    const g = ghostView

    setFitGhost(null)

    if (!g || !draft) return

    const r = g.session.view.variants[g.mode]

    if (!r) {
      showToast('Kiểu ôm này không có kết quả – chọn kiểu khác trước khi nhận', 'info')
      setFitGhost(g)
      return
    }

    if (!g.append && !draft.boxes[g.i]) return

    const i = g.append ? draft.boxes.length : g.i
    const undoId = pushUndo(draft, act)
    const boxes = draft.boxes.slice()

    boxes[i] = { ...fittedBox(r, g.mode, g.session), fx: undefined }
    setDraft({ ...draft, boxes, dirty: true })
    setAct(i)
    markWarn(draft.code, i, false)
    showToast(`Đã áp dụng khung · tin cậy ${r.score}`, r.score < 50 ? 'warning' : 'success', undoId)
  }

  // Công thức đang dùng của khung đang chọn (lần tinh chỉnh trước còn chờ kết quả thì cộng dồn lên nó)
  function currentRecipe(): FitRecipe | null {
    const b = draft?.boxes[act]

    if (!draft || !b?.fx) return null

    const prev = pendingFit.current

    return prev && prev.code === draft.code && prev.i === act ? prev.recipe : b.fx.recipe
  }

  // Tinh chỉnh khung đang chọn (đã có phiên ôm): click khối = thêm / bớt, Alt+click = cắt khối dính
  function refineFit(pt: [number, number], cut: boolean) {
    const r = currentRecipe()

    if (!draft || !r) return

    const recipe = cut
      ? { ...r, cuts: [...r.cuts, pt] }
      : { ...r, toggles: [...r.toggles, pt] }

    requestFit({ code: draft.code, i: act, from: draft.boxes[act], recipe, kind: 'refine', manual: true }, 0)
  }

  // Bút trên vùng tìm: erase = loại trừ (Alt + kéo), add = bổ sung (Shift + kéo)
  function strokeFit(stroke: FitStroke) {
    const r = currentRecipe()

    if (!draft || !r || stroke.pts.length < 1) return

    requestFit({
      code: draft.code,
      i: act,
      from: draft.boxes[act],
      recipe: { ...r, strokes: [...r.strokes, stroke] },
      kind: 'refine',
      manual: true,
    }, 0)
  }

  // Thanh "Độ sát" / "Bịt hở" / công tắc "Nắn vuông góc" / "Giới hạn trong khung":
  // nhớ cho lần sau + tính lại xem trước (debounce; bật / tắt công tắc tính ngay)
  function tuneFit(opts: FitTune) {
    const tightness = opts.tightness ?? fitTightness
    const ortho = opts.ortho ?? fitOrtho
    const gap = opts.gap ?? fitGap

    setFitTightnessState(tightness)
    setFitOrthoState(ortho)
    setFitGapState(gap)
    savePreference(PREF_FIT_TIGHTNESS, tightness)
    savePreference(PREF_FIT_ORTHO, ortho)
    savePreference(PREF_FIT_GAP, gap)

    if (opts.clip !== undefined) {
      setFitClipState(opts.clip)
      savePreference(PREF_FIT_CLIP, opts.clip)
    }

    // giữ "Giới hạn trong khung" của công thức (Shift+F đảo riêng lần đó) trừ khi bấm công tắc
    const tune = (r: FitRecipe): FitRecipe =>
      ({ ...r, eps: epsFromTightness(tightness), ortho, gap, clip: opts.clip ?? r.clip })
    const delay = opts.clip !== undefined ? 0 : TUNE_DEBOUNCE
    const g = ghostView

    if (g && draft) {
      // bản xem trước click ngoài khung (lần chỉnh trước còn chờ thì cộng dồn lên nó)
      const prev = pendingFit.current
      const r = prev?.ghost && prev.code === g.code ? prev.recipe : g.session.recipe

      requestFit({
        code: g.code,
        i: g.i,
        from: null,
        recipe: tune(r),
        kind: 'tune',
        manual: true,
        ghost: { append: g.append },
      }, delay)
      return
    }

    const r = currentRecipe()

    if (!draft || !r) return

    requestFit({
      code: draft.code,
      i: act,
      from: draft.boxes[act],
      recipe: tune(r),
      kind: 'tune',
      manual: true,
    }, delay)
  }

  // =======================================================
  // LÀM GỌN ĐƯỜNG BAO (không ôm lại; tính trong worker vì cần bắt dính theo nét)
  // =======================================================

  // Bản xem trước còn đúng khung đang chọn và đường bao chưa đổi
  const tidyView = editing && tidy && draft && tidy.code === draft.code && tidy.i === act
    && draft.boxes[tidy.i]?.p === tidy.from
    ? tidy
    : null

  function cancelTidy() {
    window.clearTimeout(tidyTimer.current)
    tidySeq.current++
    fitter.current?.cancel('tidy')
    setTidy(null)
  }

  function requestTidy(t: TidyPreviewState, level: number, delay: number) {
    const f = fitter.current

    window.clearTimeout(tidyTimer.current)

    const token = ++tidySeq.current
    const { crop, ppp } = data

    tidyTimer.current = window.setTimeout(() => {
      if (!f) return

      f.tidy({ polys: t.from, crop, ppp, level }).then(
        (polys) => {
          if (token !== tidySeq.current || !polys) return
          setTidy((cur) => (cur && cur.code === t.code && cur.i === t.i && cur.from === t.from ? { ...cur, polys } : cur))
        },
        (e: unknown) => {
          if (token !== tidySeq.current) return
          setTidy(null)
          showToast(`Không làm gọn được: ${e instanceof Error ? e.message : e}`, 'info')
        },
      )
    }, delay)
  }

  // Nút "Làm gọn" / phím G: xem trước đường bao gọn của khung đang chọn (cũ mờ, mới nét đứt)
  function tidyCurrent() {
    const b = draft?.boxes[act]

    if (!editing || !draft || !b) return

    if (!b.p?.length) {
      showToast('Khung chưa có đường bao – ôm theo máy (F) trước', 'info')
      return
    }

    if (fitter.current?.status !== 'ready') {
      showToast(fitterState === 'error' ? 'Chưa tải được ảnh layout – không làm gọn được.' : 'Đang chuẩn bị ảnh layout…', 'info')
      return
    }

    cancelFit()
    setFitPreview(null)
    setFitGhost(null)

    const t: TidyPreviewState = { code: draft.code, i: act, from: b.p, polys: null }

    setTidy(t)
    requestTidy(t, tidyLevel, 0)
  }

  // Thanh "Mức gọn": nhớ cho lần sau + tính lại bản xem trước (debounce)
  function setTidyLevel(level: number) {
    setTidyLevelState(level)
    savePreference(PREF_TIDY_LEVEL, level)

    if (tidyView) requestTidy(tidyView, level, TUNE_DEBOUNCE)
  }

  // Enter: áp dụng đường bao gọn (1 bước hoàn tác)
  function acceptTidy() {
    const t = tidyView

    // chưa tính xong: chờ
    if (!t?.polys || !draft) return

    cancelTidy()

    const polys = t.polys
    const count = (p: Polygon[]) => p.reduce((n, q) => n + q.length, 0)
    const undoId = pushUndo(draft, act)
    const boxes = draft.boxes.slice()

    boxes[t.i] = { ...boxes[t.i], ...bboxOfOutline(polys), p: polys, fx: undefined }
    setDraft({ ...draft, boxes, dirty: true })
    markWarn(draft.code, t.i, false)
    showToast(`Đã làm gọn · ${count(t.from)} → ${count(polys)} đỉnh`, 'success', undoId)
  }

  // Sửa đỉnh đường bao (kéo / thêm / xoá đỉnh): khung b theo bao ngoài đường bao mới
  function updateOutline(i: number, p: Polygon[]) {
    setDraft((d) => {
      if (!d || !d.boxes[i]) return d

      const boxes = d.boxes.slice()

      boxes[i] = { ...d.boxes[i], ...bboxOfOutline(p), p, fx: undefined }

      return { ...d, boxes, dirty: true }
    })
    setFitPreview(null)
  }

  // Thả đỉnh (không giữ Ctrl): bắt dính vào nét mực gần nhất (<= 4 px) nếu đỉnh chưa bị đổi tiếp
  function snapVertex(i: number, pi: number, vi: number, pt: [number, number]) {
    const f = fitter.current

    if (!f || f.status !== 'ready') return

    const code = draft?.code

    f.snap({ pt, crop: data.crop, ppp: data.ppp }).then((s) => {
      const d = live.current.draft
      const poly = d && d.code === code ? d.boxes[i]?.p?.[pi] : undefined
      const v = poly?.[vi]

      if (!s || !d || !poly || !v || v[0] !== pt[0] || v[1] !== pt[1]) return

      const p = d.boxes[i].p!.map((q, k) => (k === pi ? q.map((u, j) => (j === vi ? s : u)) : q))

      updateOutline(i, p)
    }, () => undefined)
  }

  // Chọn kiểu ôm (thẻ máy / ảnh xem trước): đổi khung đang chọn + nhớ làm mặc định
  function chooseFitMode(mode: FitMode) {
    setFitModeState(mode)
    savePreference(PREF_FIT_MODE, mode)

    // bản xem trước click ngoài khung: chỉ đổi kiểu đang xem
    if (ghostView) {
      setFitGhost({ ...ghostView, mode })
      return
    }

    const b = draft?.boxes[act]

    if (!editing || !draft || !b) return

    cancelFit()

    const boxes = draft.boxes.slice()
    const r = b.fx?.view.variants[mode]

    // đã có phiên ôm: đổi ngay sang kết quả của kiểu đó
    if (b.fx && r) {
      if (b.fit === mode && sameRect(b, { x: r.b[0], y: r.b[1], w: r.b[2], h: r.b[3] })) return

      pushUndo(draft, act)
      boxes[act] = fittedBox(r, mode, b.fx)
      setDraft({ ...draft, boxes, dirty: true })
      markWarn(draft.code, act, fitShift(b.fx.recipe.b, r.b) > FIT_REVIEW_SHIFT)
      return
    }

    if (b.fit === mode) return

    pushUndo(draft, act)

    const nb = { ...b, fit: mode }

    boxes[act] = nb
    setDraft({ ...draft, boxes, dirty: true })

    // chưa có phiên ôm: ôm lại ngay theo kiểu mới
    if (!b.fx) {
      requestFit({ code: draft.code, i: act, from: nb, recipe: newRecipe(nb, false), kind: 'fit', manual: true }, 0)
    }
  }

  // Enter: nhận kết quả ôm (giữ kiểu đang chọn), ẩn xem trước và khối ứng viên
  function acceptFit() {
    const p = fitPreview

    setFitPreview(null)
    cancelFit()

    if (ghostView) {
      applyGhost()
      return
    }

    if (!p || !draft || draft.code !== p.code || !draft.boxes[p.i]?.fx) return

    const boxes = draft.boxes.slice()

    boxes[p.i] = { ...boxes[p.i], fx: undefined }
    setDraft({ ...draft, boxes })
  }

  // Esc: hủy lần ôm, về khung trước khi ôm (bản xem trước click ngoài khung: chỉ bỏ)
  function rejectFit() {
    const p = fitPreview

    setFitPreview(null)
    cancelFit()

    if (ghostView) {
      setFitGhost(null)
      return
    }

    if (p) undo(p.undoId)
  }

  // =======================================================
  // HOÀN TÁC (Ctrl+Z, chỉ trong phiên sửa)
  // =======================================================

  const undoStack = useRef<UndoEntry[]>([])
  // Ctrl+Y / Ctrl+Shift+Z: làm lại các bước vừa hoàn tác (thao tác mới thì xoá)
  const redoStack = useRef<UndoEntry[]>([])
  const undoSeq = useRef(0)
  const lastNudge = useRef({ id: 0, t: 0 })

  function snapshot(d: MachineDraft, a: number): UndoEntry {
    return { id: ++undoSeq.current, code: d.code, boxes: cloneBoxes(d.boxes), act: a, dirty: d.dirty }
  }

  function pushUndo(d: MachineDraft, a: number): number {
    const e = snapshot(d, a)
    const s = undoStack.current

    s.push(e)
    if (s.length > UNDO_LIMIT) s.shift()
    redoStack.current = []

    return e.id
  }

  function clearUndo() {
    undoStack.current = []
    redoStack.current = []
  }

  function restore(d: MachineDraft, e: UndoEntry) {
    cancelFit()
    cancelTidy()
    setDraft({ ...d, boxes: e.boxes, dirty: e.dirty })
    setAct(Math.max(0, Math.min(e.act, e.boxes.length - 1)))
    setFitWarn({ code: '', idx: [] })
    setFitToast(null)
    setFitPreview(null)
    setFitGhost(null)
  }

  // id: chỉ hoàn tác khi bước trên cùng đúng là id (nút "Hoàn tác" của toast / Esc khi xem trước)
  function undo(id?: number) {
    const s = undoStack.current

    // bỏ các bước của máy khác (đã chọn máy khác sau đó)
    while (s.length && s[s.length - 1].code !== draft?.code) s.pop()

    const top = s[s.length - 1]

    if (!draft || !top || (id !== undefined && top.id !== id)) return

    s.pop()
    redoStack.current.push(snapshot(draft, act))
    restore(draft, top)
  }

  function redo() {
    const r = redoStack.current

    while (r.length && r[r.length - 1].code !== draft?.code) r.pop()

    const top = r.pop()

    if (!draft || !top) return

    undoStack.current.push(snapshot(draft, act))
    restore(draft, top)
  }

  // MapCanvas: bắt đầu kéo / resize khung / sửa đỉnh (trước lần thay đổi đầu tiên)
  function beginBoxGesture() {
    cancelFit()
    cancelTidy()
    setFitPreview(null)
    setFitGhost(null)
    if (draft) pushUndo(draft, act)
  }

  // MapCanvas: thả chuột sau khi kéo / resize (Alt: không tự ôm; Shift: chỉ tìm trong khung)
  function endBoxGesture(i: number, box: Box, mods: DropMods) {
    if (!autoFit || mods.alt || !draft) return

    requestFit({ code: draft.code, i, from: box, recipe: newRecipe(box, mods.shift), kind: 'fit', manual: false })
  }

  // =======================================================
  // ÔM HÀNG LOẠT (khung chưa có đường bao)
  // =======================================================

  async function runFitBatch() {
    const f = fitter.current

    if (!f || batch?.running) return

    if (draft && draft.dirty) {
      setStatus(`Lưu hoặc hủy thay đổi của ${draft.code} trước khi ôm hàng loạt.`, 'err')
      return
    }

    const src = buildEffectiveMachines(data, base, edits, null, pending)
    const jobs: { code: string, i: number, b: Box }[] = []

    for (const code of Object.keys(src).sort(compareCodes)) {
      src[code].boxes.forEach((b, i) => {
        if (needsOutline(b)) jobs.push({ code, i, b })
      })
    }

    if (!jobs.length) {
      setStatus('Mọi khung đều đã có đường bao.', 'ok')
      return
    }

    const { crop, ppp } = data
    const waiting: Record<string, Box[]> = { ...pending }
    const orig: Record<string, Box[]> = { ...batch?.orig }
    const rows: FitBatchRow[] = []

    for (const job of jobs) orig[job.code] ??= src[job.code].boxes

    batchStop.current = false
    cancelFit()
    setBatch({ running: true, done: 0, total: jobs.length, rows: [], pending: waiting, orig, reviewIdx: null })
    setStatus(`Đang ôm ${jobs.length} khung…`)

    let error = ''

    for (const job of jobs) {
      if (batchStop.current) break

      let o: FitOutcome
      const recipe = newRecipe(job.b, false)
      const mode = job.b.fit ?? fitMode

      try {
        o = await f.fit('batch', { recipe, crop, ppp, labels: labelsNear(labelRects, recipe.b) })
      } catch (e) {
        error = e instanceof Error ? e.message : String(e)
        break
      }

      if (o.cancelled || batchStop.current) break

      const n = src[job.code].boxes.length
      const r = o.view.variants[mode]

      if (r) {
        const shift = fitShift(recipe.b, r.b)
        const boxes = (waiting[job.code] ?? src[job.code].boxes).slice()

        boxes[job.i] = { x: r.b[0], y: r.b[1], w: r.b[2], h: r.b[3], p: r.p, fit: mode }
        waiting[job.code] = boxes
        rows.push({
          code: job.code,
          i: job.i,
          n,
          shift,
          score: r.score,
          status: shift > FIT_REVIEW_SHIFT ? 'review' : 'fit',
        })

        // máy đang chọn (bản nháp chưa sửa) hiện luôn kết quả
        setDraft((d) => (d && !d.dirty && d.code === job.code ? { ...d, boxes: cloneBoxes(boxes) } : d))
      } else {
        rows.push({ code: job.code, i: job.i, n, shift: null, score: null, status: 'miss' })
      }

      const snapshot = rows.slice()
      const done = rows.length
      const fitted = r ? { [job.code]: waiting[job.code] } : {}

      setBatch((b) => b && { ...b, done, rows: snapshot, pending: { ...b.pending, ...fitted } })
    }

    if (batchStop.current && !rows.length) return

    // điểm tin cậy tăng dần: khung kém nhất (và không nhận ra) lên đầu để soát trước
    rows.sort((a, b) => (a.score ?? -1) - (b.score ?? -1) || compareCodes(a.code, b.code) || a.i - b.i)

    setBatch((b) => b && { ...b, running: false, rows })

    const nFit = rows.filter((x) => x.status !== 'miss').length
    const nReview = rows.filter((x) => x.status === 'review').length

    if (error) {
      setStatus(`Dừng ôm hàng loạt: ${error}`, 'err')
    } else {
      setStatus(
        `Đã ôm ${nFit}/${rows.length} khung`
        + (nReview ? `, ${nReview} khung cần soát` : '')
        + (rows.length - nFit ? `, ${rows.length - nFit} không nhận ra` : '')
        + '. Bấm “Soát lần lượt” (Enter nhận, S bỏ qua) rồi “Lưu kết quả”.',
        'ok',
      )
    }
  }

  function stopFitBatch() {
    batchStop.current = true
    fitter.current?.cancel('batch')
    setBatch((b) => b && { ...b, running: false })
  }

  // Bỏ kết quả chờ lưu, đóng bảng kết quả
  function discardFitBatch() {
    stopFitBatch()
    setBatch(null)
    setDraft((d) => (d && !d.dirty ? freshDraft(d.code, current, undefined) : d))
  }

  // Soát lần lượt (điểm tin cậy tăng dần): zoom tới dòng idx; hết dòng thì kết thúc
  function reviewFitBatch(idx = 0) {
    if (!batch || batch.running) return

    if (idx >= batch.rows.length) {
      setBatch((b) => b && { ...b, reviewIdx: null })
      setStatus(`Đã soát hết ${batch.rows.length} khung. Bấm “Lưu kết quả” để ghi.`, 'ok')
      return
    }

    const row = batch.rows[idx]

    if (draft && draft.dirty && draft.code !== row.code) {
      setStatus(`Lưu hoặc hủy thay đổi của ${draft.code} trước khi soát tiếp.`, 'err')
      return
    }

    setBatch((b) => b && { ...b, reviewIdx: idx })
    select(row.code, { zoom: true })
    setAct(row.i)
  }

  // Enter: nhận kết quả dòng đang soát; S: bỏ qua (giữ khung cũ) – rồi sang dòng kế
  function decideFitReview(decision: 'accept' | 'skip') {
    if (!batch || batch.reviewIdx === null) return

    const idx = batch.reviewIdx
    const row = batch.rows[idx]
    let waiting = batch.pending

    if (decision === 'skip' && waiting[row.code]) {
      const orig = batch.orig[row.code]
      const boxes = waiting[row.code].slice()

      if (orig?.[row.i]) boxes[row.i] = orig[row.i]

      waiting = { ...waiting }
      // mọi khung đã về như cũ -> máy không còn gì chờ lưu
      if (orig && sameBoxes(boxes, orig) && sameOutlines(boxes, orig)) delete waiting[row.code]
      else waiting[row.code] = boxes

      const next = waiting

      setDraft((d) => (d && !d.dirty && d.code === row.code ? freshDraft(row.code, current, next) : d))
    }

    setBatch({ ...batch, pending: waiting, rows: batch.rows.map((r, k) => (k === idx ? { ...r, decision } : r)) })
    reviewFitBatch(idx + 1)
  }

  async function saveFitBatch() {
    if (!batch || batch.running) return

    if (draft && draft.dirty) {
      setStatus(`Lưu hoặc hủy thay đổi của ${draft.code} trước.`, 'err')
      return
    }

    const entries = Object.entries(batch.pending)

    if (!entries.length) return

    const left = { ...batch.pending }
    let next: MachineStoreState | null = null

    setStatus(`Đang lưu ${entries.length} máy…`)

    try {
      for (const [c, boxes] of entries) {
        next = await setMachineEdit(layout, c, { ...editBody(boxes), keepStatus: true })
        delete left[c]
      }

      setStatus(`Đã lưu khung đã ôm của ${entries.length} máy.`, 'ok')
    } catch (e) {
      setStatus(machineStoreErrorMessage(e), 'err')
    }

    setBatch((b) => b && { ...b, pending: left })
    if (next) applyStore(next, left)
  }

  const pendingFitCount = Object.keys(pending ?? {}).length

  // khung đang hiện ảnh xem trước (còn đúng máy / còn phiên ôm)
  const fitPreviewIdx = editing && fitPreview && draft && fitPreview.code === draft.code
    && draft.boxes[fitPreview.i]?.fx
    ? fitPreview.i
    : null

  // số khung chưa có đường bao (nút ôm hàng loạt)
  const unfittedCount = useMemo(
    () => Object.values(machines).reduce((n, m) => n + m.boxes.filter(needsOutline).length, 0),
    [machines],
  )

  // =======================================================
  // LOAD
  // =======================================================

  const bootDone = useRef(false)

  useEffect(() => {
    let alive = true

    loadMachineStore(layout)
      .then((state) => {
        if (!alive) return
        setData(state.data)
        setEdits(state.edits)
        setBrowserEditCount(
          machineStoreMode === 'file' ? Object.keys(getBrowserEdits(layout.id)).length : 0,
        )
        setLoaded(true)
      })
      .catch((e) => {
        if (!alive) return
        setStatusMessage({ t: machineStoreErrorMessage(e), k: 'err' })
        setLoaded(true)
      })

    return () => {
      alive = false
    }
  }, [layout])

  // Mở trang kèm #A-1443 thì chọn sẵn máy đó
  useEffect(() => {
    if (!loaded || bootDone.current) return
    bootDone.current = true

    const h0 = decodeURIComponent(window.location.hash.slice(1)).toUpperCase()

    if (machines[h0]) select(h0)
  })

  // =======================================================
  // SELECTION
  // =======================================================

  function select(c: string, options: SelectOptions = {}) {
    const isEditing = options.editing ?? editing

    if (draft && draft.dirty && draft.code !== c) {
      setStatus(`Lưu hoặc hủy thay đổi của ${draft.code} trước khi chọn máy khác.`, 'err')
      return
    }

    const keep = draft && draft.code === c ? draft : null

    setCur(c)
    setAct(0)
    setPanelMode(null)
    setDrawMode(null)
    setDraft(isEditing ? (keep ?? freshDraft(c, current)) : keep)

    const m = machines[c]

    if (m && !options.keepView) {
      setReveal((r) => ({
        id: (r?.id ?? 0) + 1,
        bounds: boundsOf(m.boxes),
        zoom: options.zoom ?? zoomOnSelect,
        pulse: !isEditing,
      }))
    }

    setStatusMessage(EMPTY_STATUS)

    try {
      window.history.replaceState(window.history.state, '', '#' + c)
    } catch {
      // URL hash chỉ để chia sẻ link, không bắt buộc
    }
  }

  // Enter trong ô tìm: chọn mã đầu tiên khớp
  function selectFirst(codes: string[]) {
    if (codes.length) select(codes[0])
  }

  // Esc / click nền: bỏ chọn máy (giữ chế độ sửa nếu đang bật)
  function clearSelection() {
    if (!cur) return

    if (draft && draft.dirty) {
      setStatus(`Lưu hoặc hủy thay đổi của ${draft.code} trước khi bỏ chọn.`, 'err')
      return
    }

    setCur(null)
    setAct(0)
    setDraft(null)
    setDrawMode(null)
    setPanelMode(null)
    setStatusMessage(EMPTY_STATUS)

    try {
      const { pathname, search } = window.location
      window.history.replaceState(window.history.state, '', pathname + search)
    } catch {
      // không bắt buộc
    }
  }

  // =======================================================
  // EDIT MODE
  // =======================================================

  function setEditing(on: boolean) {
    if (!on && draft && draft.dirty) {
      setStatus(`Lưu hoặc hủy thay đổi của ${draft.code} trước khi thoát.`, 'err')
      return
    }

    if (!on && (batch?.running || pendingFitCount)) {
      setStatus('Lưu hoặc bỏ kết quả ôm hàng loạt trước khi thoát.', 'err')
      return
    }

    if (!on) {
      cancelFit()
      cancelTidy()
      clearUndo()
      setBatch(null)
      setFitPreview(null)
      setFitGhost(null)
      setFitTool(false)
    }

    setEditingState(on)
    setDrawMode(null)
    setPanelMode(null)
    setDraft(on && cur ? freshDraft(cur, current) : null)
  }

  function startNew(code?: string) {
    if (draft && draft.dirty) {
      setStatus(`Lưu hoặc hủy thay đổi của ${draft.code} trước.`, 'err')
      return
    }

    setEditingState(true)

    if (code) {
      createNew(code)
      return
    }

    setCur(null)
    setDraft(null)
    setDrawMode(null)
    setPanelMode('new')
    setStatusMessage(EMPTY_STATUS)
  }

  function createNew(c: string) {
    if (machines[c]) {
      select(c, { editing: true })
      setStatus(`${c} đã có trong danh sách.`, 'err')
      return
    }

    setCur(c)
    setAct(0)
    setPanelMode(null)
    setDraft({ code: c, boxes: [], dirty: false, isNew: true })
    setQuery('')
    setStatus(`Kéo trên bản vẽ để vẽ khung cho ${c}, sau đó bấm Lưu.`)
    setDrawMode('add')
  }

  function togglePanel(mode: PanelMode) {
    setPanelMode((p) => (p === mode ? null : mode))
  }

  function beginDraw(mode: DrawMode) {
    setDrawMode(mode)
  }

  function cancelDraw() {
    setDrawMode(null)
  }

  // =======================================================
  // DRAFT CHANGES (từ MapCanvas / bàn phím)
  // =======================================================

  function updateBox(i: number, box: Box) {
    setDraft((d) => {
      if (!d || !d.boxes[i]) return d

      const boxes = d.boxes.slice()
      // khung đã bị sửa -> đường bao CAD cũ và phiên ôm không còn đúng (giữ kiểu ôm đã chọn)
      boxes[i] = { ...d.boxes[i], x: box.x, y: box.y, w: box.w, h: box.h, p: null, fx: undefined }

      return { ...d, boxes, dirty: true }
    })
    setFitWarn((w) => (w.idx.includes(i) ? { ...w, idx: w.idx.filter((k) => k !== i) } : w))
  }

  // Alt: không tự ôm lần này; Shift: chỉ tìm trong khung
  function completeDraw(box: Box, mods: DropMods = { alt: false, shift: false }) {
    if (!draft) return

    cancelFit()
    setFitPreview(null)
    pushUndo(draft, act)

    const boxes = draft.boxes.slice()
    const i = drawMode === 'replace' ? act : boxes.length
    // vẽ lại giữ kiểu ôm đã chọn của vị trí đó
    const drawn: Box = { x: box.x, y: box.y, w: box.w, h: box.h, p: null, fit: boxes[i]?.fit }

    boxes[i] = drawn
    if (i !== act) setAct(i)

    setDraft({ ...draft, boxes, dirty: true })
    setDrawMode(null)
    setFitWarn((w) => (w.idx.includes(i) ? { ...w, idx: w.idx.filter((k) => k !== i) } : w))

    if (autoFit && !mods.alt) {
      requestFit({ code: draft.code, i, from: drawn, recipe: newRecipe(drawn, mods.shift), kind: 'fit', manual: false })
    }
  }

  function removeLocation() {
    if (!draft) return

    cancelFit()
    setFitPreview(null)
    pushUndo(draft, act)
    setDraft({ ...draft, boxes: draft.boxes.filter((_, i) => i !== act), dirty: true })
    setAct(0)
    setFitWarn({ code: '', idx: [] })
  }

  function revertAuto() {
    if (!draft || !cur || !base[cur]) return

    cancelFit()
    setFitPreview(null)
    pushUndo(draft, act)
    setDraft({ ...draft, boxes: cloneBoxes(base[cur]), dirty: true, revert: true })
    setAct(0)
    setFitWarn({ code: '', idx: [] })
  }

  function cancel() {
    if (!draft) return

    const c = draft.code
    const m = buildEffectiveMachines(data, base, edits, null)[c]

    setDrawMode(null)
    cancelFit()
    clearUndo()
    setFitPreview(null)
    setFitWarn({ code: '', idx: [] })

    // Hủy thay đổi của máy này cũng bỏ kết quả ôm hàng loạt chờ lưu của nó
    const rest = dropPending(c)

    if (m) {
      setDraft(freshDraft(c, current, rest))
    } else {
      setDraft(null)
      setCur(null)
    }

    setStatusMessage(EMPTY_STATUS)
  }

  // =======================================================
  // PERSIST
  // =======================================================

  async function save() {
    if (!draft) return

    const c = draft.code
    const boxes = draft.boxes

    setStatus('Đang lưu…')

    try {
      const next = draft.revert && base[c] && sameBoxes(boxes, base[c])
        ? await deleteMachineEdit(layout, c)
        : await setMachineEdit(layout, c, editBody(boxes))

      setStore(next)
      setDraft((d) => (d && d.code === c ? { ...d, dirty: false, revert: false } : d))
      dropPending(c)
      // sau khi lưu, hoàn tác về bước cũ là thay đổi chưa lưu
      undoStack.current.forEach((u) => {
        u.dirty = true
      })
      setStatus(`Đã lưu ${c}.`, 'ok')
    } catch (e) {
      setStatus(machineStoreErrorMessage(e), 'err')
    }
  }

  // "Đúng rồi": lưu nguyên khung hiện tại thành EDITS để đánh dấu đã soát
  async function confirmReview() {
    const c = cur
    const m = c ? machines[c] : null

    if (!c || !m || !m.review || draft?.dirty) return

    setStatus('Đang lưu…')

    try {
      const next = await setMachineEdit(layout, c, editBody(m.boxes))

      applyStore(next)
      setStatus(`Đã đánh dấu ${c} là đã soát.`, 'ok')
    } catch (e) {
      setStatus(machineStoreErrorMessage(e), 'err')
    }
  }

  async function renameTo(n: string) {
    const o = cur

    if (!o) return

    if (n === o) {
      setPanelMode(null)
      return
    }

    if (machines[n]) {
      setStatus(`${n} đã có trong danh sách. Xóa hoặc đổi mã đó trước.`, 'err')
      return
    }

    const boxes = draft && draft.boxes.length ? draft.boxes : machines[o]?.boxes

    // Máy mới chưa vẽ khung: chỉ đổi mã trên bản nháp
    if (!boxes || !boxes.length) {
      if (draft) setDraft({ ...draft, code: n })
      setCur(n)
      setPanelMode(null)
      setStatus(`Đã đổi ${o} thành ${n}.`, 'ok')
      return
    }

    setStatus('Đang đổi mã…')

    try {
      await setMachineEdit(layout, n, { ...editBody(boxes), renamedFrom: o })

      const next = base[o]
        ? await setMachineEdit(layout, o, {
          boxes: [],
          deleted: true,
          renamedTo: n,
          updatedAt: new Date().toISOString(),
        })
        : await deleteMachineEdit(layout, o)

      setStore(next)
      setPanelMode(null)
      setCur(n)
      setDraft(freshDraft(n, next))
      setStatus(`Đã đổi ${o} thành ${n}.`, 'ok')
    } catch (e) {
      setStatus(machineStoreErrorMessage(e), 'err')
    }
  }

  async function deleteMachine() {
    const c = cur

    if (!c) return

    setStatus('Đang xóa…')

    try {
      const next = base[c]
        ? await setMachineEdit(layout, c, {
          boxes: [],
          deleted: true,
          updatedAt: new Date().toISOString(),
        })
        : await deleteMachineEdit(layout, c)

      setStore(next)
      setDraft(null)
      setDrawMode(null)
      setPanelMode(null)
      setCur(null)
      setStatus(`Đã xóa ${c}.`, 'ok')
    } catch (e) {
      setStatus(machineStoreErrorMessage(e), 'err')
    }
  }

  // =======================================================
  // EXPORT / IMPORT
  // =======================================================

  const prefix = layout.exportMeta.filePrefix

  function exportFile(name: string, content: string | Blob) {
    downloadFile(name, content)
    setStatus(`Đã xuất ${name}.`, 'ok')
  }

  function exportCsv() {
    exportFile(`${prefix}-machines_${dateStamp()}.csv`, buildMachinesCsv(layout, machines))
  }

  function exportJson() {
    exportFile(`${prefix}-machines_${dateStamp()}.json`, buildMachinesJson(layout, machines))
  }

  async function exportPng() {
    try {
      const res = await fetch(layout.image)

      if (!res.ok) throw new Error(String(res.status))

      exportFile(layout.exportMeta.imageFile, await res.blob())
    } catch {
      setStatus('Không xuất được file trong chế độ xem này.', 'err')
    }
  }

  // false: đang có thay đổi chưa lưu, không mở hộp chọn file
  function canStartImport(): boolean {
    if (draft && draft.dirty) {
      setStatus(`Lưu hoặc hủy thay đổi của ${draft.code} trước khi nhập.`, 'err')
      return false
    }

    if (batch?.running || pendingFitCount) {
      setStatus('Lưu hoặc bỏ kết quả ôm hàng loạt trước khi nhập.', 'err')
      return false
    }

    return true
  }

  async function importJson(file: File) {
    const plan = planJsonImport(
      await file.text(),
      base,
      edits,
      buildEffectiveMachines(data, base, edits, null),
    )

    if (!plan.ok) {
      setStatus(plan.error, 'err')
      return
    }

    const { ops } = plan

    if (!ops.length) {
      setStatus('Dữ liệu trong file giống hiện tại, không có gì thay đổi.', 'ok')
      return
    }

    setStatus(`Đang nhập ${ops.length} thay đổi…`)

    let next: MachineStoreState | null = null

    try {
      for (const op of ops) {
        next = op[0] === 'set'
          ? await setMachineEdit(layout, op[1], op[2])
          : await deleteMachineEdit(layout, op[1])
      }

      setStatus(`Đã nhập ${ops.length} thay đổi từ ${file.name}.`, 'ok')
    } catch (e) {
      setStatus(machineStoreErrorMessage(e), 'err')
    }

    if (next) applyStore(next)
  }

  // dev: ghi EDITS cũ còn trong localStorage vào file rồi xoá khỏi trình duyệt
  async function migrateBrowserData() {
    if (draft && draft.dirty) {
      setStatus(`Lưu hoặc hủy thay đổi của ${draft.code} trước khi ghi.`, 'err')
      return
    }

    if (batch?.running || pendingFitCount) {
      setStatus('Lưu hoặc bỏ kết quả ôm hàng loạt trước khi ghi.', 'err')
      return
    }

    setStatus('Đang ghi các chỉnh sửa trong trình duyệt vào file…')

    try {
      const { state, count } = await migrateBrowserEdits(layout)

      applyStore(state)
      setBrowserEditCount(0)
      setStatus(`Đã ghi ${count} chỉnh sửa từ trình duyệt vào file.`, 'ok')
    } catch (e) {
      setStatus(machineStoreErrorMessage(e), 'err')
    }
  }

  // =======================================================
  // KEYBOARD
  // =======================================================

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && drawMode) {
        setDrawMode(null)
        return
      }

      const el = document.activeElement as HTMLInputElement | null
      const tag = el?.tagName
      // đang gõ chữ (thanh trượt / công tắc không tính)
      const typing = tag === 'TEXTAREA' || (tag === 'INPUT' && el?.type !== 'range' && el?.type !== 'checkbox')

      // Xem trước "Làm gọn": Enter = áp dụng, Esc = bỏ
      if ((e.key === 'Enter' || e.key === 'Escape') && tidyView && !typing && tag !== 'BUTTON') {
        e.preventDefault()
        if (e.key === 'Enter') acceptTidy()
        else cancelTidy()
        return
      }

      // Xem trước kết quả ôm: Enter = nhận, Esc = hủy về trước lần ôm
      if ((e.key === 'Enter' || e.key === 'Escape') && (fitPreviewIdx !== null || ghostView)
        && !typing && tag !== 'BUTTON') {
        e.preventDefault()
        if (e.key === 'Enter') acceptFit()
        else rejectFit()
        return
      }

      // Soát lần lượt kết quả hàng loạt: Enter = nhận, S = bỏ qua, rồi sang máy kế
      if (editing && batch?.reviewIdx != null && !typing && tag !== 'BUTTON' && !e.ctrlKey && !e.metaKey && !e.altKey
        && (e.key === 'Enter' || e.key.toLowerCase() === 's')) {
        e.preventDefault()
        decideFitReview(e.key === 'Enter' ? 'accept' : 'skip')
        return
      }

      // Esc: thoát chế độ fit, rồi mới bỏ chọn máy
      if (e.key === 'Escape' && fitTool && !typing) {
        setFitTool(false)
        return
      }

      // Esc ngoài ô nhập: bỏ chọn máy
      if (e.key === 'Escape' && cur && !typing) {
        clearSelection()
        return
      }

      if (!editing || !draft || typing) return

      // Ctrl+Z: hoàn tác; Ctrl+Y / Ctrl+Shift+Z: làm lại (mọi thao tác chỉnh khung)
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }

      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
        return
      }

      if (!draft.boxes[act]) return

      // F: ôm khung đang chọn theo máy (Shift+F: đảo "Giới hạn trong khung" lần này)
      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        fitCurrent(e.shiftKey)
        return
      }

      // G: làm gọn đường bao khung đang chọn
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        tidyCurrent()
        return
      }

      // mũi tên trên thanh "Độ sát" thuộc về thanh trượt
      if (tag === 'INPUT') return

      const st = e.shiftKey ? 3 : 0.5
      const delta = ({
        ArrowLeft: [-st, 0],
        ArrowRight: [st, 0],
        ArrowUp: [0, -st],
        ArrowDown: [0, st],
      } as Record<string, [number, number]>)[e.key]

      if (!delta) return

      e.preventDefault()
      cancelFit()

      // các lần dịch liền nhau = 1 bước hoàn tác
      const now = Date.now()

      if (undoStack.current.at(-1)?.id !== lastNudge.current.id || now - lastNudge.current.t > NUDGE_MERGE_MS) {
        lastNudge.current.id = pushUndo(draft, act)
      }
      lastNudge.current.t = now

      const b = draft.boxes[act]

      updateBox(act, { ...b, x: b.x + delta[0], y: b.y + delta[1] })
    }

    document.addEventListener('keydown', onKeyDown)

    return () => document.removeEventListener('keydown', onKeyDown)
  })

  // =======================================================
  // DERIVED
  // =======================================================

  const hint = drawMode && cur
    ? drawMode === 'replace'
      ? `Kéo trên bản vẽ để vẽ lại khung ${cur}. Esc để hủy.`
      : `Kéo trên bản vẽ để vẽ khung cho ${cur}. Esc để hủy.`
    : editing && fitTool && cur
      ? `Chế độ fit: click vào máy để ôm khung ${cur} quanh điểm click. Esc để thoát.`
      : ''

  return {
    canWrite,
    loaded,
    storeMode: machineStoreMode,
    dataFileName: layout.dataFile.split('/').pop() ?? layout.dataFile,
    // dev: file là dữ liệu gốc nên không có "khung tự động" để quay về
    canRevert: machineStoreMode === 'local',
    browserEditCount,
    migrateBrowserData,
    base,
    edits,
    machines,
    cur,
    act,
    draft,
    editing,
    drawMode,
    panelMode,
    status,
    query,
    reviewOnly,
    groups,
    reviewCount: Object.values(machines).filter((m) => m.review).length,
    reveal,
    hint,
    zoomOnSelect,
    dimBackground,
    cadOutline,

    // ôm khung theo ảnh
    autoFit,
    fitMode,
    // kiểu ôm của khung đang chọn (chưa chọn riêng = mặc định)
    activeFitMode: draft?.boxes[act]?.fit ?? fitMode,
    fitPreviewIdx,
    fitterState,
    fittingIdx: fitting && draft && fitting.code === draft.code ? fitting.i : null,
    warnIdx: draft && fitWarn.code === draft.code && fitWarn.idx.length ? fitWarn.idx : NO_INDEXES,
    fitToast,
    batch,
    pendingFitCount,
    unfittedCount,
    // thay đổi chưa lưu (cho hộp hỏi khi chuyển tab xưởng)
    dirtyLabel: draft?.dirty
      ? draft.code
      : pendingFitCount ? `${pendingFitCount} máy vừa ôm hàng loạt` : null,
    fitTool,
    fitTightness,
    fitOrtho,
    fitGap,
    fitClip,
    // "Làm gọn": bản xem trước của khung đang chọn + thanh "Mức gọn"
    tidyPreview: tidyView,
    tidyLevel,
    tidyCurrent,
    setTidyLevel,
    acceptTidy,
    rejectTidy: cancelTidy,
    // bản xem trước (nét đứt) khi click chế độ fit ngoài khung đang chọn
    // (giữ nguyên object state để MapCanvas memo không render lại thừa)
    fitGhost: ghostView,
    setAutoFit,
    setFitTool,
    chooseFitMode,
    acceptFit,
    rejectFit,
    tuneFit,
    refineFit,
    strokeFit,
    fitAtPoint,
    updateOutline,
    snapVertex,
    redo,
    reviewFitBatch,
    decideFitReview,
    fitCurrent,
    undo,
    closeFitToast,
    beginBoxGesture,
    endBoxGesture,
    runFitBatch,
    stopFitBatch,
    discardFitBatch,
    saveFitBatch,
    focusMachine: (c: string) => select(c, { zoom: true }),

    setQuery,
    setReviewOnly,
    toggleGroup,
    confirmReview,
    setStatus,
    setAct,
    setZoomOnSelect,
    setDimBackground,
    setCadOutline,
    select,
    selectFirst,
    clearSelection,
    setEditing,
    startNew,
    createNew,
    togglePanel,
    openPanel: (mode: PanelMode) => setPanelMode(mode),
    closePanel: () => setPanelMode(null),
    beginDraw,
    cancelDraw,
    updateBox,
    completeDraw,
    removeLocation,
    revertAuto,
    cancel,
    save,
    renameTo,
    deleteMachine,
    exportCsv,
    exportJson,
    exportPng,
    canStartImport,
    importJson,
  }
}

export type MachineLocatorState = ReturnType<typeof useMachineLocator>

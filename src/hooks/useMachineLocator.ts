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
  LayoutData,
  MachineDraft,
  MachineEdits,
  MachineLayoutConfig,
  PanelMode,
  StatusKind,
  StatusMessage,
} from '../types/machineLocator'
import {
  ALL_GROUPS_VISIBLE,
  boundsOf,
  buildBaseBoxes,
  buildEffectiveMachines,
  editBody,
  sameBoxes,
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
}

const PREF_ZOOM_ON_SELECT = 'machine-locator:zoomOnSelect'
const PREF_DIM_BACKGROUND = 'machine-locator:dimBackground'
const PREF_CAD_OUTLINE = 'machine-locator:cadOutline'

const EMPTY_STATUS: StatusMessage = { t: '', k: '' }

function cloneBoxes(boxes: Box[]): Box[] {
  return boxes.map((b) => ({ ...b }))
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

  const machines = useMemo(
    () => buildEffectiveMachines(data, base, edits, draft),
    [data, base, edits, draft],
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

  // Bản nháp sạch dựng từ dữ liệu đã lưu (không tính bản nháp hiện tại)
  function freshDraft(code: string, state: MachineStoreState): MachineDraft {
    const m = savedMachines(state)[code]

    return { code, boxes: m ? cloneBoxes(m.boxes) : [], dirty: false, isNew: !m }
  }

  function setStore(state: MachineStoreState) {
    setData(state.data)
    setEdits(state.edits)
  }

  // Nhận trạng thái mới từ store; bản nháp chưa sửa thì dựng lại theo dữ liệu mới
  function applyStore(state: MachineStoreState) {
    setStore(state)
    setDraft((d) =>
      d && !d.dirty
        ? (editing && cur === d.code ? freshDraft(d.code, state) : null)
        : d,
    )
  }

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
        zoom: zoomOnSelect,
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
      // khung đã bị sửa -> đường bao CAD cũ không còn đúng
      boxes[i] = { ...box, p: null }

      return { ...d, boxes, dirty: true }
    })
  }

  function completeDraw(box: Box) {
    if (!draft) return

    const boxes = draft.boxes.slice()
    const drawn = { ...box, p: null }

    if (drawMode === 'replace') {
      boxes[act] = drawn
    } else {
      boxes.push(drawn)
      setAct(boxes.length - 1)
    }

    setDraft({ ...draft, boxes, dirty: true })
    setDrawMode(null)
  }

  function removeLocation() {
    if (!draft) return

    setDraft({ ...draft, boxes: draft.boxes.filter((_, i) => i !== act), dirty: true })
    setAct(0)
  }

  function revertAuto() {
    if (!draft || !cur || !base[cur]) return

    setDraft({ ...draft, boxes: cloneBoxes(base[cur]), dirty: true, revert: true })
    setAct(0)
  }

  function cancel() {
    if (!draft) return

    const c = draft.code
    const m = buildEffectiveMachines(data, base, edits, null)[c]

    setDrawMode(null)

    if (m) {
      setDraft(freshDraft(c, current))
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

      const tag = (document.activeElement as HTMLElement | null)?.tagName

      // Esc ngoài ô nhập: bỏ chọn máy
      if (e.key === 'Escape' && cur && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        clearSelection()
        return
      }

      if (!editing || !draft || !draft.boxes[act] || tag === 'INPUT' || tag === 'TEXTAREA') return

      const st = e.shiftKey ? 3 : 0.5
      const delta = ({
        ArrowLeft: [-st, 0],
        ArrowRight: [st, 0],
        ArrowUp: [0, -st],
        ArrowDown: [0, st],
      } as Record<string, [number, number]>)[e.key]

      if (!delta) return

      e.preventDefault()

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

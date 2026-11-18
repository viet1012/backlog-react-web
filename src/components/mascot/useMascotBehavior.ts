import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import { loadPreference, savePreference } from '../../utils/uiPreferences'
import { MASCOT_DRAG, MASCOT_STORAGE_KEYS, MASCOT_TIMING } from './mascotConfig'
import type { MascotState } from './mascotConfig'

export function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

// ---------------------------------------------------------------------------
// Theo dõi tương tác của user (cho sleepy + bubble bắt chuyện)
// ---------------------------------------------------------------------------
const ACTIVITY_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const

/** lastActivityRef: mốc tương tác gần nhất (ms); sleepy: không tương tác quá sleepyAfterMs */
export function useUserActivity() {
  const lastActivityRef = useRef(Date.now())
  const sleepyRef = useRef(false)
  const [sleepy, setSleepy] = useState(false)

  useEffect(() => {
    function onActivity() {
      lastActivityRef.current = Date.now()
      if (sleepyRef.current) {
        sleepyRef.current = false
        setSleepy(false)
      }
    }
    ACTIVITY_EVENTS.forEach((type) => window.addEventListener(type, onActivity, { passive: true, capture: true }))
    const timer = window.setInterval(() => {
      const next = Date.now() - lastActivityRef.current >= MASCOT_TIMING.sleepyAfterMs
      if (next !== sleepyRef.current) {
        sleepyRef.current = next
        setSleepy(next)
      }
    }, MASCOT_TIMING.activityCheckMs)
    return () => {
      ACTIVITY_EVENTS.forEach((type) => window.removeEventListener(type, onActivity, { capture: true }))
      window.clearInterval(timer)
    }
  }, [])

  return { lastActivityRef, sleepy }
}

// ---------------------------------------------------------------------------
// State machine biểu cảm
// ---------------------------------------------------------------------------
interface MoodInput {
  /** đang chờ LM Studio trả lời */
  pending: boolean
  /** câu cuối là câu trả lời thật từ API (không phải trả lời tại chỗ) */
  lastIsAnswer: boolean
  /** câu cuối là lỗi / timeout */
  lastIsError: boolean
  offline: boolean
  /** màn hiện tại có chat được không */
  supported: boolean
  /** đang hiện bubble chào / bắt chuyện */
  greeting: boolean
  hovered: boolean
  sleepy: boolean
  /** đang bị kéo đi → vui thích thú */
  dragging?: boolean
}

/**
 * Ưu tiên: (đang kéo → happy) > thinking > talking → happy (vừa trả lời) > confused (lỗi) > sad (offline / màn chưa hỗ trợ)
 * > greeting (hover / bubble) > sleepy > idle
 */
export function useMascotState(input: MoodInput): MascotState {
  const { pending, lastIsAnswer, lastIsError, offline, supported, greeting, hovered, sleepy, dragging } = input
  const [reaction, setReaction] = useState<'talking' | 'happy' | null>(null)

  // pending true → false và câu cuối là câu trả lời → "đang nói" rồi "vui"
  const [prevPending, setPrevPending] = useState(pending)
  if (pending !== prevPending) {
    setPrevPending(pending)
    setReaction(!pending && lastIsAnswer ? 'talking' : null)
  }

  useEffect(() => {
    if (!reaction) return
    const timer = window.setTimeout(
      () => setReaction(reaction === 'talking' ? 'happy' : null),
      reaction === 'talking' ? MASCOT_TIMING.talkingMs : MASCOT_TIMING.happyMs,
    )
    return () => window.clearTimeout(timer)
  }, [reaction])

  if (dragging) return 'happy'
  if (pending) return 'thinking'
  if (reaction) return reaction
  if (lastIsError) return 'confused'
  if (offline || !supported) return 'sad'
  if (hovered || greeting) return 'greeting'
  if (sleepy) return 'sleepy'
  return 'idle'
}

// ---------------------------------------------------------------------------
// Chớp mắt / vẫy tay ngẫu nhiên
// ---------------------------------------------------------------------------
/** gọi onTick sau khoảng ngẫu nhiên [min, max], lặp lại; tắt khi !enabled hoặc prefers-reduced-motion */
export function useRandomInterval(enabled: boolean, min: number, max: number, onTick: () => void) {
  const tickRef = useRef(onTick)
  useEffect(() => {
    tickRef.current = onTick
  })

  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return
    let timer: number
    const schedule = () => {
      timer = window.setTimeout(() => {
        tickRef.current()
        schedule()
      }, min + Math.random() * (max - min))
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [enabled, min, max])
}

// ---------------------------------------------------------------------------
// Speech bubble tự hiện
// ---------------------------------------------------------------------------
export interface MascotBubble {
  id: number
  /**
   * entry: chào khi vào trang · unsupported: màn chưa hỗ trợ · idle: bắt chuyện ·
   * welcome: quay lại tab / tỉnh ngủ · reaction: phản ứng sự kiện trên trang (đổi tháng) ·
   * selection: hỏi về đoạn đang bôi đen
   */
  kind: 'entry' | 'unsupported' | 'idle' | 'welcome' | 'reaction' | 'selection'
  text: string
  /** gợi ý kèm theo (dòng phụ) */
  hint?: string
  /** bấm bubble → mở chat điền sẵn câu này */
  question?: string
  /** link chuyển màn */
  link?: { label: string; to: string }
  visibleMs: number
}

export type BubbleDraft = Omit<MascotBubble, 'id'>

interface BubbleOptions {
  /** khóa route hiện tại (đổi → bubble chào mới nếu chưa chào route này) */
  routeKey: string
  /** được phép hiện bubble (panel đóng, không thu nhỏ) */
  enabled: boolean
  /** được bắt chuyện lúc idle (online, không chờ trả lời, màn hỗ trợ) */
  canIdle: boolean
  lastActivityRef: { current: number }
  buildEntry: () => BubbleDraft | null
  buildIdle: () => BubbleDraft | null
}

/**
 * Lịch hiện bubble, chống spam:
 * - chào mỗi route 1 lần / phiên
 * - bắt chuyện khi idle ≥ idleBubbleAfterMs, cách bubble trước ≥ bubbleMinGapMs
 * - bỏ qua bubble bắt chuyện maxIgnoredBubbles lần → ngừng tới khi reload
 * - "Đừng nhắc nữa" → lưu localStorage, tắt hẳn
 */
export function useMascotBubble({ routeKey, enabled, canIdle, lastActivityRef, buildEntry, buildIdle }: BubbleOptions) {
  const [muted, setMuted] = useState(() => loadPreference(MASCOT_STORAGE_KEYS.bubblesMuted) === true)
  const [bubble, setBubble] = useState<MascotBubble | null>(null)
  const nextId = useRef(0)
  const greetedRoutes = useRef(new Set<string>())
  const ignoredCount = useRef(0)
  const lastShownAt = useRef(0)

  // giá trị mới nhất cho timer (không làm effect chạy lại)
  const latest = useRef({ enabled, canIdle, muted, bubble, buildEntry, buildIdle })
  useEffect(() => {
    latest.current = { enabled, canIdle, muted, bubble, buildEntry, buildIdle }
  })

  const show = useCallback((draft: BubbleDraft) => {
    lastShownAt.current = Date.now()
    setBubble({ ...draft, id: nextId.current++ })
  }, [])

  // đổi route → ẩn bubble cũ; route chưa chào → chào sau một nhịp
  useEffect(() => {
    setBubble(null)
    if (greetedRoutes.current.has(routeKey)) return
    const timer = window.setTimeout(() => {
      // đánh dấu lúc timer chạy (StrictMode chạy effect 2 lần, không mất lượt chào)
      greetedRoutes.current.add(routeKey)
      const { enabled: on, muted: off, buildEntry: build } = latest.current
      if (!on || off) return
      const draft = build()
      if (draft) show(draft)
    }, MASCOT_TIMING.entryBubbleDelayMs)
    return () => window.clearTimeout(timer)
  }, [routeKey, show])

  // panel mở / thu nhỏ → ẩn (không tính là bỏ qua)
  useEffect(() => {
    if (!enabled) setBubble(null)
  }, [enabled])

  // bắt chuyện khi idle
  useEffect(() => {
    const timer = window.setInterval(() => {
      const cur = latest.current
      if (!cur.enabled || !cur.canIdle || cur.muted || cur.bubble || document.hidden) return
      if (ignoredCount.current >= MASCOT_TIMING.maxIgnoredBubbles) return
      const now = Date.now()
      const idleFor = now - Math.max(lastActivityRef.current, lastShownAt.current)
      if (idleFor < MASCOT_TIMING.idleBubbleAfterMs) return
      if (now - lastShownAt.current < MASCOT_TIMING.bubbleMinGapMs) return
      const draft = cur.buildIdle()
      if (draft) show(draft)
    }, MASCOT_TIMING.activityCheckMs)
    return () => window.clearInterval(timer)
  }, [lastActivityRef, show])

  // tự ẩn; bubble bắt chuyện tự ẩn = user bỏ qua
  useEffect(() => {
    if (!bubble) return
    const timer = window.setTimeout(() => {
      if (bubble.kind === 'idle') ignoredCount.current += 1
      setBubble(null)
    }, bubble.visibleMs)
    return () => window.clearTimeout(timer)
  }, [bubble])

  /** bấm X */
  const dismiss = useCallback(() => {
    if (latest.current.bubble?.kind === 'idle') ignoredCount.current += 1
    setBubble(null)
  }, [])

  /** bấm vào bubble / link → user có phản hồi */
  const accept = useCallback(() => {
    ignoredCount.current = 0
    setBubble(null)
  }, [])

  /** "Đừng nhắc nữa" */
  const mute = useCallback(() => {
    setMuted(true)
    savePreference(MASCOT_STORAGE_KEYS.bubblesMuted, true)
    setBubble(null)
  }, [])

  /**
   * Hiện bubble theo sự kiện. respond = phản hồi trực tiếp hành động của user (đổi tháng, bôi đen):
   * bỏ qua giới hạn khoảng cách / số lần bỏ qua, thay bubble đang hiện. Luôn tôn trọng "Đừng nhắc nữa".
   */
  const push = useCallback((draft: BubbleDraft, respond = false) => {
    const cur = latest.current
    if (!cur.enabled || cur.muted) return
    if (!respond) {
      if (cur.bubble || ignoredCount.current >= MASCOT_TIMING.maxIgnoredBubbles) return
      if (Date.now() - lastShownAt.current < MASCOT_TIMING.bubbleMinGapMs) return
    }
    show(draft)
  }, [show])

  /** ẩn bubble đang hiện nếu đúng loại */
  const hide = useCallback((kind: MascotBubble['kind']) => {
    if (latest.current.bubble?.kind === kind) setBubble(null)
  }, [])

  return { bubble, muted, dismiss, accept, mute, push, hide }
}

// ---------------------------------------------------------------------------
// Kéo thả mascot
// ---------------------------------------------------------------------------
/** khoảng cách (px) từ mascot tới mép phải / dưới màn hình – neo theo góc dưới phải nên resize vẫn hợp lý */
export interface MascotOffset {
  right: number
  bottom: number
}

/**
 * Hướng mở panel / bubble so với mascot:
 * side 'left' = mascot đang ở nửa trái → panel mở sang phải; vert 'top' = nửa trên → panel mở xuống dưới
 */
export interface MascotLayout {
  side: 'left' | 'right'
  vert: 'top' | 'bottom'
}

const DEFAULT_LAYOUT: MascotLayout = { side: 'right', vert: 'bottom' }

function parseOffset(value: unknown): MascotOffset | null {
  if (typeof value !== 'object' || value === null) return null
  const { right, bottom } = value as Record<string, unknown>
  return typeof right === 'number' && typeof bottom === 'number' && Number.isFinite(right) && Number.isFinite(bottom)
    ? { right, bottom }
    : null
}

function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

interface DragState {
  pointerId: number
  x: number
  y: number
  start: MascotOffset
  moved: boolean
  layout: MascotLayout
}

/**
 * Kéo mascot bằng chuột / cảm ứng (pointer events), Alt + mũi tên bằng bàn phím.
 * Vị trí lưu localStorage; tự kẹp trong màn hình khi resize. Màn hẹp → về góc mặc định, không kéo.
 * size: kích thước mascot (px) để kẹp trong màn hình.
 */
export function useMascotDrag(size: { width: number; height: number }) {
  const { thresholdPx, edgeMarginPx: margin, defaultRight, defaultBottom, keyboardStepPx, minViewportWidth } = MASCOT_DRAG
  const [saved, setSaved] = useState<MascotOffset | null>(() => parseOffset(loadPreference(MASCOT_STORAGE_KEYS.position)))
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  const [dragging, setDragging] = useState(false)
  // vừa thả → nảy nhẹ (CSS .landed, gỡ ở animationend 'land')
  const [landed, setLanded] = useState(false)
  const drag = useRef<DragState | null>(null)
  const suppressClick = useRef(false)

  useEffect(() => {
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const narrow = viewport.width < minViewportWidth

  const clamp = useCallback((offset: MascotOffset): MascotOffset => ({
    right: clampValue(offset.right, margin, viewport.width - size.width - margin),
    bottom: clampValue(offset.bottom, margin, viewport.height - size.height - margin),
  }), [margin, viewport.width, viewport.height, size.width, size.height])

  const current = clamp(saved ?? { right: defaultRight, bottom: defaultBottom })

  function layoutOf(offset: MascotOffset): MascotLayout {
    const centerX = viewport.width - offset.right - size.width / 2
    const centerY = viewport.height - offset.bottom - size.height / 2
    return {
      side: centerX < viewport.width / 2 ? 'left' : 'right',
      vert: centerY < viewport.height / 2 ? 'top' : 'bottom',
    }
  }

  // đang kéo → giữ hướng panel lúc bắt đầu (không nhảy khi đi qua giữa màn hình)
  const layout = narrow ? DEFAULT_LAYOUT : drag.current?.moved ? drag.current.layout : layoutOf(current)

  function commit(offset: MascotOffset) {
    const next = clamp(offset)
    setSaved(next)
    savePreference(MASCOT_STORAGE_KEYS.position, next)
  }

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (narrow || event.button !== 0 || !event.isPrimary) return
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      start: current,
      moved: false,
      layout: layoutOf(current),
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const state = drag.current
    if (!state || state.pointerId !== event.pointerId) return
    const dx = event.clientX - state.x
    const dy = event.clientY - state.y
    if (!state.moved) {
      if (Math.hypot(dx, dy) < thresholdPx) return
      state.moved = true
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragging(true)
      setLanded(false)
    }
    setSaved(clamp({ right: state.start.right - dx, bottom: state.start.bottom - dy }))
  }

  function endDrag(event: ReactPointerEvent<HTMLElement>) {
    const state = drag.current
    if (!state || state.pointerId !== event.pointerId) return
    drag.current = null
    if (!state.moved) return
    // pointerup sau khi kéo vẫn sinh click → bỏ qua click đó
    suppressClick.current = true
    window.setTimeout(() => { suppressClick.current = false }, 0)
    setDragging(false)
    if (!prefersReducedMotion()) setLanded(true)
    commit({ right: state.start.right - (event.clientX - state.x), bottom: state.start.bottom - (event.clientY - state.y) })
  }

  /** gọi đầu handleClick: true → click này là cuối thao tác kéo, bỏ qua */
  function consumeClick() {
    if (!suppressClick.current) return false
    suppressClick.current = false
    return true
  }

  /** Alt + mũi tên → dịch mascot */
  function onKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (narrow || !event.altKey) return
    const step = keyboardStepPx
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    }
    const move = delta[event.key]
    if (!move) return
    event.preventDefault()
    commit({ right: current.right + move[0], bottom: current.bottom + move[1] })
  }

  function reset() {
    setSaved(null)
    savePreference(MASCOT_STORAGE_KEYS.position, null)
  }

  return {
    /** null → màn hẹp, dùng vị trí CSS mặc định */
    offset: narrow ? null : current,
    /** khoảng trống (px) từ đáy mascot lên mép trên / từ đỉnh mascot xuống mép dưới – giới hạn chiều cao panel */
    space: narrow
      ? null
      : { above: viewport.height - current.bottom, below: current.bottom + size.height },
    layout,
    dragging,
    landed,
    clearLanded: () => setLanded(false),
    /** đã rời góc mặc định → hiện nút "Đưa về góc" */
    moved: !narrow && saved !== null,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onKeyDown,
    },
    consumeClick,
    reset,
  }
}

// ---------------------------------------------------------------------------
// Quay lại tab sau thời gian dài
// ---------------------------------------------------------------------------
export function useWelcomeBack(onWelcomeBack: () => void) {
  const callback = useRef(onWelcomeBack)
  useEffect(() => {
    callback.current = onWelcomeBack
  })

  useEffect(() => {
    let hiddenAt: number | null = document.hidden ? Date.now() : null
    function onVisibility() {
      if (document.hidden) {
        hiddenAt = Date.now()
      } else if (hiddenAt !== null) {
        if (Date.now() - hiddenAt >= MASCOT_TIMING.welcomeBackAfterMs) callback.current()
        hiddenAt = null
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])
}

// ---------------------------------------------------------------------------
// Bôi đen văn bản trên trang → gợi ý hỏi mascot
// ---------------------------------------------------------------------------
/**
 * onSelect(text): user vừa bôi đen xong (độ dài hợp lệ, ngoài mascot);
 * onClear(): click ra chỗ khác mà không còn vùng chọn
 */
export function useTextSelection(
  enabled: boolean,
  ignoreRef: { current: HTMLElement | null },
  minChars: number,
  maxChars: number,
  onSelect: (text: string) => void,
  onClear: () => void,
) {
  const handlers = useRef({ onSelect, onClear })
  useEffect(() => {
    handlers.current = { onSelect, onClear }
  })

  useEffect(() => {
    if (!enabled) return
    let timer: number | undefined
    function onUp(event: Event) {
      // thao tác trong mascot (bubble, panel) không tính
      if (ignoreRef.current?.contains(event.target as Node)) return
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        const selection = window.getSelection()
        const text = selection?.toString().replace(/\s+/g, ' ').trim() ?? ''
        const anchor = selection?.anchorNode ?? null
        if (anchor && ignoreRef.current?.contains(anchor)) return
        if (text.length >= minChars && text.length <= maxChars) handlers.current.onSelect(text)
        else if (text.length === 0) handlers.current.onClear()
      }, MASCOT_TIMING.selectionDebounceMs)
    }
    document.addEventListener('mouseup', onUp)
    document.addEventListener('keyup', onUp)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('keyup', onUp)
    }
  }, [enabled, ignoreRef, minChars, maxChars])
}

// ---------------------------------------------------------------------------
// Mắt nhìn theo con trỏ (ghi CSS var trực tiếp lên phần tử, không re-render)
// ---------------------------------------------------------------------------
export function useEyeFollow(
  enabled: boolean,
  targetRef: { current: HTMLElement | null },
  maxOffset: number,
  fullAtPx: number,
  /** vị trí dọc của mắt theo tỉ lệ chiều cao phần tử (0.36: mascot đầy đủ, ~0.58: avatar chỉ có đầu) */
  eyeY = 0.36,
  /** đổi giá trị khi ref trỏ sang phần tử khác (vd. thu nhỏ ↔ đầy đủ) để gắn lại */
  elementKey?: unknown,
) {
  useEffect(() => {
    const target = targetRef.current
    if (!enabled || !target || prefersReducedMotion()) return
    let frame = 0
    let pointer: { x: number; y: number } | null = null

    function update() {
      frame = 0
      if (!target || !pointer) return
      const rect = target.getBoundingClientRect()
      // tâm mắt ≈ 50% ngang, 36% dọc của mascot (viewBox 160×200, mắt ở y≈73)
      const dx = pointer.x - (rect.left + rect.width * 0.5)
      const dy = pointer.y - (rect.top + rect.height * eyeY)
      const dist = Math.hypot(dx, dy) || 1
      const strength = Math.min(1, dist / fullAtPx) * maxOffset
      target.style.setProperty('--eye-x', `${((dx / dist) * strength).toFixed(2)}px`)
      target.style.setProperty('--eye-y', `${((dy / dist) * strength).toFixed(2)}px`)
    }

    function onMove(event: PointerEvent) {
      pointer = { x: event.clientX, y: event.clientY }
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.cancelAnimationFrame(frame)
      target.style.removeProperty('--eye-x')
      target.style.removeProperty('--eye-y')
    }
  }, [enabled, targetRef, maxOffset, fullAtPx, eyeY, elementKey])
}

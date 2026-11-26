import CloudOffRoundedIcon from '@mui/icons-material/CloudOffRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import type { AnimationEvent, CSSProperties } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'
import { AssistantApiError, normalizeMonth, postAssistantChat } from '../../services/assistantService'
import type { AssistantChatTurn } from '../../services/assistantService'
import { loadPreference, savePreference } from '../../utils/uiPreferences'
// Chat panel (react-markdown + remark-gfm) is its own chunk: it used to sit in
// the main bundle every page loads, though it only renders once opened.
// Preloaded when the browser is idle, so opening it is still instant.
const loadChatPanel = () => import('./MascotChatPanel')
const MascotChatPanel = lazy(() => loadChatPanel().then((m) => ({ default: m.MascotChatPanel })))

function preloadChatPanelWhenIdle() {
  const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2000))
  idle(() => { void loadChatPanel() })
}
import type { ChatItem } from './MascotChatPanel'
import {
  getSupportedScreens,
  MASCOT_EYE_FOLLOW,
  MASCOT_SELECTION,
  MASCOT_TEXTS,
  MASCOT_TIMING,
} from './mascotConfig'
import type { MascotLine, MascotState } from './mascotConfig'
import { useMascotContext, useMascotName } from './mascotContext'
import { getMascotScreen } from './mascotMessages'
import { MascotSpeechBubble } from './MascotSpeechBubble'
import { MascotChatResume } from './MascotChatResume'
import { MASCOT_VIEWBOX, MascotSvg } from './MascotSvg'
import { createMascotSpin } from './mascotSpin'
import { MascotTurntable, SpinningMascotSvg } from './MascotTurntable'
import {
  prefersReducedMotion,
  useEyeFollow,
  useMascotBubble,
  useMascotState,
  useRandomInterval,
  useTextSelection,
  useUserActivity,
  useMascotDrag,
  useWelcomeBack,
} from './useMascotBehavior'
import type { BubbleDraft, MascotBubble } from './useMascotBehavior'
import { FOLLOW_UP_COUNT, INITIAL_COUNT, useMascotSuggestions } from './useMascotSuggestions'
import styles from './Mascot.module.css'

/** Chiều cao mascot (px) – chiều rộng tính theo tỉ lệ viewBox 160:200 */
const MASCOT_HEIGHT = 140
const MASCOT_WIDTH = Math.round((MASCOT_HEIGHT * MASCOT_VIEWBOX.width) / MASCOT_VIEWBOX.height)
const MASCOT_SIZE = { width: MASCOT_WIDTH, height: MASCOT_HEIGHT }

const HOVER_WAVES = 2
const CLICK_WAVES = 3
const HISTORY_SIZE = 6
const MINIMIZED_KEY = 'mascot:minimized'
const PANEL_ID = 'mascot-chat-panel'
/** loại bubble mà mascot vẫy tay khi hiện */
const WAVE_BUBBLES: MascotBubble['kind'][] = ['entry', 'idle', 'welcome']
/** huy hiệu nhỏ cạnh avatar thu nhỏ theo biểu cảm */
const MINI_BADGES: Partial<Record<MascotState, string>> = {
  thinking: '…',
  sleepy: 'z',
  confused: '?',
  happy: '✦',
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

type ChatItemInput =
  | Omit<Extract<ChatItem, { kind: 'user' }>, 'id'>
  | Omit<Extract<ChatItem, { kind: 'assistant' }>, 'id'>
  | Omit<Extract<ChatItem, { kind: 'error' }>, 'id'>
  | Omit<Extract<ChatItem, { kind: 'divider' }>, 'id'>

export function Mascot() {
  const { t, language } = useI18n()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  useEffect(preloadChatPanelWhenIdle, [])
  const { params, monthControl, openChatSeq, elevated, status, retry, reportStatus, skin } = useMascotContext()
  const offline = status === 'offline'
  const reconnecting = status === 'reconnecting'
  // UI coi "đang kết nối lại" như offline (không nháy giữa 2 trạng thái)
  const offlineUi = offline || reconnecting
  const name = useMascotName()
  // tháng đang xem trên màn hình, dạng "YYYY.MM"
  const viewingMonth = normalizeMonth(params.month)
  const screen = getMascotScreen(pathname, t, language, name)
  const supported = Boolean(screen.screenKey)
  const texts = MASCOT_TEXTS[language]
  const supportedScreens = getSupportedScreens(language)
  const supportedLabel = supportedScreens.map((s) => s.name).join(', ')

  const [minimized, setMinimized] = useState(() => loadPreference(MINIMIZED_KEY) === true)
  const [waveCount, setWaveCount] = useState(0) // 0 = không vẫy
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [blink, setBlink] = useState(false)
  // bấm bubble có câu hỏi gợi ý → mở chat điền sẵn câu này
  const [prefill, setPrefill] = useState<string | undefined>(undefined)
  const { lastActivityRef, sleepy } = useUserActivity()
  // kéo thả mascot đi chỗ khác (vị trí lưu localStorage)
  const dragApi = useMascotDrag(MASCOT_SIZE)
  // xoay 360° bằng bàn xoay dưới chân (kéo thân mascot vẫn là di chuyển như cũ)
  const spin = useMemo(() => createMascotSpin(), [])
  useEffect(() => () => spin.dispose(), [spin])
  // hover / focus vào mascot → tải trước gợi ý, mở panel là có ngay câu chào + gợi ý từ API
  const [warm, setWarm] = useState(false)
  const suggestions = useMascotSuggestions({
    active: (open || warm) && !minimized,
    screenKey: screen.screenKey,
    params,
    lang: language,
    staticSuggestions: screen.suggestions,
  })
  // vừa kết nối lại → mascot vẫy tay báo hiệu + tải lại gợi ý nếu lần trước bị lỗi
  const [prevStatus, setPrevStatus] = useState(status)
  if (status !== prevStatus) {
    setPrevStatus(status)
    if (status === 'online' && (prevStatus === 'offline' || prevStatus === 'reconnecting')) {
      if (!prefersReducedMotion()) setWaveCount(CLICK_WAVES)
      if (suggestions.initialFailed) suggestions.reloadInitial()
    }
  }

  // Lịch sử chat tách theo screenKey, sống cùng Mascot (ở layout) → mỗi màn chỉ thấy chat của màn đó,
  // quay lại vẫn còn; mất khi reload
  const [itemsByScreen, setItemsByScreen] = useState<Record<string, ChatItem[]>>({})
  const [pendingScreens, setPendingScreens] = useState<Record<string, boolean>>({})
  const currentKey = screen.screenKey ?? ''
  const items = itemsByScreen[currentKey] ?? []
  const pending = pendingScreens[currentKey] === true
  const nextId = useRef(0)
  const abortRef = useRef<Record<string, AbortController>>({})
  const restartFrame = useRef<number | undefined>(undefined)
  const bodyRef = useRef<HTMLButtonElement>(null)

  // đóng panel → thôi tải trước (đổi tháng lúc panel đóng không gọi API gợi ý)
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (!open) {
      setWarm(false)
      setPrefill(undefined)
    }
  }

  // Thu nhỏ khung chat: panel ẩn (vẫn mount, giữ câu đang gõ), bong bóng "đang trò chuyện" trên đầu mascot.
  // Đóng panel -> lần mở sau luôn mở đầy đủ.
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const [seenCount, setSeenCount] = useState(0)

  // Trang yêu cầu mở chat (vd nút "Hỏi … về khung này") → bỏ thu nhỏ + mở panel
  const [prevOpenChatSeq, setPrevOpenChatSeq] = useState(openChatSeq)
  if (openChatSeq !== prevOpenChatSeq) {
    setPrevOpenChatSeq(openChatSeq)
    if (minimized) {
      setMinimized(false)
      savePreference(MINIMIZED_KEY, false)
    }
    setChatCollapsed(false)
    setOpen(true)
  }

  if (!open && chatCollapsed) setChatCollapsed(false)

  function collapseChat() {
    setSeenCount(items.length)
    setChatCollapsed(true)
  }

  // Câu trả lời về trong lúc thu nhỏ -> bong bóng báo "có trả lời mới" + mascot vẫy tay
  const lastItem = items[items.length - 1]
  const hasNewReply = chatCollapsed && items.length > seenCount && lastItem?.kind === 'assistant'
  useEffect(() => {
    if (hasNewReply) startWave(CLICK_WAVES)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNewReply])

  useEffect(() => () => {
    window.cancelAnimationFrame(restartFrame.current ?? 0)
    Object.values(abortRef.current).forEach((controller) => controller.abort())
  }, [])

  // Esc đóng panel, trả focus về mascot
  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        bodyRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  function appendItem(screenKey: string, item: ChatItemInput): number {
    const id = nextId.current++
    setItemsByScreen((prev) => ({
      ...prev,
      [screenKey]: [...(prev[screenKey] ?? []), { ...item, id } as ChatItem],
    }))
    return id
  }

  function setScreenPending(screenKey: string, value: boolean) {
    setPendingScreens((prev) => ({ ...prev, [screenKey]: value }))
  }

  function startWave(count: number) {
    if (prefersReducedMotion()) return
    // đang vẫy → tắt 1 frame rồi bật lại để animation chạy lại từ đầu
    setWaveCount(0)
    window.cancelAnimationFrame(restartFrame.current ?? 0)
    restartFrame.current = window.requestAnimationFrame(() => setWaveCount(count))
  }

  function handleMouseEnter() {
    if (waveCount === 0) startWave(HOVER_WAVES)
    setWarm(true)
    setHovered(true)
  }

  function handleClick() {
    // vừa kéo thả xong → không tính là click mở chat
    if (dragApi.consumeClick()) return
    // đang thu nhỏ → bấm mascot là mở lại khung chat (không đóng)
    if (open && chatCollapsed) {
      setChatCollapsed(false)
      return
    }
    if (!open) {
      startWave(CLICK_WAVES)
      // mở panel lúc đang offline → kiểm tra lại kết nối ngay
      if (offline) retry()
    }
    setOpen(!open)
  }

  function handleAnimationEnd(event: AnimationEvent) {
    // tên keyframes bị CSS module băm → so theo chuỗi con
    if (event.animationName.includes('wave')) setWaveCount(0)
    if (event.animationName.includes('blinkOnce')) setBlink(false)
    if (event.animationName.includes('landBounce')) dragApi.clearLanded()
  }

  function toggleMinimized(next: boolean) {
    setMinimized(next)
    savePreference(MINIMIZED_KEY, next)
    setOpen(false)
    setWaveCount(0)
  }

  /**
   * Gửi câu hỏi. `retryOf` = item lỗi cần thử lại: bỏ item lỗi, gửi lại câu hỏi của nó
   * (không thêm bubble user mới, history chỉ tính các lượt trước câu đó).
   */
  async function send(question: string, retryOf?: Extract<ChatItem, { kind: 'error' }>) {
    if (pending || !question) return
    const screenKey = screen.screenKey
    // màn chưa hỗ trợ: trả lời tại chỗ, không gọi API
    if (!screenKey) {
      appendItem(currentKey, { kind: 'user', text: question })
      appendItem(currentKey, {
        kind: 'assistant',
        text: texts.outOfScopeReply(name, supportedLabel),
        sources: [],
        local: true,
      })
      return
    }

    const userIndex = retryOf?.userId !== undefined
      ? items.findIndex((item) => item.id === retryOf.userId)
      : -1
    const before = userIndex >= 0 ? items.slice(0, userIndex) : items

    const history: AssistantChatTurn[] = before
      .filter((item): item is Extract<ChatItem, { kind: 'user' | 'assistant' }> =>
        item.kind === 'user' || item.kind === 'assistant')
      .slice(-HISTORY_SIZE)
      .map((item) => ({ role: item.kind, content: item.text }))

    let userId: number
    if (retryOf && userIndex >= 0) {
      userId = retryOf.userId!
      setItemsByScreen((prev) => ({
        ...prev,
        [screenKey]: (prev[screenKey] ?? []).filter((item) => item.id !== retryOf.id),
      }))
    } else {
      userId = appendItem(screenKey, { kind: 'user', text: question })
      suggestions.recordAsked(question)
    }
    setScreenPending(screenKey, true)

    // chuyển màn khi đang chờ → câu trả lời vẫn ghi vào lịch sử của màn đã hỏi
    const controller = new AbortController()
    abortRef.current[screenKey] = controller

    try {
      const { answer, sources, answeredMonth, charts, card } = await postAssistantChat(
        { screenKey, params, question, history, lang: language },
        controller.signal,
      )
      // service đã ném LLM_EMPTY khi answer rỗng; chặn thêm ở đây để không bao giờ có bubble trống
      if (!answer.trim()) throw new AssistantApiError('LLM_EMPTY', { kind: 'http' })
      const answerId = appendItem(screenKey, { kind: 'assistant', text: answer, sources, answeredMonth, charts, card })
      suggestions.requestFollowUp(answerId, screenKey)
      reportStatus('online')
    } catch (error) {
      if (controller.signal.aborted) return
      // không gọi được server → chuyển offline (lỗi HTTP / timeout: server vẫn sống)
      if (error instanceof AssistantApiError && error.detail.kind === 'network') reportStatus('offline')
      appendItem(screenKey, error instanceof AssistantApiError
        ? { kind: 'error', code: error.code, detail: error.detail, question, userId }
        : { kind: 'error', code: 'INTERNAL', question, userId })
    } finally {
      if (!controller.signal.aborted) {
        setScreenPending(screenKey, false)
        delete abortRef.current[screenKey]
      }
    }
  }

  // Hủy câu đang chờ ở màn hiện tại; câu hỏi vẫn giữ trong lịch sử, có thể gửi lại
  function cancelPending() {
    abortRef.current[currentKey]?.abort()
    delete abortRef.current[currentKey]
    setScreenPending(currentKey, false)
  }

  function retryError(errorId: number) {
    const item = items.find((i): i is Extract<ChatItem, { kind: 'error' }> =>
      i.kind === 'error' && i.id === errorId)
    if (item?.question) void send(item.question, item)
  }

  function startNewConversation() {
    // chỉ xóa chat của màn hiện tại; hủy câu đang chờ (send() bỏ qua kết quả khi đã abort)
    abortRef.current[currentKey]?.abort()
    delete abortRef.current[currentKey]
    setScreenPending(currentKey, false)
    setItemsByScreen((prev) => ({ ...prev, [currentKey]: [] }))
    suggestions.newConversation()
  }

  // Gợi ý: chưa hỏi gì ở màn này → bộ 4 câu; ngay sau câu trả lời → 2 câu follow-up
  const last = items.at(-1)
  const atStart = !last || last.kind === 'divider'
  const visibleSuggestions = atStart
    ? suggestions.initial
    : last.kind === 'assistant'
      ? suggestions.followUpFor(last.id)
      : null
  // đang tải → số khung skeleton giữ chỗ (offline: API lỗi ngay → dùng nội dung tĩnh, không skeleton)
  const suggestionSkeletons = offline
    ? 0
    : atStart
      ? (suggestions.initialLoading ? INITIAL_COUNT : 0)
      : last.kind === 'assistant' && suggestions.isFollowUpLoading(last.id)
        ? FOLLOW_UP_COUNT
        : 0
  // màn có chat: câu chào từ API; đang tải → null (panel hiện "đang gõ"); lỗi → câu tĩnh
  const greeting = screen.screenKey
    ? suggestions.greeting
      ?? (suggestions.initialLoading && !offline ? null : screen.greeting ?? screen.lines[0])
    : texts.unsupportedGreeting(name)

  // ---- Speech bubble tự hiện ----
  // màn chưa hỗ trợ: khóa theo đoạn đầu của path → mỗi màn chào 1 lần / phiên
  const routeKey = screen.route ?? `/${pathname.split('/')[1] ?? ''}`
  const lastIdleLine = useRef<number>(-1)

  function buildEntry(): BubbleDraft | null {
    if (!supported) {
      const target = supportedScreens[0]
      return {
        kind: 'unsupported',
        text: texts.unsupportedBubble(supportedLabel),
        link: target ? { label: texts.goTo(target.name), to: target.route } : undefined,
        visibleMs: MASCOT_TIMING.unsupportedBubbleVisibleMs,
      }
    }
    const question = screen.suggestions[0]
    return {
      kind: 'entry',
      text: screen.greeting ?? '',
      hint: question ? texts.tryAsking(question) : undefined,
      question,
      visibleMs: MASCOT_TIMING.entryBubbleVisibleMs,
    }
  }

  function buildIdle(): BubbleDraft | null {
    const lines = screen.idleLines
    if (lines.length === 0) return null
    // tránh lặp lại đúng câu vừa nói
    let index = Math.floor(Math.random() * lines.length)
    if (lines.length > 1 && index === lastIdleLine.current) index = (index + 1) % lines.length
    lastIdleLine.current = index
    return { kind: 'idle', ...lines[index], visibleMs: MASCOT_TIMING.idleBubbleVisibleMs }
  }

  const speech = useMascotBubble({
    routeKey,
    enabled: !open && !minimized,
    canIdle: supported && !offlineUi && !pending,
    lastActivityRef,
    buildEntry,
    buildIdle,
  })
  const bubble = speech.bubble
  const { push: pushBubble, hide: hideBubble } = speech

  // bubble chào / bắt chuyện / chào mừng quay lại → vẫy tay
  const [prevBubbleId, setPrevBubbleId] = useState(bubble?.id)
  if (bubble?.id !== prevBubbleId) {
    setPrevBubbleId(bubble?.id)
    if (bubble && WAVE_BUBBLES.includes(bubble.kind) && !prefersReducedMotion()) setWaveCount(HOVER_WAVES)
  }

  /** câu thoại → bubble; màn chưa hỗ trợ thì bỏ câu hỏi gợi ý (không hỏi được) */
  function lineBubble(line: MascotLine, kind: MascotBubble['kind'], visibleMs: number): BubbleDraft {
    const question = supported ? line.question : undefined
    return { kind, text: line.text, question, hint: question ? texts.tryAsking(question) : undefined, visibleMs }
  }

  // ---- Tương tác: tỉnh ngủ → chào lại ----
  const prevSleepyRef = useRef(sleepy)
  useEffect(() => {
    const wasSleepy = prevSleepyRef.current
    prevSleepyRef.current = sleepy
    if (wasSleepy && !sleepy) {
      pushBubble(lineBubble(pickRandom(texts.wakeUp(name)), 'welcome', MASCOT_TIMING.reactionBubbleVisibleMs))
    }
    // chỉ phản ứng khi sleepy đổi
  }, [sleepy])

  // ---- Tương tác: quay lại tab sau thời gian dài ----
  useWelcomeBack(() => {
    pushBubble(lineBubble(pickRandom(texts.welcomeBack(name)), 'welcome', MASCOT_TIMING.reactionBubbleVisibleMs))
  })

  // ---- Tương tác: đổi tháng trên màn → gợi ý tóm tắt tháng mới (phản hồi trực tiếp thao tác của user) ----
  const prevMonthRef = useRef(viewingMonth)
  useEffect(() => {
    const prevMonth = prevMonthRef.current
    prevMonthRef.current = viewingMonth
    if (!prevMonth || !viewingMonth || prevMonth === viewingMonth || !screen.monthChanged) return
    pushBubble(lineBubble(screen.monthChanged(viewingMonth), 'reaction', MASCOT_TIMING.reactionBubbleVisibleMs), true)
    // chỉ phản ứng khi tháng đổi
  }, [viewingMonth])

  // ---- Tương tác: bôi đen văn bản → "Hỏi mình về …?" ----
  const rootRef = useRef<HTMLDivElement>(null)
  useTextSelection(
    supported && !open && !minimized,
    rootRef,
    MASCOT_SELECTION.minChars,
    MASCOT_SELECTION.maxChars,
    (text) => {
      const preview = text.length > MASCOT_SELECTION.previewChars
        ? `${text.slice(0, MASCOT_SELECTION.previewChars).trimEnd()}…`
        : text
      pushBubble({
        kind: 'selection',
        text: texts.selectionAsk(preview),
        question: texts.selectionQuestion(text),
        visibleMs: MASCOT_TIMING.selectionBubbleVisibleMs,
      }, true)
    },
    () => hideBubble('selection'),
  )

  // ---- Tương tác: mắt nhìn theo con trỏ ----
  useEyeFollow(
    true,
    rootRef,
    MASCOT_EYE_FOLLOW.maxOffset,
    MASCOT_EYE_FOLLOW.fullAtPx,
    minimized ? 0.58 : 0.36,
    minimized,
  )

  // ---- State machine biểu cảm ----
  const mood = useMascotState({
    pending,
    lastIsAnswer: last?.kind === 'assistant' && !last.local,
    lastIsError: last?.kind === 'error',
    offline: offlineUi,
    supported,
    greeting: Boolean(bubble && bubble.kind !== 'unsupported'),
    hovered,
    sleepy: sleepy && !open,
    dragging: dragApi.dragging,
  })

  // chớp mắt ngẫu nhiên; vẫy tay ngẫu nhiên lúc rảnh
  useRandomInterval(true, MASCOT_TIMING.blinkMinMs, MASCOT_TIMING.blinkMaxMs, () => setBlink(true))
  useRandomInterval(
    !minimized && !open && mood === 'idle',
    MASCOT_TIMING.randomWaveMinMs,
    MASCOT_TIMING.randomWaveMaxMs,
    () => setWaveCount((count) => count || 1),
  )

  function openFromBubble() {
    const question = bubble?.question
    speech.accept()
    if (question) setPrefill(question)
    if (offline) retry()
    setChatCollapsed(false)
    setOpen(true)
  }

  function followBubbleLink(to: string) {
    speech.accept()
    navigate(to)
  }

  // nổi trên Drawer (1200) / Modal (1300) của MUI khi trang bật elevated
  const elevatedStyle = {
    ...(elevated && { zIndex: 1350 }),
    // nền avatar tròn khi thu nhỏ theo skin
    '--mascot-avatar-bg': skin.avatarBg,
    // vị trí sau khi kéo (null → góc mặc định trong CSS)
    ...(dragApi.offset && {
      '--mascot-right': `${dragApi.offset.right}px`,
      '--mascot-bottom': `${dragApi.offset.bottom}px`,
    }),
    ...(dragApi.space && {
      '--space-above': `${dragApi.space.above}px`,
      '--space-below': `${dragApi.space.below}px`,
    }),
  } as CSSProperties

  if (minimized) {
    const badge = MINI_BADGES[mood]
    return (
      <div
        ref={rootRef}
        className={[
          styles.root,
          styles.mini,
          supported ? '' : styles.dim,
          dragApi.dragging ? styles.dragging : '',
          dragApi.landed ? styles.landed : '',
        ].filter(Boolean).join(' ')}
        style={elevatedStyle}
      >
        <button
          type="button"
          className={`${styles.avatar} ${mood === 'thinking' ? styles.avatarPulse : ''}`}
          aria-label={t.mascot.expand}
          title={`${t.mascot.expand} · ${texts.dragHint(name)}`}
          {...dragApi.handlers}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => {
            // vừa kéo thả xong → không mở rộng
            if (dragApi.consumeClick()) return
            setHovered(false)
            toggleMinimized(false)
          }}
          onAnimationEnd={handleAnimationEnd}
        >
          <MascotSvg
            waving={false}
            headOnly
            mood={mood}
            blink={blink}
            followCursor
            className={`${styles.avatarSvg} ${styles.miniSvg}`}
          />
        </button>
        {/* huy hiệu biểu cảm nhỏ (suy nghĩ / buồn ngủ / bối rối / vui) – thay cho hiệu ứng của mascot đầy đủ */}
        {badge && (
          <span key={mood} className={styles.miniBadge} aria-hidden="true">
            {badge}
          </span>
        )}
        {/* thu nhỏ mà mất kết nối → chấm vàng báo hiệu */}
        {offlineUi && <span className={styles.avatarDot} aria-hidden="true" />}
      </div>
    )
  }

  const sizeVars = {
    '--mascot-h': `${MASCOT_HEIGHT}px`,
    '--mascot-w': `${MASCOT_WIDTH}px`,
    '--wave-count': waveCount || 1,
    ...elevatedStyle,
  } as CSSProperties

  return (
    <div
      ref={rootRef}
      className={[
        styles.root,
        supported ? '' : styles.dim,
        dragApi.dragging ? styles.dragging : '',
        dragApi.landed ? styles.landed : '',
      ].filter(Boolean).join(' ')}
      // hướng mở panel / bubble theo vị trí mascot (màn hẹp: bỏ, dùng bố cục CSS cho màn hẹp)
      data-side={dragApi.offset ? dragApi.layout.side : undefined}
      data-vert={dragApi.offset ? dragApi.layout.vert : undefined}
      style={sizeVars}
    >
      {!open && bubble && (
        <MascotSpeechBubble
          key={bubble.id}
          bubble={bubble}
          texts={texts}
          name={name}
          onOpen={openFromBubble}
          onLink={followBubbleLink}
          onDismiss={speech.dismiss}
          onMute={speech.mute}
        />
      )}

      {open && (
        <Suspense fallback={null}>
        <MascotChatPanel
          id={PANEL_ID}
          initialDraft={prefill}
          greeting={greeting}
          screen={screen}
          items={items}
          pending={pending}
          mood={mood}
          suggestions={visibleSuggestions ?? []}
          suggestionSkeletons={suggestionSkeletons}
          viewingMonth={viewingMonth}
          monthControl={monthControl}
          onSend={send}
          onCancel={cancelPending}
          onRetry={retryError}
          onNewConversation={startNewConversation}
          onClose={() => setOpen(false)}
          collapsed={chatCollapsed}
          onCollapse={collapseChat}
        />
        </Suspense>
      )}

      {/* Khung chat đang thu nhỏ: bong bóng nhỏ trên đầu mascot – trạng thái + xem trước tin cuối, bấm để mở lại */}
      {open && chatCollapsed && (
        <MascotChatResume
          name={name}
          pending={pending}
          offline={offlineUi}
          hasNewReply={hasNewReply}
          count={items.filter((item) => item.kind === 'user').length}
          preview={lastItem && (lastItem.kind === 'user' || lastItem.kind === 'assistant') ? lastItem.text : undefined}
          previewFromUser={lastItem?.kind === 'user'}
          onRestore={() => setChatCollapsed(false)}
          onClose={() => setOpen(false)}
        />
      )}

      <button
        type="button"
        className={styles.minimize}
        aria-label={t.mascot.minimize}
        title={t.mascot.minimize}
        onClick={() => toggleMinimized(true)}
      >
        <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path d="M2.5 6 H9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {/* đã kéo đi chỗ khác → nút đưa về góc (hiện khi hover, cạnh nút thu nhỏ) */}
      {dragApi.moved && (
        <button
          type="button"
          className={`${styles.minimize} ${styles.resetPosition}`}
          aria-label={texts.resetPosition}
          title={texts.resetPosition}
          onClick={dragApi.reset}
        >
          <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
            <path
              d="M3 9 L9 3 M9 3 H5 M9 3 V7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="rotate(90 6 6)"
            />
          </svg>
        </button>
      )}

      {/* Mất kết nối → nút tròn trên đầu mascot: bấm để kết nối lại (không cần mở panel) */}
      {offlineUi && (
        <button
          type="button"
          className={`${styles.reconnect} ${reconnecting ? styles.reconnecting : ''}`}
          aria-label={t.mascot.reconnect(name)}
          title={t.mascot.reconnect(name)}
          aria-busy={reconnecting}
          onClick={retry}
        >
          <CloudOffRoundedIcon className={styles.reconnectIdle} />
          <RefreshRoundedIcon className={styles.reconnectAction} />
        </button>
      )}

      <button
        ref={bodyRef}
        type="button"
        className={styles.body}
        aria-label={open ? t.mascot.chat.close : t.mascot.chat.open(name)}
        aria-expanded={open}
        aria-controls={open ? PANEL_ID : undefined}
        title={texts.dragHint(name)}
        {...dragApi.handlers}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setWarm(true)}
        onClick={handleClick}
        onAnimationEnd={handleAnimationEnd}
      >
        <SpinningMascotSvg spin={spin} waving={waveCount > 0} mood={mood} blink={blink} followCursor className={styles.svg} />
      </button>

      {/* Bàn xoay dưới chân: kéo ngang để xoay 360°, bấm để xoay 1 vòng, ← → xoay từng nấc */}
      <MascotTurntable spin={spin} label={texts.rotate} />
    </div>
  )
}

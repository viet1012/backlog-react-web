import { useEffect, useRef, useState } from 'react'
import type { AnimationEvent, CSSProperties } from 'react'
import { useLocation } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'
import { AssistantApiError, normalizeMonth, postAssistantChat } from '../../services/assistantService'
import type { AssistantChatTurn } from '../../services/assistantService'
import { loadPreference, savePreference } from '../../utils/uiPreferences'
import { MascotChatPanel } from './MascotChatPanel'
import type { ChatItem } from './MascotChatPanel'
import { useMascotContext, useMascotName } from './mascotContext'
import { getMascotScreen } from './mascotMessages'
import { MASCOT_VIEWBOX, MascotSvg } from './MascotSvg'
import { FOLLOW_UP_COUNT, INITIAL_COUNT, useMascotSuggestions } from './useMascotSuggestions'
import styles from './Mascot.module.css'

/** Chiều cao mascot (px) – chiều rộng tính theo tỉ lệ viewBox 160:200 */
const MASCOT_HEIGHT = 140
const MASCOT_WIDTH = Math.round((MASCOT_HEIGHT * MASCOT_VIEWBOX.width) / MASCOT_VIEWBOX.height)

const HOVER_WAVES = 2
const CLICK_WAVES = 3
const HISTORY_SIZE = 6
const MINIMIZED_KEY = 'mascot:minimized'
const PANEL_ID = 'mascot-chat-panel'

type ChatItemInput =
  | Omit<Extract<ChatItem, { kind: 'user' }>, 'id'>
  | Omit<Extract<ChatItem, { kind: 'assistant' }>, 'id'>
  | Omit<Extract<ChatItem, { kind: 'error' }>, 'id'>
  | Omit<Extract<ChatItem, { kind: 'divider' }>, 'id'>

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export function Mascot() {
  const { t, language } = useI18n()
  const { pathname } = useLocation()
  const { params, monthControl, openChatSeq, elevated, status, retry, reportStatus } = useMascotContext()
  const offline = status === 'offline'
  const name = useMascotName()
  // tháng đang xem trên màn hình, dạng "YYYY.MM"
  const viewingMonth = normalizeMonth(params.month)
  const screen = getMascotScreen(pathname, t)

  const [minimized, setMinimized] = useState(() => loadPreference(MINIMIZED_KEY) === true)
  const [waveCount, setWaveCount] = useState(0) // 0 = không vẫy
  const [open, setOpen] = useState(false)
  // hover / focus vào mascot → tải trước gợi ý, mở panel là có ngay câu chào + gợi ý từ API
  const [warm, setWarm] = useState(false)
  const suggestions = useMascotSuggestions({
    active: (open || warm) && !minimized,
    screenKey: screen.screenKey,
    params,
    lang: language,
    staticSuggestions: screen.suggestions,
  })
  const [greetIdx, setGreetIdx] = useState(0)

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
    if (!open) setWarm(false)
  }

  // Trang yêu cầu mở chat (vd nút "Hỏi … về khung này") → bỏ thu nhỏ + mở panel
  const [prevOpenChatSeq, setPrevOpenChatSeq] = useState(openChatSeq)
  if (openChatSeq !== prevOpenChatSeq) {
    setPrevOpenChatSeq(openChatSeq)
    if (minimized) {
      setMinimized(false)
      savePreference(MINIMIZED_KEY, false)
    }
    setOpen(true)
  }

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
  }

  function handleClick() {
    if (!open) {
      startWave(CLICK_WAVES)
      setGreetIdx((i) => i + 1)
      // mở panel lúc đang offline → kiểm tra lại kết nối ngay
      if (offline) retry()
    }
    setOpen(!open)
  }

  function handleAnimationEnd(event: AnimationEvent) {
    // tên keyframes bị CSS module băm → so theo chuỗi con
    if (event.animationName.includes('wave')) setWaveCount(0)
  }

  function toggleMinimized(next: boolean) {
    setMinimized(next)
    savePreference(MINIMIZED_KEY, next)
    setOpen(false)
    setWaveCount(0)
  }

  async function send(question: string) {
    const screenKey = screen.screenKey
    if (!screenKey || pending || !question) return

    const history: AssistantChatTurn[] = items
      .filter((item): item is Extract<ChatItem, { kind: 'user' | 'assistant' }> =>
        item.kind === 'user' || item.kind === 'assistant')
      .slice(-HISTORY_SIZE)
      .map((item) => ({ role: item.kind, content: item.text }))

    appendItem(screenKey, { kind: 'user', text: question })
    suggestions.recordAsked(question)
    setScreenPending(screenKey, true)

    // chuyển màn khi đang chờ → câu trả lời vẫn ghi vào lịch sử của màn đã hỏi
    const controller = new AbortController()
    abortRef.current[screenKey] = controller

    try {
      const { answer, sources, answeredMonth } = await postAssistantChat(
        { screenKey, params, question, history },
        controller.signal,
      )
      const answerId = appendItem(screenKey, { kind: 'assistant', text: answer, sources, answeredMonth })
      suggestions.requestFollowUp(answerId, screenKey)
      reportStatus('online')
    } catch (error) {
      if (controller.signal.aborted) return
      // không gọi được server → chuyển offline (lỗi HTTP / timeout: server vẫn sống)
      if (error instanceof AssistantApiError && error.detail.kind === 'network') reportStatus('offline')
      appendItem(screenKey, error instanceof AssistantApiError
        ? { kind: 'error', code: error.code, detail: error.detail }
        : { kind: 'error', code: 'INTERNAL' })
    } finally {
      if (!controller.signal.aborted) {
        setScreenPending(screenKey, false)
        delete abortRef.current[screenKey]
      }
    }
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
    : screen.lines[greetIdx % screen.lines.length]

  // nổi trên Drawer (1200) / Modal (1300) của MUI khi trang bật elevated
  const elevatedStyle: CSSProperties | undefined = elevated ? { zIndex: 1350 } : undefined

  if (minimized) {
    return (
      <div className={styles.root} style={elevatedStyle}>
        <button
          type="button"
          className={styles.avatar}
          aria-label={t.mascot.expand}
          title={t.mascot.expand}
          onClick={() => toggleMinimized(false)}
        >
          <MascotSvg waving={false} headOnly className={styles.avatarSvg} />
        </button>
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
    <div className={styles.root} style={sizeVars}>
      {open && (
        <MascotChatPanel
          id={PANEL_ID}
          greeting={greeting}
          screen={screen}
          items={items}
          pending={pending}
          suggestions={visibleSuggestions ?? []}
          suggestionSkeletons={suggestionSkeletons}
          viewingMonth={viewingMonth}
          monthControl={monthControl}
          onSend={send}
          onNewConversation={startNewConversation}
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

      <button
        ref={bodyRef}
        type="button"
        className={styles.body}
        aria-label={open ? t.mascot.chat.close : t.mascot.chat.open(name)}
        aria-expanded={open}
        aria-controls={open ? PANEL_ID : undefined}
        onMouseEnter={handleMouseEnter}
        onFocus={() => setWarm(true)}
        onClick={handleClick}
        onAnimationEnd={handleAnimationEnd}
      >
        <MascotSvg waving={waveCount > 0} className={styles.svg} />
      </button>
    </div>
  )
}

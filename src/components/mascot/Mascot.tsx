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
import { useMascotSuggestions } from './useMascotSuggestions'
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
  const { params, monthControl, openChatSeq, elevated } = useMascotContext()
  const name = useMascotName()
  // tháng đang xem trên màn hình, dạng "YYYY.MM"
  const viewingMonth = normalizeMonth(params.month)
  const screen = getMascotScreen(pathname, t)

  const [minimized, setMinimized] = useState(() => loadPreference(MINIMIZED_KEY) === true)
  const [waveCount, setWaveCount] = useState(0) // 0 = không vẫy
  const [open, setOpen] = useState(false)
  const suggestions = useMascotSuggestions({
    active: open && !minimized,
    screenKey: screen.screenKey,
    params,
    lang: language,
    staticSuggestions: screen.suggestions,
  })
  const [greetIdx, setGreetIdx] = useState(0)

  // Lịch sử chat sống cùng Mascot (ở layout) → giữ khi chuyển trang, mất khi reload
  const [items, setItems] = useState<ChatItem[]>([])
  const [pending, setPending] = useState(false)
  const nextId = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const restartFrame = useRef<number | undefined>(undefined)
  const bodyRef = useRef<HTMLButtonElement>(null)

  // Đổi screenKey → thêm dòng "Đang xem: …" (thay dòng phân cách cuối nếu chưa hỏi gì)
  const [prevScreenKey, setPrevScreenKey] = useState(screen.screenKey)
  if (screen.screenKey !== prevScreenKey) {
    setPrevScreenKey(screen.screenKey)
    const screenId = screen.screenId
    if (screenId) {
      setItems((prev) => {
        const base = prev.at(-1)?.kind === 'divider' ? prev.slice(0, -1) : prev
        return base.length > 0
          ? [...base, { id: nextId.current++, kind: 'divider', screenId }]
          : base
      })
    }
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
    abortRef.current?.abort()
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

  function appendItem(item: ChatItemInput): number {
    const id = nextId.current++
    setItems((prev) => [...prev, { ...item, id } as ChatItem])
    return id
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
  }

  function handleClick() {
    if (!open) {
      startWave(CLICK_WAVES)
      setGreetIdx((i) => i + 1)
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

    appendItem({ kind: 'user', text: question })
    suggestions.recordAsked(question)
    setPending(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const { answer, sources, answeredMonth } = await postAssistantChat(
        { screenKey, params, question, history },
        controller.signal,
      )
      const answerId = appendItem({ kind: 'assistant', text: answer, sources, answeredMonth })
      suggestions.requestFollowUp(answerId, screenKey)
    } catch (error) {
      if (controller.signal.aborted) return
      appendItem(error instanceof AssistantApiError
        ? { kind: 'error', code: error.code, detail: error.detail }
        : { kind: 'error', code: 'INTERNAL' })
    } finally {
      if (!controller.signal.aborted) setPending(false)
    }
  }

  function startNewConversation() {
    // hủy câu đang chờ (send() bỏ qua kết quả khi đã abort)
    abortRef.current?.abort()
    abortRef.current = null
    setPending(false)
    setItems([])
    suggestions.newConversation()
  }

  // Gợi ý: chưa hỏi gì ở màn này → bộ 4 câu; ngay sau câu trả lời → 2 câu follow-up
  const last = items.at(-1)
  const visibleSuggestions = !last || last.kind === 'divider'
    ? suggestions.initial
    : last.kind === 'assistant'
      ? suggestions.followUpFor(last.id)
      : null

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
          greeting={
            // màn có chat: câu chào từ API suggestions; đang tải / lỗi → câu trung tính
            screen.screenKey
              ? suggestions.greeting ?? screen.greeting ?? screen.lines[0]
              : screen.lines[greetIdx % screen.lines.length]
          }
          screen={screen}
          items={items}
          pending={pending}
          suggestions={visibleSuggestions ?? []}
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
        onClick={handleClick}
        onAnimationEnd={handleAnimationEnd}
      >
        <MascotSvg waving={waveCount > 0} className={styles.svg} />
      </button>
    </div>
  )
}

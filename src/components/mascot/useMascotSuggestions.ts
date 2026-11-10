import { useEffect, useMemo, useRef, useState } from 'react'
import { getAssistantSuggestions, normalizeQuestion } from '../../services/assistantService'
import type { AssistantParams, AssistantSuggestion } from '../../services/assistantService'

export const INITIAL_COUNT = 4
export const FOLLOW_UP_COUNT = 2

/** 'fallback' → API lỗi, dùng gợi ý tĩnh trong i18n */
type Loaded = AssistantSuggestion[] | 'fallback'

interface Options {
  /** panel đang mở */
  active: boolean
  screenKey?: string
  params: AssistantParams
  lang: string
  /** gợi ý tĩnh (i18n) dùng khi API lỗi */
  staticSuggestions: string[]
}

/**
 * Gợi ý câu hỏi cho chat mascot:
 * - initial (4): gọi khi mở panel và mỗi lần đổi params (tháng/tuần PL) / ngôn ngữ / cuộc trò chuyện mới
 * - follow-up (2): gọi sau mỗi câu trả lời
 * Câu đã hỏi trong phiên (tới khi reload) luôn bị loại – gửi lên API và lọc lại ở client.
 */
export function useMascotSuggestions({ active, screenKey, params, lang, staticSuggestions }: Options) {
  const [asked, setAsked] = useState<string[]>([])
  // bản sao cho effect / callback async, không làm effect gọi lại khi hỏi thêm câu
  const askedRef = useRef<string[]>([])
  const [refreshToken, setRefreshToken] = useState(0)
  const [initialState, setInitialState] = useState<{ key: string; list: Loaded; greeting?: string } | null>(null)
  // list 'loading' → đang gọi follow-up cho câu trả lời afterId
  const [followUp, setFollowUp] = useState<{ afterId: number; list: Loaded | 'loading' } | null>(null)
  const followUpAbort = useRef<AbortController | null>(null)

  const paramsKey = JSON.stringify(params)
  const initialKey = `${screenKey ?? ''}|${paramsKey}|${lang}|${refreshToken}`

  useEffect(() => {
    if (!active || !screenKey) return
    const controller = new AbortController()
    getAssistantSuggestions(
      {
        screenKey,
        params: JSON.parse(paramsKey) as AssistantParams,
        lang,
        count: INITIAL_COUNT,
        exclude: askedRef.current,
      },
      controller.signal,
    )
      .then(({ greeting, suggestions }) => setInitialState({ key: initialKey, list: suggestions, greeting }))
      .catch(() => {
        if (!controller.signal.aborted) setInitialState({ key: initialKey, list: 'fallback' })
      })
    return () => controller.abort()
  }, [active, screenKey, paramsKey, lang, initialKey])

  useEffect(() => () => followUpAbort.current?.abort(), [])

  const askedSet = useMemo(() => new Set(asked.map(normalizeQuestion)), [asked])

  function resolve(list: Loaded, count: number): AssistantSuggestion[] {
    const source = list === 'fallback'
      ? staticSuggestions.map((text): AssistantSuggestion => ({ text, kind: 'static' }))
      : list
    return source.filter((item) => !askedSet.has(normalizeQuestion(item.text))).slice(0, count)
  }

  /** null = đang tải (hoặc chưa đúng params hiện tại) */
  const initial = initialState?.key === initialKey
    ? resolve(initialState.list, INITIAL_COUNT)
    : null

  /** đang tải bộ initial cho params hiện tại (dùng để hiện skeleton thay vì nội dung tĩnh rồi nhảy) */
  const initialLoading = Boolean(screenKey) && initial === null

  /** câu chào từ API (lần gọi initial khớp params hiện tại); undefined = đang tải / lỗi / API không trả */
  const greeting = initialState?.key === initialKey ? initialState.greeting : undefined

  function followUpFor(afterId: number): AssistantSuggestion[] | null {
    return followUp?.afterId === afterId && followUp.list !== 'loading'
      ? resolve(followUp.list, FOLLOW_UP_COUNT)
      : null
  }

  function isFollowUpLoading(afterId: number) {
    return followUp?.afterId === afterId && followUp.list === 'loading'
  }

  function recordAsked(question: string) {
    const next = [...askedRef.current, question]
    askedRef.current = next
    setAsked(next)
  }

  /** gọi sau khi thêm câu trả lời có id = afterId */
  function requestFollowUp(afterId: number, forScreenKey: string) {
    followUpAbort.current?.abort()
    const controller = new AbortController()
    followUpAbort.current = controller
    setFollowUp({ afterId, list: 'loading' })

    getAssistantSuggestions(
      {
        screenKey: forScreenKey,
        params,
        lang,
        count: FOLLOW_UP_COUNT,
        exclude: askedRef.current,
      },
      controller.signal,
    )
      .then(({ suggestions }) => setFollowUp({ afterId, list: suggestions }))
      .catch(() => {
        if (!controller.signal.aborted) setFollowUp({ afterId, list: 'fallback' })
      })
  }

  /** cuộc trò chuyện mới → bỏ gợi ý follow-up, lấy bộ 4 gợi ý mới */
  function newConversation() {
    followUpAbort.current?.abort()
    followUpAbort.current = null
    setFollowUp(null)
    setRefreshToken((value) => value + 1)
  }

  return {
    initial,
    initialLoading,
    greeting,
    followUpFor,
    isFollowUpLoading,
    recordAsked,
    requestFollowUp,
    newConversation,
  }
}

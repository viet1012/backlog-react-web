import { useCallback, useEffect, useRef, useState } from 'react'
import type { MascotMood } from '../components/mascot'
import { pdf2cadApi } from '../services/pdf2cadService'
import type { DxfPreview, Pdf2cadLearnResult, Pdf2cadTemplate } from '../types/pdf2cad'
import type { Language } from '../utils/uiPreferences'

export type Pdf2cadChatMessage =
  | { id: number; who: 'me'; text: string }
  | {
      id: number
      who: 'bot'
      vi: string
      en: string
      output?: string | null
      job?: string | null
      /** lỗi (chữ server) thay cho nội dung */
      error?: string
    }

export interface Pdf2cadBotPreview {
  job: string
  output: string
  preview: DxfPreview | null
  loading: boolean
  error: string | null
}

const TEMPLATE_KEY = 'pdf2cad:template'
const HAPPY_MS = 2500

function loadSavedTemplate() {
  try {
    return sessionStorage.getItem(TEMPLATE_KEY)
  } catch {
    return null
  }
}

function saveTemplate(name: string) {
  try {
    sessionStorage.setItem(TEMPLATE_KEY, name)
  } catch {
    // private mode – bỏ qua
  }
}

/**
 * Trợ lý vẽ lại (bot của pdf2cad): danh sách mẫu, hội thoại theo mẫu (server giữ ngữ cảnh qua
 * session), bản vẽ vừa tạo để xem trước. Câu gửi lúc bot đang trả lời được xếp hàng, không mất.
 */
export function usePdf2cadBot(language: Language) {
  const [templates, setTemplates] = useState<Pdf2cadTemplate[] | null>(null)
  const [templatesError, setTemplatesError] = useState<string | null>(null)
  const [template, setTemplate] = useState('')
  const [messages, setMessages] = useState<Pdf2cadChatMessage[]>([])
  const [chips, setChips] = useState<{ vi: string[]; en: string[] }>({ vi: [], en: [] })
  const [busy, setBusy] = useState(false)
  const [engine, setEngine] = useState<string | null>(null)
  const [preview, setPreview] = useState<Pdf2cadBotPreview | null>(null)
  const [celebrate, setCelebrate] = useState(false)

  const started = useRef(false)
  const templateRef = useRef('')
  const sessionRef = useRef<string | null>(null)
  const queueRef = useRef<Promise<void>>(Promise.resolve())
  const generation = useRef(0)
  const nextId = useRef(1)
  const languageRef = useRef(language)

  useEffect(() => {
    languageRef.current = language
  }, [language])

  useEffect(() => {
    if (!celebrate) return
    const timer = window.setTimeout(() => setCelebrate(false), HAPPY_MS)
    return () => window.clearTimeout(timer)
  }, [celebrate])

  const loadPreview = useCallback(async (job: string, output: string) => {
    setPreview({ job, output, preview: null, loading: true, error: null })
    try {
      const data = await pdf2cadApi.preview(job, output)
      setPreview((prev) => (prev?.job === job && prev.output === output ? { ...prev, preview: data, loading: false } : prev))
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setPreview((prev) => (prev?.job === job && prev.output === output ? { ...prev, loading: false, error: message } : prev))
    }
  }, [])

  const sendNow = useCallback(async (text: string, gen: number) => {
    if (gen !== generation.current || !templateRef.current) return
    setBusy(true)
    setChips({ vi: [], en: [] })
    try {
      const reply = await pdf2cadApi.bot({
        template: templateRef.current,
        session: sessionRef.current,
        message: text,
        lang: languageRef.current,
      })
      if (gen !== generation.current) return
      sessionRef.current = reply.session
      if (text && reply.engine) setEngine(reply.engine.startsWith('llm:') ? reply.engine.slice(4) : '')
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, who: 'bot', vi: reply.text, en: reply.text_en ?? reply.text, output: reply.output, job: reply.job },
      ])
      setChips({ vi: reply.chips ?? [], en: reply.chips_en ?? reply.chips ?? [] })
      if (reply.output && reply.job) {
        setCelebrate(true)
        loadPreview(reply.job, reply.output)
      }
    } catch (e) {
      if (gen !== generation.current) return
      const message = e instanceof Error ? e.message : String(e)
      setMessages((prev) => [...prev, { id: nextId.current++, who: 'bot', vi: '', en: '', error: message }])
    } finally {
      if (gen === generation.current) setBusy(false)
    }
  }, [loadPreview])

  const send = useCallback((text: string) => {
    const gen = generation.current
    queueRef.current = queueRef.current.then(() => {
      if (text && gen === generation.current) {
        setMessages((prev) => [...prev, { id: nextId.current++, who: 'me', text }])
      }
      return sendNow(text, gen)
    })
  }, [sendNow])

  /** đổi mẫu / bắt đầu lại: xoá hội thoại + session; greet → bot chào */
  const selectTemplate = useCallback((name: string, greet = true) => {
    generation.current++
    queueRef.current = Promise.resolve()
    templateRef.current = name
    sessionRef.current = null
    setTemplate(name)
    saveTemplate(name)
    setMessages([])
    setChips({ vi: [], en: [] })
    setBusy(false)
    if (greet) send('')
  }, [send])

  const refreshTemplates = useCallback(async () => {
    try {
      const list = await pdf2cadApi.templates()
      setTemplates(list)
      setTemplatesError(null)
      return list
    } catch (e) {
      setTemplatesError(e instanceof Error ? e.message : String(e))
      setTemplates((prev) => prev ?? [])
      return null
    }
  }, [])

  /** gọi khi mở tab Vẽ lại lần đầu: tải mẫu + lời chào (chỉ 1 lần) */
  const start = useCallback(async () => {
    if (started.current) return
    started.current = true
    const list = await refreshTemplates()
    if (!list?.length || templateRef.current) return
    const saved = loadSavedTemplate()
    selectTemplate(list.some((t) => t.name === saved) ? saved! : list[0].name)
  }, [refreshTemplates, selectTemplate])

  /** vừa "Dạy bot" xong: chọn mẫu mới + báo bằng tin nhắn của bot */
  const announceLearned = useCallback(async (result: Pdf2cadLearnResult, texts: { vi: string; en: string }) => {
    started.current = true
    await refreshTemplates()
    const first = result.templates[0]
    if (!first) return
    selectTemplate(first.name, false)
    setMessages([{ id: nextId.current++, who: 'bot', vi: texts.vi, en: texts.en }])
    setChips({
      vi: ['Có những size nào?', 'D là gì?'],
      en: ['What sizes are available?', 'What is D?'],
    })
  }, [refreshTemplates, selectTemplate])

  const lastBot = [...messages].reverse().find((m) => m.who === 'bot')
  const mood: MascotMood = busy
    ? 'thinking'
    : lastBot?.who === 'bot' && lastBot.error
      ? 'sad'
      : celebrate
        ? 'happy'
        : messages.length <= 1
          ? 'greeting'
          : 'idle'

  return {
    templates,
    templatesError,
    template,
    messages,
    chips: chips[language],
    busy,
    engine,
    preview,
    mood,
    start,
    send,
    selectTemplate,
    restart: () => selectTemplate(templateRef.current),
    view: loadPreview,
    announceLearned,
  }
}

export type Pdf2cadBot = ReturnType<typeof usePdf2cadBot>

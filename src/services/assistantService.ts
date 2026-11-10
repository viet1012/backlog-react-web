import { API_BASE_URL } from '../config/api'
import { getCurrentEmployeeId } from './authService'

/**
 * Header chung cho mọi request /api/assistant/*: kèm X-Employee-Id (MSNV user đang đăng nhập,
 * cùng nguồn session với LogoutConfirmDialog). Chưa đăng nhập / không có MSNV → không gửi header.
 * Đọc lúc gửi (không cache) để đúng user sau khi đăng nhập lại.
 */
function assistantHeaders(headers: Record<string, string>): Record<string, string> {
  const employeeId = getCurrentEmployeeId()
  return employeeId ? { ...headers, 'X-Employee-Id': employeeId } : headers
}

// =========================================================
// ASSISTANT CHAT – API backlog-be (/api/assistant/chat)
// =========================================================

const CHAT_URL =
  `${API_BASE_URL.replace(/\/$/, '')}/api/assistant/chat`

/** Hết thời gian chờ → LLM_ERROR */
export const ASSISTANT_TIMEOUT_MS = 190_000

export const ASSISTANT_ERROR_CODES = [
  'LLM_BUSY',
  'LLM_ERROR',
  'LLM_TRUNCATED',
  'LLM_EMPTY',
  'RATE_LIMITED',
  'BAD_REQUEST',
  'INTERNAL',
] as const

export type AssistantErrorCode = typeof ASSISTANT_ERROR_CODES[number]

export type AssistantParamValue = string | number | boolean | null | undefined

export type AssistantParams = Record<string, AssistantParamValue>

/** Tool backend đã gọi để trả lời (vd phân tích chênh lệch cho MOLD / RM) */
export interface AssistantSource {
  tool: string
  div?: string
  cost?: string
  /** tháng tool đã tra, dạng "YYYY.MM" */
  month?: string
}

export interface AssistantChatResponse {
  answer: string
  /** rỗng → trả lời chỉ từ dữ liệu màn hình (params) */
  sources: AssistantSource[]
  /** tháng câu trả lời nói tới, dạng "YYYY.MM"; undefined khi backend không trả */
  answeredMonth?: string
}

/** "2026-10" / "2026.10" / "202610" / "2026-10-01" → "2026.10"; không nhận ra → undefined */
export function normalizeMonth(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const match = /^\s*(\d{4})[-./]?(\d{1,2})(?:[-./]\d{1,2})?\s*$/.exec(value)
  if (!match) return undefined
  const month = Number(match[2])
  if (month < 1 || month > 12) return undefined
  return `${match[1]}.${String(month).padStart(2, '0')}`
}

export interface AssistantChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface AssistantChatRequest {
  screenKey: string
  params: AssistantParams
  question: string
  history: AssistantChatTurn[]
}

/** http: server trả lỗi · network: không gọi được · timeout: quá ASSISTANT_TIMEOUT_MS */
export type AssistantErrorKind = 'http' | 'network' | 'timeout'

export interface AssistantErrorDetail {
  kind: AssistantErrorKind
  status?: number
  /** code thô từ body (có thể không thuộc ASSISTANT_ERROR_CODES) */
  rawCode?: string
  message?: string
  /** header Retry-After (giây) khi 429; undefined nếu BE không gửi / CORS không expose */
  retryAfterSec?: number
}

export class AssistantApiError extends Error {
  readonly code: AssistantErrorCode
  readonly detail: AssistantErrorDetail

  constructor(code: AssistantErrorCode, detail: AssistantErrorDetail) {
    super(`Assistant API error: ${code}${detail.status ? ` (${detail.status})` : ''}`)
    this.name = 'AssistantApiError'
    this.code = code
    this.detail = detail
  }
}

function isErrorCode(value: unknown): value is AssistantErrorCode {
  return typeof value === 'string'
    && (ASSISTANT_ERROR_CODES as readonly string[]).includes(value)
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null
    ? value as Record<string, unknown>
    : undefined
}

// Backend không trả code hợp lệ → suy ra từ HTTP status
function codeFromStatus(status: number): AssistantErrorCode {
  if (status === 400 || status === 413 || status === 422) return 'BAD_REQUEST'
  if (status === 429) return 'RATE_LIMITED'
  if (status === 503) return 'LLM_BUSY'
  if (status === 502 || status === 504) return 'LLM_ERROR'
  return 'INTERNAL'
}

// Body lỗi: { status, message, code }
function readError(data: unknown, httpStatus: number, headers?: Headers): AssistantApiError {
  const body = asRecord(data)
  const rawCode = typeof body?.code === 'string' ? body.code : undefined
  const message = typeof body?.message === 'string' ? body.message : undefined
  const status = typeof body?.status === 'number' ? body.status : httpStatus
  const retryAfter = Number(headers?.get('Retry-After'))
  const retryAfterSec = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined

  return new AssistantApiError(
    isErrorCode(rawCode) ? rawCode : codeFromStatus(httpStatus),
    { kind: 'http', status, rawCode, message, retryAfterSec },
  )
}

// Bỏ param null/undefined trước khi gửi
function compactParams(params: AssistantParams): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(params).filter(
      (entry): entry is [string, string | number | boolean] => entry[1] !== null && entry[1] !== undefined,
    ),
  )
}

function readString(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim() !== '') return value.trim()
  }
  return undefined
}

/**
 * sources: [{ tool, div?, cost? }] – chấp nhận vài tên field thường gặp
 * (name/key, DIV, costType/cost_type) và cả phần tử là chuỗi (tên tool). Bỏ trùng.
 */
function readSources(value: unknown): AssistantSource[] {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()
  const sources: AssistantSource[] = []

  for (const raw of value) {
    const record = typeof raw === 'string' ? { tool: raw } : asRecord(raw)
    if (!record) continue

    const tool = readString(record, 'tool', 'name', 'key')
    if (!tool) continue
    const source: AssistantSource = {
      tool,
      div: readString(record, 'div', 'DIV'),
      cost: readString(record, 'cost', 'COST', 'costType', 'cost_type'),
      month: normalizeMonth(readString(record, 'month')),
    }

    const id = `${source.tool}|${source.div ?? ''}|${source.cost ?? ''}|${source.month ?? ''}`
    if (seen.has(id)) continue
    seen.add(id)
    sources.push(source)
  }

  return sources
}

// =========================================================
// GỢI Ý CÂU HỎI – GET /api/assistant/suggestions
// =========================================================

const SUGGESTIONS_URL =
  `${API_BASE_URL.replace(/\/$/, '')}/api/assistant/suggestions`

const SUGGESTIONS_TIMEOUT_MS = 15_000
/** Giới hạn tổng độ dài (đã encode) của các tham số exclude để URL không quá dài */
const EXCLUDE_QUERY_BUDGET = 2_000

/** static: câu gợi ý cố định · dynamic: sinh theo dữ liệu tháng/tuần hiện tại */
export type AssistantSuggestionKind = 'static' | 'dynamic'

export interface AssistantSuggestion {
  text: string
  kind: AssistantSuggestionKind
}

export interface AssistantSuggestionsRequest {
  screenKey: string
  /** context màn hình (month, simuWeek…) – null/undefined bị bỏ */
  params: AssistantParams
  lang: string
  count: number
  /** câu đã hỏi trong phiên – lấy từ mới nhất về cũ, cắt theo EXCLUDE_QUERY_BUDGET */
  exclude?: string[]
}

export function normalizeQuestion(text: string) {
  return text.trim().replace(/\s+/g, ' ').toLowerCase()
}

export interface AssistantSuggestionsResponse {
  /** câu chào theo dữ liệu màn hình; undefined khi backend không trả */
  greeting?: string
  suggestions: AssistantSuggestion[]
}

/** [{ text, kind }] hoặc { greeting?, suggestions: [...] }; phần tử là chuỗi → static. Bỏ trùng. */
function readSuggestions(data: unknown): AssistantSuggestionsResponse {
  const body = asRecord(data)
  const list = Array.isArray(data) ? data : body?.suggestions
  if (!Array.isArray(list)) throw new Error('Invalid suggestions response')

  const seen = new Set<string>()
  const suggestions: AssistantSuggestion[] = []
  for (const raw of list) {
    const record = typeof raw === 'string' ? { text: raw } : asRecord(raw)
    if (!record) continue
    const text = readString(record, 'text', 'question', 'label')
    if (!text) continue
    const id = normalizeQuestion(text)
    if (seen.has(id)) continue
    seen.add(id)
    suggestions.push({ text, kind: record.kind === 'dynamic' ? 'dynamic' : 'static' })
  }
  const greeting = !Array.isArray(data) && body ? readString(body, 'greeting') : undefined
  return { greeting, suggestions }
}

/** Lỗi (mạng, HTTP, timeout, body sai) → ném Error; nơi gọi tự fallback về gợi ý tĩnh. */
export async function getAssistantSuggestions(
  request: AssistantSuggestionsRequest,
  signal?: AbortSignal,
): Promise<AssistantSuggestionsResponse> {
  const query = new URLSearchParams({ screenKey: request.screenKey })
  for (const [key, value] of Object.entries(compactParams(request.params))) {
    query.set(key, String(value))
  }
  query.set('lang', request.lang)
  query.set('count', String(request.count))

  let budget = EXCLUDE_QUERY_BUDGET
  for (const question of [...(request.exclude ?? [])].reverse()) {
    const cost = encodeURIComponent(question).length + 9 // "&exclude="
    if (cost > budget) continue
    budget -= cost
    query.append('exclude', question)
  }

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), SUGGESTIONS_TIMEOUT_MS)
  const onExternalAbort = () => controller.abort()
  signal?.addEventListener('abort', onExternalAbort)
  if (signal?.aborted) controller.abort()

  try {
    const response = await fetch(`${SUGGESTIONS_URL}?${query}`, {
      headers: assistantHeaders({ Accept: 'application/json' }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`Suggestions HTTP ${response.status}`)
    return readSuggestions(await response.json())
  } finally {
    window.clearTimeout(timer)
    signal?.removeEventListener('abort', onExternalAbort)
  }
}

// =========================================================
// THÔNG TIN TRỢ LÝ – GET /api/assistant/info
// =========================================================

const INFO_URL =
  `${API_BASE_URL.replace(/\/$/, '')}/api/assistant/config`

const INFO_TIMEOUT_MS = 10_000

export interface AssistantInfo {
  /** tên hiển thị của mascot; undefined khi backend không trả */
  name?: string
}

/** Lỗi (mạng, HTTP, timeout) → ném Error; nơi gọi tự fallback về tên mặc định. */
export async function getAssistantInfo(signal?: AbortSignal): Promise<AssistantInfo> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), INFO_TIMEOUT_MS)
  const onExternalAbort = () => controller.abort()
  signal?.addEventListener('abort', onExternalAbort)
  if (signal?.aborted) controller.abort()

  try {
    const response = await fetch(INFO_URL, {
      headers: assistantHeaders({ Accept: 'application/json' }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`Assistant info HTTP ${response.status}`)
    const body = asRecord(await response.json())
    return { name: body ? readString(body, 'name') : undefined }
  } finally {
    window.clearTimeout(timer)
    signal?.removeEventListener('abort', onExternalAbort)
  }
}

/**
 * Gửi câu hỏi, trả về câu trả lời (markdown) + các nguồn đã tra. Lỗi → AssistantApiError.
 * `signal` để hủy từ ngoài (unmount…): khi đó ném lại lỗi abort gốc, không đổi thành AssistantApiError.
 */
export async function postAssistantChat(
  request: AssistantChatRequest,
  signal?: AbortSignal,
): Promise<AssistantChatResponse> {
  const controller = new AbortController()
  let timedOut = false
  const timer = window.setTimeout(() => {
    timedOut = true
    controller.abort()
  }, ASSISTANT_TIMEOUT_MS)
  const onExternalAbort = () => controller.abort()
  signal?.addEventListener('abort', onExternalAbort)
  if (signal?.aborted) controller.abort()

  try {
    let response: Response
    try {
      response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: assistantHeaders({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
        body: JSON.stringify({ ...request, params: compactParams(request.params) }),
        signal: controller.signal,
      })
    } catch (error) {
      if (timedOut) throw new AssistantApiError('LLM_ERROR', { kind: 'timeout' })
      if (signal?.aborted) throw error
      throw new AssistantApiError('INTERNAL', { kind: 'network' })
    }

    // timeout có thể rơi vào lúc đang đọc body
    const data: unknown = await response.json().catch(() => {
      if (timedOut) throw new AssistantApiError('LLM_ERROR', { kind: 'timeout' })
      return null
    })

    if (!response.ok) throw readError(data, response.status, response.headers)

    const body = asRecord(data)
    const answer = body?.answer
    if (typeof answer !== 'string') throw readError(data, response.status)
    if (answer.trim() === '') {
      throw new AssistantApiError('LLM_EMPTY', { kind: 'http', status: response.status })
    }

    return {
      answer,
      sources: readSources(body?.sources),
      answeredMonth: normalizeMonth(body?.answeredMonth ?? body?.answered_month),
    }
  } finally {
    window.clearTimeout(timer)
    signal?.removeEventListener('abort', onExternalAbort)
  }
}

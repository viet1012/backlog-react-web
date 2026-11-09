// =========================================================
// AI LOGS – audit log trợ lý AI (/api/admin/assistant-logs)
// Khớp 1-1 BE: assistant/core/audit/admin (AssistantLogSummary, AssistantLogStats, PageResponse)
// và dòng JSONL của AssistantAuditLogger (GET /{rid}).
// =========================================================

export type AiLogSource = 'chat' | 'eval'

// BE chỉ sort được 2 field này
export type AiLogSortField = 'timestamp' | 'totalMs'

export type AiLogSortOrder = 'asc' | 'desc'

// eval ghi rid = "-" → không tra chi tiết được
export const AI_LOG_NO_RID = '-'

export interface AiLogFilters {
  // "YYYY-MM-DD", bao gồm cả 2 đầu (BE: tối đa 92 ngày)
  from: string
  to: string
  // userId – so khớp chính xác, không phân biệt hoa thường; rỗng = tất cả
  userId: string
  // chứa trong câu hỏi / câu trả lời (≤ 200 ký tự)
  q: string
  // '' = tất cả
  ok: '' | 'true' | 'false'
  source: '' | AiLogSource
  // chậm hơn N giây → gửi minMs = N × 1000; null = không lọc
  slowerThanSec: number | null
}

export interface AiLogListQuery {
  page: number
  size: number
  sort: AiLogSortField
  order: AiLogSortOrder
}

// AssistantLogSummary
export interface AiLogSummary {
  rid: string | null
  // OffsetDateTime ISO, vd "2026-11-05T10:20:30.123+07:00"
  timestamp: string
  userId: string | null
  screenKey: string | null
  // cắt 200 ký tự
  question: string | null
  ok: boolean
  errorCode: string | null
  totalMs: number | null
  llmCallCount: number
  // tổng mọi lần gọi LLM
  promptTokens: number | null
}

// PageResponse<T>
export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

// AssistantLogStats.DayStat
export interface AiLogDayStat {
  date: string
  count: number
  errorCount: number
  avgMs: number | null
}

// AssistantLogStats.UserStat
export interface AiLogUserStat {
  userId: string
  count: number
}

// AssistantLogStats
export interface AiLogStats {
  from: string
  to: string
  totalQuestions: number
  errorCount: number
  // % (1 chữ số thập phân)
  errorRate: number
  avgMs: number | null
  p50Ms: number | null
  p95Ms: number | null
  // mọi ngày trong [from, to], kể cả ngày 0 câu hỏi
  byDay: AiLogDayStat[]
  topUsers: AiLogUserStat[]
  slowest: AiLogSummary[]
}

// AssistantAuditTrace.LlmCall – finishReason = "error" khi lần gọi lỗi
export interface AiLogLlmCall {
  ms: number
  promptTokens: number | null
  completionTokens: number | null
  finishReason: string | null
}

// AssistantAuditTrace.ToolRun – prefetchTools không có round (= 0)
export interface AiLogToolRun {
  name: string
  round: number
  ms: number
  outcome: string | null
}

// 1 dòng JSONL của AssistantAuditLogger
export interface AiLogDetail {
  timestamp: string
  rid: string | null
  source: string | null
  screenKey: string | null
  lang: string | null
  userId: string | null
  params: Record<string, string> | null
  question: string | null
  answer: string | null
  ok: boolean
  errorCode: string | null
  errorMessage: string | null
  totalMs: number | null
  contextMs: number | null
  askedMonthsMs: number | null
  prefetchMs: number | null
  prefetchTools: AiLogToolRun[]
  llmCallCount: number
  llmCalls: AiLogLlmCall[]
  toolCalls: AiLogToolRun[]
  model: string | null
  reasoningEffort: string | null
}

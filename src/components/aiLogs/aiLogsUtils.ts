import dayjs from 'dayjs'
import {
  AI_LOG_NO_RID,
  type AiLogDetail,
  type AiLogFilters,
  type AiLogSummary,
} from '../../types/assistantLogs'
import { urlParam, type UrlParam, type UrlParams } from '../../hooks/useUrlFilters'

// eval ghi rid = "-" → không mở chi tiết được
export function hasDetail(row: AiLogSummary): row is AiLogSummary & { rid: string } {
  return row.rid != null && row.rid !== '' && row.rid !== AI_LOG_NO_RID
}

export const TABULAR_NUMS = { fontVariantNumeric: 'tabular-nums' } as const

// Ngưỡng tô màu thời gian phản hồi (giây)
export const SLOW_WARN_SEC = 15
export const SLOW_DANGER_SEC = 30

// BE: size ≤ 200, mặc định 50
export const AI_LOGS_PAGE_SIZES = [25, 50, 100, 200]

export const DEFAULT_RANGE_DAYS = 7
// BE (AssistantLogFilter.MAX_RANGE_DAYS): khoảng > 92 ngày → 400
export const MAX_RANGE_DAYS = 92

export type DurationLevel = 'success' | 'warning' | 'error'

export function durationLevel(ms: number | null): DurationLevel | null {
  if (ms == null) return null
  const sec = ms / 1000
  if (sec < SLOW_WARN_SEC) return 'success'
  if (sec <= SLOW_DANGER_SEC) return 'warning'
  return 'error'
}

export function formatSec(ms: number | null, digits = 1): string {
  return ms == null ? '–' : (ms / 1000).toFixed(digits)
}

export function formatInt(value: number | null): string {
  return value == null ? '–' : Math.round(value).toLocaleString('en-US')
}

// timestamp BE là OffsetDateTime ISO → hiển thị giờ máy người xem
export function formatDateTime(value: string | null): string {
  if (!value) return '–'
  const d = dayjs(value)
  return d.isValid() ? d.format('DD/MM/YYYY HH:mm:ss') : value
}

export function defaultFilters(): AiLogFilters {
  const today = dayjs()
  return {
    from: today.subtract(DEFAULT_RANGE_DAYS - 1, 'day').format('YYYY-MM-DD'),
    to: today.format('YYYY-MM-DD'),
    userId: '',
    q: '',
    ok: '',
    source: 'chat',
    slowerThanSec: null,
    screenKey: '',
  }
}

// screenKey hợp lệ để lưu/khôi phục tab con (chặn giá trị rác trong localStorage)
export function isValidScreenKey(value: unknown): value is string {
  return typeof value === 'string' && (value === '' || /^[\w.-]{1,64}$/.test(value))
}

/** Số bộ lọc khác mặc định (tab màn hình không tính – nằm ở hàng tab riêng) */
export function countAiLogFilters(value: AiLogFilters): number {
  const defaults = defaultFilters()

  return [
    value.from !== defaults.from || value.to !== defaults.to,
    value.userId.trim() !== '',
    value.q.trim() !== '',
    value.ok !== defaults.ok,
    value.source !== defaults.source,
    value.slowerThanSec != null,
  ].filter(Boolean).length
}

/** Khoảng ngày từ link: from ≤ to, ≤ MAX_RANGE_DAYS ngày (BE trả 400 nếu vượt) */
export function isValidAiLogRange(from: string, to: string): boolean {
  const days = dayjs(to).diff(dayjs(from), 'day') + 1
  return from <= to && days <= MAX_RANGE_DAYS
}

// Trang "Admin" (Trợ lý AI + Phân quyền). Đường dẫn cũ /settings/ai-logs tự chuyển sang đây (App.tsx)
export const AI_LOGS_PATH = '/settings/admin'

// "Tất cả" nguồn = '' nhưng mặc định là chat → trên URL ghi "all" để không lẫn với mặc định
const sourceParam: UrlParam<AiLogFilters['source']> = {
  key: 'source',
  parse: (raw) => (raw === 'all' ? '' : raw === 'chat' || raw === 'eval' ? raw : undefined),
  format: (value) => value || 'all',
  empty: 'chat',
}

// ?from=…&to=…[&user=…][&q=…][&ok=true|false][&source=all|eval][&slower=N][&screen=…]
export const AI_LOGS_URL_PARAMS: UrlParams<AiLogFilters> = {
  from: urlParam.date('from'),
  to: urlParam.date('to'),
  userId: urlParam.text('user'),
  q: urlParam.text('q'),
  ok: urlParam.oneOf<AiLogFilters['ok']>('ok', ['', 'true', 'false'], ''),
  source: sourceParam,
  slowerThanSec: urlParam.positiveNumber('slower'),
  screenKey: {
    key: 'screen',
    parse: (raw) => (isValidScreenKey(raw) ? raw : undefined),
    format: (value) => value,
    empty: '',
  },
}

export type StepKind = 'context' | 'askedMonths' | 'prefetch' | 'prefetchTool' | 'llm' | 'tool'

export interface TimelineStep {
  kind: StepKind
  label: string
  startMs: number
  ms: number
  // LLM lỗi (finishReason = "error") / tool outcome khác "ok"
  failed: boolean
}

export interface StepLabels {
  context: string
  askedMonths: string
  prefetch: string
  llm: (index: number) => string
  tool: (name: string) => string
}

function toolFailed(outcome: string | null) {
  return outcome != null && outcome.toLowerCase() !== 'ok'
}

// Dựng thanh thời gian theo đúng thứ tự ChatOrchestrator (chạy tuần tự):
// context → askedMonths → prefetch (tool round 0 nằm trong prefetch) → LLM #1 → tool round 1 → LLM #2 → …
// BE không ghi thời điểm bắt đầu → vị trí = cộng dồn thời lượng (bỏ qua khoảng nghỉ nhỏ giữa các bước).
export function buildTimeline(detail: AiLogDetail, labels: StepLabels) {
  const steps: TimelineStep[] = []
  let cursor = 0

  const push = (kind: StepKind, label: string, ms: number, failed = false) => {
    steps.push({ kind, label, startMs: cursor, ms, failed })
    cursor += ms
  }

  if (detail.contextMs != null) push('context', labels.context, detail.contextMs)
  if (detail.askedMonthsMs != null) push('askedMonths', labels.askedMonths, detail.askedMonthsMs)

  if (detail.prefetchMs != null || detail.prefetchTools.length > 0) {
    const prefetchStart = cursor
    const toolsMs = detail.prefetchTools.reduce((sum, t) => sum + t.ms, 0)
    const prefetchMs = Math.max(detail.prefetchMs ?? 0, toolsMs)

    push('prefetch', labels.prefetch, prefetchMs)

    // tool pre-fetch vẽ lồng trong khung prefetch
    let toolCursor = prefetchStart
    for (const tool of detail.prefetchTools) {
      steps.push({
        kind: 'prefetchTool',
        label: labels.tool(tool.name),
        startMs: toolCursor,
        ms: tool.ms,
        failed: toolFailed(tool.outcome),
      })
      toolCursor += tool.ms
    }
  }

  detail.llmCalls.forEach((call, i) => {
    push('llm', labels.llm(i + 1), call.ms, call.finishReason === 'error')

    // tool round r chạy sau LLM call thứ r
    for (const tool of detail.toolCalls.filter((t) => t.round === i + 1)) {
      push('tool', labels.tool(tool.name), tool.ms, toolFailed(tool.outcome))
    }
  })

  // tool có round vượt số LLM call (bản ghi lỗi giữa chừng)
  for (const tool of detail.toolCalls.filter((t) => t.round < 1 || t.round > detail.llmCalls.length)) {
    push('tool', labels.tool(tool.name), tool.ms, toolFailed(tool.outcome))
  }

  return {
    steps,
    totalMs: Math.max(cursor, detail.totalMs ?? 0, 1),
  }
}

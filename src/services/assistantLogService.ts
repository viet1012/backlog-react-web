import { API_BASE_URL } from '../config/api'
import { getCurrentEmployeeId } from './authService'
import type {
  AiLogDetail,
  AiLogFilters,
  AiLogListQuery,
  AiLogStats,
  AiLogSummary,
  AiLogToolRun,
  PageResponse,
} from '../types/assistantLogs'

// =========================================================
// AI LOGS – API backlog-be (/api/admin/assistant-logs), chỉ ADMIN
// BE kiểm quyền theo header X-Employee-Id (AssistantLogAdminController)
// =========================================================

const API_URL =
  `${API_BASE_URL.replace(/\/$/, '')}/api/admin/assistant-logs`

function adminHeaders(accept: string): Record<string, string> {
  const employeeId = getCurrentEmployeeId()
  return employeeId
    ? { Accept: accept, 'X-Employee-Id': employeeId }
    : { Accept: accept }
}

// Lỗi BE (AssistantLogAdminExceptionHandler): { status, message }
export class AiLogsApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'AiLogsApiError'
    this.status = status
  }
}

async function throwApiError(response: Response): Promise<never> {
  const body: unknown = await response.json().catch(() => null)
  const message =
    typeof body === 'object' && body !== null && typeof (body as { message?: unknown }).message === 'string'
      ? (body as { message: string }).message
      : null

  throw new AiLogsApiError(
    response.status,
    message ? `${message} (${response.status})` : `AI Logs API failed: ${response.status}`,
  )
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    headers: adminHeaders('application/json'),
    signal,
  })

  if (!response.ok) await throwApiError(response)

  return response.json() as Promise<T>
}

// =========================================================
// QUERY – AssistantLogFilter: from, to, userId, q, ok, source, minMs, screenKey
// screenKey: BE cũ có thể bỏ qua tham số này → trang AI Logs tự phát hiện và cảnh báo
// =========================================================

function filterParams(filters: AiLogFilters): URLSearchParams {
  const params = new URLSearchParams({
    from: filters.from,
    to: filters.to,
  })

  if (filters.userId.trim()) params.set('userId', filters.userId.trim())
  if (filters.q.trim()) params.set('q', filters.q.trim())
  if (filters.ok) params.set('ok', filters.ok)
  if (filters.source) params.set('source', filters.source)
  if (filters.screenKey) params.set('screenKey', filters.screenKey)
  if (filters.slowerThanSec != null && filters.slowerThanSec > 0) {
    params.set('minMs', String(Math.round(filters.slowerThanSec * 1000)))
  }

  return params
}

// =========================================================
// LIST – PageResponse<AssistantLogSummary>
// =========================================================

export function getAiLogs(
  filters: AiLogFilters,
  query: AiLogListQuery,
  signal?: AbortSignal,
): Promise<PageResponse<AiLogSummary>> {
  const params = filterParams(filters)
  params.set('sort', query.sort)
  params.set('order', query.order)
  params.set('page', String(query.page))
  params.set('size', String(query.size))

  return getJson(`${API_URL}?${params}`, signal)
}

// =========================================================
// STATS – AssistantLogStats
// =========================================================

export function getAiLogStats(
  filters: AiLogFilters,
  signal?: AbortSignal,
): Promise<AiLogStats> {
  return getJson(`${API_URL}/stats?${filterParams(filters)}`, signal)
}

// =========================================================
// DETAIL – dòng JSONL đầy đủ của AssistantAuditLogger
// Bản ghi cũ có thể thiếu mảng → mặc định []
// =========================================================

export async function getAiLogDetail(
  rid: string,
  signal?: AbortSignal,
): Promise<AiLogDetail> {
  const raw = await getJson<AiLogDetail>(`${API_URL}/${encodeURIComponent(rid)}`, signal)

  const prefetchTools: AiLogToolRun[] = (raw.prefetchTools ?? []).map((t) => ({ ...t, round: 0 }))

  return {
    ...raw,
    prefetchTools,
    llmCalls: raw.llmCalls ?? [],
    toolCalls: raw.toolCalls ?? [],
    llmCallCount: raw.llmCallCount ?? raw.llmCalls?.length ?? 0,
  }
}

// =========================================================
// EXPORT .xlsx – cùng bộ lọc + sort/order của bảng
// =========================================================

function fileNameFrom(disposition: string | null): string | null {
  const match = disposition ? /filename="?([^";]+)"?/i.exec(disposition) : null
  return match ? match[1].trim() : null
}

export async function exportAiLogsExcel(
  filters: AiLogFilters,
  query: Pick<AiLogListQuery, 'sort' | 'order'>,
): Promise<void> {
  const params = filterParams(filters)
  params.set('sort', query.sort)
  params.set('order', query.order)

  const response = await fetch(`${API_URL}/export?${params}`, {
    headers: adminHeaders('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json'),
  })

  if (!response.ok) await throwApiError(response)

  const blob = await response.blob()
  const fileName =
    fileNameFrom(response.headers.get('Content-Disposition'))
    ?? `assistant-logs_${filters.from}_${filters.to}.xlsx`

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

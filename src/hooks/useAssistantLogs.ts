import {
  getAiLogDetail,
  getAiLogStats,
  getAiLogs,
} from '../services/assistantLogService'
import type {
  AiLogDetail,
  AiLogFilters,
  AiLogListQuery,
  AiLogStats,
  AiLogSummary,
  PageResponse,
} from '../types/assistantLogs'
import { useCachedQuery } from './useCachedQuery'

// Cache theo bộ lọc (useCachedQuery): đổi tab màn hình / trang rồi quay lại => hiện ngay,
// tải lại ngầm nếu đã cũ. Giữ data cũ trong lúc tải để bảng/chart không nháy.

export function useAiLogList(
  filters: AiLogFilters,
  query: AiLogListQuery,
  refreshKey: number,
) {
  return useCachedQuery<PageResponse<AiLogSummary>>(
    `ai-logs:list:${JSON.stringify([filters, query])}`,
    (signal) => getAiLogs(filters, query, signal),
    { refreshKey },
  )
}

export function useAiLogStats(filters: AiLogFilters, refreshKey: number) {
  return useCachedQuery<AiLogStats>(
    `ai-logs:stats:${JSON.stringify(filters)}`,
    (signal) => getAiLogStats(filters, signal),
    { refreshKey },
  )
}

export function useAiLogDetail(rid: string | null) {
  const state = useCachedQuery<{ rid: string; detail: AiLogDetail }>(
    rid ? `ai-logs:detail:${rid}` : null,
    (signal) => getAiLogDetail(rid!, signal).then((detail) => ({ rid: rid!, detail })),
  )

  // data cũ của dòng khác không được hiện trong drawer
  return {
    ...state,
    data: state.data && state.data.rid === rid ? state.data.detail : null,
  }
}

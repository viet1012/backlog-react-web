import { useEffect, useState } from 'react'
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

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

// Tải lại mỗi khi `key` đổi; giữ data cũ trong lúc tải để bảng/chart không nháy.
// load = null → không tải (vd drawer chưa chọn dòng).
function useAsync<T>(
  key: string,
  load: ((signal: AbortSignal) => Promise<T>) | null,
): AsyncState<T> & { updatedAt: number | null } {
  // settledKey = key mà data/error hiện tại thuộc về. Khi key vừa đổi, effect chưa kịp chạy
  // nhưng loading suy ra vẫn là true ngay trong render đó → không hiện data cũ như thể đã khớp bộ lọc mới.
  const [state, setState] = useState<
    AsyncState<T> & { updatedAt: number | null; settledKey: string | null }
  >({
    data: null,
    loading: load !== null,
    error: null,
    updatedAt: null,
    settledKey: null,
  })

  useEffect(() => {
    if (!load) return

    const controller = new AbortController()
    setState((prev) => ({ ...prev, loading: true, error: null }))

    load(controller.signal)
      .then((data) => {
        setState({ data, loading: false, error: null, updatedAt: Date.now(), settledKey: key })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState((prev) => ({ ...prev, loading: false, error: errorText(error), settledKey: key }))
      })

    return () => controller.abort()
    // load đổi theo mỗi render; key đã gói đủ tham số
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const { settledKey, ...rest } = state
  return {
    ...rest,
    loading: state.loading || (load !== null && settledKey !== key),
  }
}

export function useAiLogList(
  filters: AiLogFilters,
  query: AiLogListQuery,
  refreshKey: number,
) {
  return useAsync<PageResponse<AiLogSummary>>(
    JSON.stringify([filters, query, refreshKey]),
    (signal) => getAiLogs(filters, query, signal),
  )
}

export function useAiLogStats(filters: AiLogFilters, refreshKey: number) {
  return useAsync<AiLogStats>(
    JSON.stringify([filters, refreshKey]),
    (signal) => getAiLogStats(filters, signal),
  )
}

export function useAiLogDetail(rid: string | null) {
  const state = useAsync<{ rid: string; detail: AiLogDetail }>(
    rid ?? '',
    rid ? (signal) => getAiLogDetail(rid, signal).then((detail) => ({ rid, detail })) : null,
  )

  // data cũ của dòng khác không được hiện trong drawer
  return {
    ...state,
    data: state.data && state.data.rid === rid ? state.data.detail : null,
  }
}

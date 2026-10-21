import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  getFacConfirmDailySummary,
} from '../services/facConfirmService'

import type {
  FacConfirmDailySummaryRequest,
  FacConfirmDailySummaryResponse,
} from '../types/facConfirm'

// Filter đổi liên tục => chờ ngừng rồi mới gọi lại
const DEBOUNCE_MS = 300

interface UseFacConfirmDailySummaryParams
  extends FacConfirmDailySummaryRequest {
  // Chỉ gọi API khi panel đang mở. Đang thu gọn => giữ dữ liệu cũ.
  enabled: boolean

  // Trang bấm làm mới / lưu xong => tăng lên để tải lại
  refreshToken: number
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    && error.name === 'AbortError'
}

export function useFacConfirmDailySummary({
  division,
  from,
  to,
  saleType,
  heatType,
  dateBy,
  enabled,
  refreshToken,
}: UseFacConfirmDailySummaryParams) {
  // Bấm "Thử lại" => đổi key để gọi lại
  const [attempt, setAttempt] = useState(0)

  const [loaded, setLoaded] = useState<{
    key: string
    data: FacConfirmDailySummaryResponse
  } | null>(null)

  const [failed, setFailed] = useState<{
    key: string
    message: string
  } | null>(null)

  // Lần tải đầu gọi ngay, các lần sau mới debounce
  const hasDataRef = useRef(false)

  const requestKey = useMemo(
    () => JSON.stringify({
      division,
      from,
      to,
      saleType,
      heatType,
      dateBy,
      refreshToken,
      attempt,
    }),
    [
      attempt,
      dateBy,
      division,
      from,
      heatType,
      refreshToken,
      saleType,
      to,
    ],
  )

  const loadedKey = loaded?.key ?? null
  const failedKey = failed?.key ?? null

  useEffect(() => {
    if (
      !enabled
      || requestKey === loadedKey
      || requestKey === failedKey
    ) {
      return
    }

    const controller = new AbortController()

    const timer = window.setTimeout(async () => {
      try {
        const data = await getFacConfirmDailySummary(
          {
            division,
            from,
            to,
            saleType,
            heatType,
            dateBy,
          },
          controller.signal,
        )

        if (controller.signal.aborted) {
          return
        }

        hasDataRef.current = true
        setLoaded({ key: requestKey, data })
        setFailed(null)
      } catch (requestError) {
        if (
          isAbortError(requestError)
          || controller.signal.aborted
        ) {
          return
        }

        console.error(
          'Load Fac Confirm daily summary failed:',
          requestError,
        )

        setFailed({
          key: requestKey,
          message: requestError instanceof Error
            ? requestError.message
            : 'Failed to load daily summary',
        })
      }
    }, hasDataRef.current ? DEBOUNCE_MS : 0)

    // Filter đổi / panel đóng => hủy timer và request cũ
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [
    dateBy,
    division,
    enabled,
    failedKey,
    from,
    heatType,
    loadedKey,
    requestKey,
    saleType,
    to,
  ])

  const retry = useCallback(() => {
    setAttempt((current) => current + 1)
  }, [])

  return {
    // Có thể là dữ liệu của bộ lọc trước (đang tải lại / đang thu gọn)
    data: loaded?.data ?? null,

    loading: enabled
      && requestKey !== loadedKey
      && requestKey !== failedKey,

    // Dữ liệu đang hiện không khớp bộ lọc hiện tại
    stale: loaded != null && requestKey !== loadedKey,

    error: failed != null && failed.key === requestKey
      ? failed.message
      : null,

    retry,
  }
}

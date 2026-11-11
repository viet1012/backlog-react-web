import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react'

import {
  isQueryFresh,
  QUERY_FRESH_MS,
  readQueryCache,
  writeQueryCache,
} from '../utils/queryCache'

interface Settled<T> {
  // key của data / error đang giữ
  key: string | null
  data: T | null
  error: string | null
  updatedAt: number | null
}

export interface CachedQueryOptions {
  // tăng lên (nút Làm mới / lưu xong) => bỏ qua cache, load nhận force = true
  refreshKey?: number
  freshMs?: number
  // thông báo khi lỗi không phải Error
  fallbackError?: () => string
}

export interface CachedQueryResult<T> {
  // có thể là dữ liệu của key trước (đang tải key mới) — xem `stale`
  data: T | null
  error: string | null
  updatedAt: number | null
  loading: boolean
  // data đang hiện thuộc key khác key hiện tại
  stale: boolean
}

function fromCache<T>(key: string | null): Settled<T> {
  const hit = key === null ? undefined : readQueryCache<T>(key)

  return hit
    ? { key, data: hit.data, error: null, updatedAt: hit.at }
    : { key: null, data: null, error: null, updatedAt: null }
}

// Tải dữ liệu theo `key` (null = không tải), có cache theo phiên:
// - key đã có trong cache => hiện ngay, không chờ API
// - còn mới (< freshMs) => không gọi lại; cũ hơn => tải lại ngầm, vẫn giữ dữ liệu cũ
// - trang bị ẩn (KeepAliveOutlet) rồi hiện lại => effect chạy lại nhưng cache còn mới nên không gọi API thừa
export function useCachedQuery<T>(
  key: string | null,
  load: (signal: AbortSignal, force: boolean) => Promise<T>,
  {
    refreshKey = 0,
    freshMs = QUERY_FRESH_MS,
    fallbackError,
  }: CachedQueryOptions = {},
): CachedQueryResult<T> {
  'use no memo'

  const [settled, setSettled] = useState<Settled<T>>(() => fromCache<T>(key))
  const [fetching, setFetching] = useState(false)

  // refreshKey đã tải xong; khác refreshKey hiện tại = lượt do nút Làm mới.
  // Chỉ cập nhật khi tải thành công => bị hủy giữa chừng (chuyển trang) thì lần sau vẫn force
  const doneRefresh = useRef(refreshKey)

  // key đổi: có cache thì hiện ngay trong cùng lần render (không nháy loading)
  if (key !== null && settled.key !== key) {
    const hit = readQueryCache<T>(key)

    if (hit) {
      setSettled({ key, data: hit.data, error: null, updatedAt: hit.at })
    }
  }

  const run = useEffectEvent(
    (signal: AbortSignal, force: boolean) => load(signal, force),
  )

  const errorText = useEffectEvent(
    (error: unknown) => (error instanceof Error
      ? error.message
      : fallbackError?.() ?? String(error)),
  )

  useEffect(() => {
    if (key === null) {
      return
    }

    const force = refreshKey !== doneRefresh.current
    const hit = readQueryCache<T>(key)

    if (hit && !force) {
      // cache có thể mới hơn dữ liệu đang giữ (trang ẩn rồi hiện lại)
      // oxlint-disable-next-line react/set-state-in-effect
      setSettled((prev) => (prev.key === key && prev.updatedAt === hit.at
        ? prev
        : { key, data: hit.data, error: null, updatedAt: hit.at }))

      if (isQueryFresh(hit, freshMs)) {
        return
      }
    }

    const controller = new AbortController()

    setFetching(true)

    run(controller.signal, force).then(
      (data) => {
        if (controller.signal.aborted) return

        const entry = writeQueryCache(key, data)

        doneRefresh.current = refreshKey
        setSettled({ key, data, error: null, updatedAt: entry.at })
        setFetching(false)
      },
      (error: unknown) => {
        if (controller.signal.aborted) return

        const message = errorText(error)

        // lỗi lúc tải lại cùng key => giữ dữ liệu cũ; key khác => không hiện nhầm dữ liệu cũ
        setSettled((prev) => (prev.key === key
          ? { ...prev, error: message }
          : { key, data: null, error: message, updatedAt: null }))
        setFetching(false)
      },
    )

    return () => {
      // key đổi / trang bị ẩn: request bị hủy => không còn đang tải
      controller.abort()
      setFetching(false)
    }
  }, [key, refreshKey, freshMs])

  const current = key !== null && settled.key === key

  return {
    data: settled.data,
    error: current ? settled.error : null,
    updatedAt: settled.updatedAt,
    loading: key !== null && (fetching || !current),
    stale: settled.key !== key,
  }
}

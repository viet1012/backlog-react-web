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
  /**
   * Chưa có dữ liệu cho key hiện tại, hoặc người dùng bấm Làm mới.
   * KHÔNG bật khi chỉ tải lại ngầm dữ liệu cũ (quay lại trang sau > freshMs):
   * lúc đó dữ liệu vẫn đúng, làm mờ / quay spinner chỉ gây chớp.
   */
  loading: boolean
  /** Đang tải lại ngầm (đã có dữ liệu của key này) */
  refreshing: boolean
  // data đang hiện thuộc key khác key hiện tại
  stale: boolean
}

// ---------------------------------------------------------
// Request đang chạy, dùng chung theo key.
// Trang bị ẩn (KeepAlive) giữa chừng: KHÔNG hủy request – kết quả vẫn được
// ghi vào cache, quay lại trang thì dùng luôn (trước đây bị hủy và tải lại
// từ đầu). Hai nơi cùng hỏi một key thì chỉ gọi API một lần.
// ---------------------------------------------------------
const inFlight = new Map<string, Promise<unknown>>()

// Tải trước vào cache (vd rê chuột lên khung sắp mở): đã có cache còn mới / đang tải → bỏ qua.
// Dùng chung inFlight nên lúc mở thật useCachedQuery sẽ chờ đúng request này, không gọi lần 2.
// Trả về promise của request mới (undefined = bỏ qua vì đã có cache / đang tải).
export function prefetchQuery<T>(
  key: string,
  load: (signal: AbortSignal) => Promise<T>,
  freshMs = QUERY_FRESH_MS,
): Promise<unknown> | undefined {
  if (inFlight.has(key) || isQueryFresh(readQueryCache(key), freshMs)) {
    return undefined
  }

  const request = load(new AbortController().signal)
    .then((data) => {
      writeQueryCache(key, data)
      return data
    })
    .finally(() => {
      inFlight.delete(key)
    })

  // lỗi prefetch bỏ qua – lúc mở thật sẽ tải lại và báo lỗi
  const settled = request.catch(() => {})
  inFlight.set(key, request)

  return settled
}

/** Có request nào đang chạy với key bắt đầu bằng prefix không (vd đang tải detail) */
export function isQueryInFlight(prefix: string): boolean {
  for (const key of inFlight.keys()) {
    if (key.startsWith(prefix)) return true
  }
  return false
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
  // null = không tải; 'background' = tải lại ngầm; 'foreground' = lần đầu / Làm mới
  const [fetching, setFetching] = useState<null | 'background' | 'foreground'>(null)

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

    // Chỉ bỏ qua kết quả (không hủy request): key đổi / trang ẩn
    let ignore = false

    // Lượt Làm mới phải gọi mới; còn lại dùng chung request đang chạy cùng key
    const flightKey = force ? `${key}#refresh:${refreshKey}` : key
    let request = inFlight.get(flightKey) as Promise<T> | undefined

    if (!request) {
      // Không truyền signal bị hủy theo vòng đời component nữa (xem inFlight)
      request = run(new AbortController().signal, force)
        .then((data) => {
          writeQueryCache(key, data)
          return data
        })
        .finally(() => {
          inFlight.delete(flightKey)
        })

      inFlight.set(flightKey, request)
    }

    setFetching(hit && !force ? 'background' : 'foreground')

    request.then(
      (data) => {
        if (ignore) return

        const entry = readQueryCache<T>(key)

        doneRefresh.current = refreshKey
        setSettled({ key, data, error: null, updatedAt: entry?.at ?? Date.now() })
        setFetching(null)
      },
      (error: unknown) => {
        if (ignore) return

        const message = errorText(error)

        // lỗi lúc tải lại cùng key => giữ dữ liệu cũ; key khác => không hiện nhầm dữ liệu cũ
        setSettled((prev) => (prev.key === key
          ? { ...prev, error: message }
          : { key, data: null, error: message, updatedAt: null }))
        setFetching(null)
      },
    )

    return () => {
      ignore = true
      setFetching(null)
    }
  }, [key, refreshKey, freshMs])

  const current = key !== null && settled.key === key

  return {
    data: settled.data,
    error: current ? settled.error : null,
    updatedAt: settled.updatedAt,
    loading: key !== null && (fetching === 'foreground' || !current),
    refreshing: fetching === 'background',
    stale: settled.key !== key,
  }
}

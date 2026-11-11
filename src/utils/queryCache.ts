// =========================================================
// CACHE DỮ LIỆU API THEO PHIÊN (dùng chung cho các trang)
//
// Quay lại trang / tab / bộ lọc vừa xem => hiện ngay dữ liệu cũ,
// rồi tải lại ngầm nếu đã cũ hơn QUERY_FRESH_MS (stale-while-revalidate).
// Mục cũ hơn QUERY_MAX_AGE_MS thì bỏ (không hiện dữ liệu quá cũ).
// =========================================================

export interface QueryCacheEntry<T = unknown> {
  data: T
  at: number
}

// Trong khoảng này coi là còn mới: quay lại không gọi API
export const QUERY_FRESH_MS = 30_000

// Quá khoảng này: không hiện nữa, chờ tải mới
const QUERY_MAX_AGE_MS = 10 * 60_000

const MAX_ENTRIES = 60

const cache = new Map<string, QueryCacheEntry>()

export function readQueryCache<T>(key: string): QueryCacheEntry<T> | undefined {
  const entry = cache.get(key)

  if (!entry) {
    return undefined
  }

  if (Date.now() - entry.at > QUERY_MAX_AGE_MS) {
    cache.delete(key)
    return undefined
  }

  return entry as QueryCacheEntry<T>
}

export function writeQueryCache<T>(key: string, data: T): QueryCacheEntry<T> {
  const entry = { data, at: Date.now() }

  // Map giữ thứ tự chèn => xóa rồi chèn lại để mục mới nhất ở cuối (LRU)
  cache.delete(key)
  cache.set(key, entry)

  while (cache.size > MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value

    if (oldestKey === undefined) {
      break
    }

    cache.delete(oldestKey)
  }

  return entry
}

export function isQueryFresh(entry: QueryCacheEntry | undefined, freshMs = QUERY_FRESH_MS): boolean {
  return entry !== undefined && Date.now() - entry.at < freshMs
}

// prefix rỗng = xóa hết (vd khi đăng xuất)
export function clearQueryCache(prefix = ''): void {
  for (const key of [...cache.keys()]) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }
}

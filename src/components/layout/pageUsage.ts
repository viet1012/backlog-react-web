import { getAuthenticatedUsername } from '../../services/authService'

/*
 * Đếm số lần mở từng trang (theo tài khoản, lưu trên máy) để trang chủ đưa trang hay dùng lên đầu.
 * Điểm giảm dần theo mỗi lần chuyển trang (DECAY) nên thói quen mới dần thay thế thói quen cũ.
 * localStorage có thể bị chặn / rỗng: mọi lỗi đều bỏ qua, trang chủ vẫn chạy với thứ tự mặc định.
 */
const KEY_PREFIX = 'pc.pageUsage.'
const DECAY = 0.95
// Bỏ các trang điểm quá thấp cho gọn
const MIN_KEEP = 0.2
const MAX_PAGES = 40

type UsageMap = Record<string, number>

function storageKey() {
  return KEY_PREFIX + (getAuthenticatedUsername() ?? 'anonymous')
}

function readUsage(): UsageMap {
  try {
    const raw = localStorage.getItem(storageKey())
    const parsed: unknown = raw ? JSON.parse(raw) : null
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const usage: UsageMap = {}
    for (const [path, score] of Object.entries(parsed)) {
      if (typeof score === 'number' && Number.isFinite(score)) usage[path] = score
    }
    return usage
  } catch {
    return {}
  }
}

export function recordPageVisit(path: string) {
  const usage = readUsage()
  const next: UsageMap = {}
  for (const [key, score] of Object.entries(usage)) {
    const decayed = score * DECAY
    if (decayed >= MIN_KEEP) next[key] = decayed
  }
  next[path] = (next[path] ?? 0) + 1

  const trimmed = Object.entries(next)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_PAGES)

  try {
    localStorage.setItem(storageKey(), JSON.stringify(Object.fromEntries(trimmed)))
  } catch {
    // Bộ nhớ bị chặn / đầy: bỏ qua
  }
}

export function getPageUsage(): UsageMap {
  return readUsage()
}

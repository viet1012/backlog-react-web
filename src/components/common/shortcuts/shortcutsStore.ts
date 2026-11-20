import { useEffect, useEffectEvent } from 'react'

/*
 * Phím tắt toàn app (đề xuất 7). Xử lý phím ở GlobalShortcuts (gắn trong MainLayout).
 *
 * Trang không cần đăng ký gì cho các phím chung:
 *   /   tìm ô có data-shortcut="search" đang hiện (FilterSearch tự gắn)
 *   r   bấm nút Làm mới đang hiện (HeaderAction kind="refresh" tự gắn data-header-action)
 * Trang ẩn (KeepAlive) bị display: none nên không bị chọn nhầm.
 *
 * Trang có thay đổi chưa lưu: useUnsavedChangesGuard để phím r không làm mới.
 */

/** Đang gõ chữ: không bắt phím một chữ cái */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  if (target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return true

  return target.tagName === 'INPUT'
    && !['checkbox', 'radio', 'range', 'button', 'submit', 'reset'].includes((target as HTMLInputElement).type)
}

// =========================================================
// THAY ĐỔI CHƯA LƯU
// =========================================================

const unsavedGuards = new Set<() => number>()

/** Tổng số thay đổi chưa lưu của các trang đang hiện */
export function countUnsavedChanges(): number {
  let total = 0
  for (const guard of unsavedGuards) total += guard()
  return total
}

/**
 * Báo cho phím tắt biết trang đang có thay đổi chưa lưu (trả về số thay đổi, 0 = không có).
 * Tự gỡ khi trang bị ẩn / unmount.
 */
export function useUnsavedChangesGuard(count: () => number) {
  const read = useEffectEvent(count)

  useEffect(() => {
    const guard = () => read()

    unsavedGuards.add(guard)
    return () => {
      unsavedGuards.delete(guard)
    }
  }, [])
}

// =========================================================
// MỞ BẢNG PHÍM TẮT TỪ CHỖ KHÁC (menu cài đặt)
// =========================================================

const OPEN_HELP_EVENT = 'pc:open-shortcut-help'

export function openShortcutHelp() {
  window.dispatchEvent(new Event(OPEN_HELP_EVENT))
}

export function onOpenShortcutHelp(handler: () => void) {
  window.addEventListener(OPEN_HELP_EVENT, handler)
  return () => window.removeEventListener(OPEN_HELP_EVENT, handler)
}

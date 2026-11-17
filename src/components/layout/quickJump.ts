/*
 * Mở hộp tìm trang (Ctrl+K) của LeftSidebar từ chỗ khác (vd. nút trên trang chủ)
 * mà không phải kéo state lên MainLayout.
 */
const OPEN_EVENT = 'pc:open-quick-jump'

export function openQuickJump() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

export function onOpenQuickJump(handler: () => void) {
  window.addEventListener(OPEN_EVENT, handler)
  return () => window.removeEventListener(OPEN_EVENT, handler)
}

import { useSyncExternalStore } from 'react'

/*
 * Đường dẫn vừa bấm nhưng router chưa đổi xong (React Router v7 chạy điều hướng trong
 * startTransition: trang cũ đứng yên tới khi trang mới tải + render xong).
 * Sidebar ghi vào đây lúc bấm; MainLayout đọc để hiện thanh tiến trình + làm mờ trang cũ ngay.
 */
let pendingPath: string | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function setNavPending(path: string | null) {
  if (pendingPath === path) return
  pendingPath = path
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useNavPending() {
  return useSyncExternalStore(subscribe, () => pendingPath, () => null)
}

import {
  useCallback,
  useState,
} from 'react'


/**
 * Tự mở tour ở lần đầu vào màn hình.
 * Đóng tour (Bỏ qua / Hoàn tất / Esc) => ghi 'done' vào localStorage.
 */
export function useGuideTour(storageKey: string) {

  const [open, setOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) !== 'done'
    } catch {
      return false
    }
  })

  const start = useCallback(() => setOpen(true), [])

  const close = useCallback(() => {
    setOpen(false)

    try {
      localStorage.setItem(storageKey, 'done')
    } catch {
      // ignore
    }
  }, [storageKey])

  return { open, start, close }
}

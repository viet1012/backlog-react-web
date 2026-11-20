import { useEffect, useRef } from 'react'

// Gọi `action` khi con trỏ dừng trên phần tử ≥ delay ms (lướt qua thì không gọi).
// Dùng cho tải trước: rê chuột lên khung nào thì tải sẵn khung đó.
export function useHoverIntent<A extends unknown[]>(action: ((...args: A) => void) | undefined, delay = 150) {
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return {
    start: (...args: A) => {
      if (!action) return
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => action(...args), delay)
    },
    cancel: () => window.clearTimeout(timer.current),
  }
}

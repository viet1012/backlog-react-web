import { useEffect, useRef, useState } from 'react'

export interface ElementSize {
  width: number
  height: number
}

// Kích thước nội dung của phần tử, cập nhật theo ResizeObserver (làm tròn px để tránh render thừa)
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width)
      const height = Math.round(entry.contentRect.height)
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }))
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, size] as const
}

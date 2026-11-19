import { useEffect, useState } from 'react'

import { useStableCallback } from './useStableCallback'

/**
 * Ô nhập gõ tự do: hiện ngay giá trị đang gõ (draft), chỉ đẩy lên `commit`
 * sau khi ngừng gõ `delay` ms. Giá trị ngoài đổi (vd Xóa bộ lọc, link URL)
 * thì ô nhập theo luôn. delay = 0: đẩy lên ngay.
 */
export function useDebouncedField(
  external: string,
  commit: (value: string) => void,
  delay: number,
) {
  const [draft, setDraft] = useState(external)
  // luôn gọi bản commit mới nhất (bộ lọc khác có thể đổi trong lúc chờ)
  const latestCommit = useStableCallback(commit)

  const [prevExternal, setPrevExternal] = useState(external)
  if (prevExternal !== external) {
    setPrevExternal(external)
    setDraft(external)
  }

  useEffect(() => {
    if (draft === external || delay <= 0) return
    const timer = window.setTimeout(() => latestCommit(draft), delay)
    return () => window.clearTimeout(timer)
  }, [draft, external, delay, latestCommit])

  function change(value: string) {
    setDraft(value)
    if (delay <= 0) latestCommit(value)
  }

  return [draft, change] as const
}

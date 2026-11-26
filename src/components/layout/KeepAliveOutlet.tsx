import {
  Activity,
  Suspense,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocation, useOutlet } from 'react-router-dom'

import { isAlwaysKept, keepAliveKey } from '../../pages/lazyPages'

// Số trang giữ lại tối đa (gồm trang đang xem); quá thì bỏ trang lâu không mở nhất
const MAX_KEPT_PAGES = 6

interface KeptState {
  // thứ tự render cố định (thứ tự mở lần đầu): đổi thứ tự sẽ làm React dời DOM,
  // iframe bị dời là tải lại từ đầu
  keys: string[]
  // cũ -> mới, để chọn trang bỏ đi
  recent: string[]
}

function visit(state: KeptState, key: string): KeptState {
  const recent = [...state.recent.filter((k) => k !== key), key]
  // Bỏ trang lâu không mở nhất, trừ trang luôn giữ (trang chủ 3D)
  const evictIndex = recent.length > MAX_KEPT_PAGES ? recent.findIndex((k) => !isAlwaysKept(k)) : -1
  const evicted = evictIndex >= 0 ? recent.splice(evictIndex, 1)[0] : undefined

  return {
    keys: [
      ...state.keys.filter((k) => k !== evicted),
      ...(state.keys.includes(key) ? [] : [key]),
    ],
    recent,
  }
}

interface KeptPageProps {
  active: boolean
  // null khi đang ẩn: giữ element của lần hiện gần nhất
  element: ReactNode
  fallback: ReactNode
}

interface ScrollPos {
  top: number
  left: number
}

// Trang ẩn bằng display:none thì trình duyệt bỏ vị trí cuộn của mọi vùng cuộn bên trong
// (bảng, danh sách, khung trang): hiện lại là nhảy về đầu, DataGrid còn nháy trắng hàng.
// Ghi lại vị trí mỗi lần cuộn lúc trang đang hiện; hiện lại thì trả về trước khi vẽ.
function useKeepScroll(active: boolean) {
  const rootRef = useRef<HTMLDivElement>(null)
  const saved = useRef(new Map<Element, ScrollPos>())

  useLayoutEffect(() => {
    const root = rootRef.current
    const positions = saved.current
    if (!active || !root) return

    for (const [element, pos] of positions) {
      if (!element.isConnected) continue
      element.scrollTop = pos.top
      element.scrollLeft = pos.left
    }

    const onScroll = (event: Event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      positions.set(target, { top: target.scrollTop, left: target.scrollLeft })
    }

    // scroll không nổi bọt: nghe ở pha capture để bắt mọi vùng cuộn con
    root.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => {
      root.removeEventListener('scroll', onScroll, { capture: true })
      // bỏ các vùng cuộn đã bị gỡ khỏi trang
      for (const element of positions.keys()) {
        if (!element.isConnected) positions.delete(element)
      }
    }
  }, [active])

  return rootRef
}

function KeptPage({ active, element, fallback }: KeptPageProps) {
  const [frozen, setFrozen] = useState(element)
  const rootRef = useKeepScroll(active)

  if (active && element !== frozen) {
    setFrozen(element)
  }

  return (
    // display: contents: không tạo hộp, trang vẫn là con flex trực tiếp của khung như cũ
    <div ref={rootRef} style={{ display: 'contents' }}>
      <Activity mode={active ? 'visible' : 'hidden'}>
        <Suspense fallback={fallback}>
          {active ? element : frozen}
        </Suspense>
      </Activity>
    </div>
  )
}

// Thay cho <Outlet />: trang đã mở được giữ lại (ẩn bằng <Activity>) khi chuyển
// sang trang khác => quay lại hiện ngay, còn nguyên dữ liệu, bộ lọc, trang bảng,
// tab đang chọn, iframe không tải lại. Lúc ẩn, effect của trang được dọn
// (request bị hủy, timer dừng); hiện lại thì effect chạy lại, dữ liệu còn mới
// trong cache nên không gọi API thừa (xem useCachedQuery).
export function KeepAliveOutlet({ fallback }: { fallback: ReactNode }) {
  const outlet = useOutlet()
  const { pathname } = useLocation()
  const key = keepAliveKey(pathname)

  const [kept, setKept] = useState<KeptState>(
    () => (key ? { keys: [key], recent: [key] } : { keys: [], recent: [] }),
  )

  if (key && kept.recent.at(-1) !== key) {
    setKept(visit(kept, key))
  }

  return (
    <>
      {kept.keys.map((k) => (
        <KeptPage
          key={k}
          active={k === key}
          element={k === key ? outlet : null}
          fallback={fallback}
        />
      ))}

      {key === null && (
        <Suspense fallback={fallback}>
          {outlet}
        </Suspense>
      )}
    </>
  )
}

import {
  Activity,
  Suspense,
  useState,
  type ReactNode,
} from 'react'
import { useLocation, useOutlet } from 'react-router-dom'

import { keepAliveKey } from '../../pages/lazyPages'

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
  const evicted = recent.length > MAX_KEPT_PAGES ? recent.shift() : undefined

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

function KeptPage({ active, element, fallback }: KeptPageProps) {
  const [frozen, setFrozen] = useState(element)

  if (active && element !== frozen) {
    setFrozen(element)
  }

  return (
    <Activity mode={active ? 'visible' : 'hidden'}>
      <Suspense fallback={fallback}>
        {active ? element : frozen}
      </Suspense>
    </Activity>
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

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { reportPageReady } from '../utils/webVitals'

/**
 * Đo "trang sẵn sàng": ghi thời gian từ lúc mở trang tới lần đầu `ready` = true
 * (dữ liệu chính đã hiện). Chỉ chạy khi bật đo hiệu năng (xem utils/webVitals.ts);
 * mỗi lần mở trang chỉ ghi 1 lần. Lỗi thì đừng bật ready (không ghi).
 */
export function usePageReadyMetric(name: string, ready: boolean) {
  const { pathname } = useLocation()

  useEffect(() => {
    if (ready) reportPageReady(name, pathname)
  }, [name, ready, pathname])
}

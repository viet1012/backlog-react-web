import {
  useEffect,
  useRef,
  useState,
} from 'react'

import type { MonitorRange } from '../components/machineMonitor/monitorRange'
import type { MonitorTabDef } from '../components/machineMonitor/monitorTypes'
import { loadMachineStore } from '../services/machineLocatorService'
import type {
  LayoutData,
  MachineLayoutConfig,
  MachineMap,
} from '../types/machineLocator'
import {
  buildBaseBoxes,
  buildEffectiveMachines,
} from '../utils/machineLocatorGeometry'

// tự làm mới 5 phút
const AUTO_REFRESH_MS = 5 * 60 * 1000

export interface MonitorFloor {
  data: LayoutData
  machines: MachineMap
}

// Tải layout (chỉ đọc, bản mới nhất của Machine Locator) + dữ liệu của tab, làm mới tay / tự động.
// Đổi floor / tab: gắn key ở nơi dùng để reset state.
// Đổi history (phạm vi lịch sử): tải lại, giữ dữ liệu cũ tới khi có dữ liệu mới
export function useMonitorData<T>(layout: MachineLayoutConfig, tab: MonitorTabDef<T>, history?: MonitorRange) {
  const [floor, setFloor] = useState<MonitorFloor | null>(null)
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadedAt, setLoadedAt] = useState<Date | null>(null)
  const [seq, setSeq] = useState(0)
  const busy = useRef(false)

  useEffect(() => {
    const ctrl = new AbortController()

    busy.current = true
    setLoading(true)

    Promise.all([
      loadMachineStore(layout),
      tab.load(layout.id, ctrl.signal, history),
    ]).then(
      ([store, d]) => {
        if (ctrl.signal.aborted) return
        setFloor({
          data: store.data,
          machines: buildEffectiveMachines(store.data, buildBaseBoxes(store.data), null),
        })
        setData(d)
        setError('')
        setLoadedAt(new Date())
      },
      (e: unknown) => {
        if (ctrl.signal.aborted) return
        // giữ dữ liệu cũ, chỉ báo lỗi
        setError(e instanceof Error ? e.message : String(e))
      },
    ).finally(() => {
      if (ctrl.signal.aborted) return
      busy.current = false
      setLoading(false)
    })

    return () => {
      ctrl.abort()
      busy.current = false
    }
  }, [layout, tab, history, seq])

  // hẹn lại từ lần tải gần nhất; bỏ qua khi tab trình duyệt đang ẩn
  useEffect(() => {
    const t = window.setInterval(() => {
      if (!busy.current && document.visibilityState === 'visible') setSeq((s) => s + 1)
    }, AUTO_REFRESH_MS)

    return () => window.clearInterval(t)
  }, [seq])

  return {
    floor,
    data,
    error,
    loading,
    loadedAt,
    refresh: () => setSeq((s) => s + 1),
  }
}

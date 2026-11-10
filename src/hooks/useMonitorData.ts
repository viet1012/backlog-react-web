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
// dữ liệu trong cache mới hơn mức này: quay lại tab / floor thì không tải lại
const FRESH_MS = 60 * 1000

export interface MonitorFloor {
  data: LayoutData
  machines: MachineMap
}

// Cache theo phiên (sống qua remount khi đổi tab / floor / trang):
// mở lại tab đã xem thì hiện ngay dữ liệu cũ, tải lại ngầm nếu đã cũ
const floorCache = new Map<string, MonitorFloor>()
const dataCache = new Map<string, { data: unknown, at: Date }>()
// request đang chạy: prefetch và lúc mở tab dùng chung 1 request.
// Không huỷ khi rời tab: kết quả vẫn vào cache cho lần mở sau
const inflight = new Map<string, Promise<unknown>>()

const dataKey = (tabId: string, floorId: string, history?: MonitorRange) =>
  `${tabId}:${floorId}:${history ? JSON.stringify(history) : ''}`

function shared<R>(key: string, run: () => Promise<R>): Promise<R> {
  let p = inflight.get(key) as Promise<R> | undefined

  if (!p) {
    p = run().finally(() => inflight.delete(key))
    inflight.set(key, p)
  }

  return p
}

function fetchFloor(layout: MachineLayoutConfig): Promise<MonitorFloor> {
  return shared(`floor:${layout.id}`, () => loadMachineStore(layout).then((store) => {
    const f = {
      data: store.data,
      machines: buildEffectiveMachines(store.data, buildBaseBoxes(store.data), null),
    }

    floorCache.set(layout.id, f)

    return f
  }))
}

function fetchData<T>(layout: MachineLayoutConfig, tab: MonitorTabDef<T>, history?: MonitorRange) {
  const key = dataKey(tab.id, layout.id, history)

  return shared(`data:${key}`, () => tab.load(layout.id, new AbortController().signal, history).then((d) => {
    const entry = { data: d as unknown, at: new Date() }

    dataCache.set(key, entry)

    return entry
  }))
}

// Tải trước 1 tab × floor (rê chuột lên tab, hoặc lúc rảnh) nếu chưa có trong cache
export function prefetchMonitor<T>(layout: MachineLayoutConfig, tab: MonitorTabDef<T>, history?: MonitorRange) {
  Promise.all([
    floorCache.get(layout.id) ?? fetchFloor(layout),
    dataCache.get(dataKey(tab.id, layout.id, history)) ?? fetchData(layout, tab, history),
  ]).catch(() => {
    // lỗi thì để lúc mở tab tải lại và báo lỗi
  })
}

// Tải layout (chỉ đọc, bản mới nhất của Machine Locator) + dữ liệu của tab, làm mới tay / tự động.
// Đổi floor / tab: gắn key ở nơi dùng để reset state.
// Đổi history (phạm vi lịch sử): tải lại, giữ dữ liệu cũ tới khi có dữ liệu mới
export function useMonitorData<T>(layout: MachineLayoutConfig, tab: MonitorTabDef<T>, history?: MonitorRange) {
  const [cached] = useState(() => dataCache.get(dataKey(tab.id, layout.id, history)))
  const [floor, setFloor] = useState<MonitorFloor | null>(() => floorCache.get(layout.id) ?? null)
  const [data, setData] = useState<T | null>(() => (cached ? cached.data as T : null))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadedAt, setLoadedAt] = useState<Date | null>(() => cached?.at ?? null)
  const [seq, setSeq] = useState(0)
  const busy = useRef(false)
  // seq đã xử lý: seq đổi = làm mới tay / tự động -> luôn tải lại
  const doneSeq = useRef(seq)

  useEffect(() => {
    const ctrl = new AbortController()
    const key = dataKey(tab.id, layout.id, history)
    const hit = dataCache.get(key)
    const cachedFloor = floorCache.get(layout.id)
    const forced = doneSeq.current !== seq

    doneSeq.current = seq

    // có cache: hiện ngay (đổi history về khoảng đã xem)
    if (hit && cachedFloor) {
      setFloor(cachedFloor)
      setData(hit.data as T)
      setLoadedAt(hit.at)

      if (!forced && Date.now() - hit.at.getTime() < FRESH_MS) {
        setLoading(false)
        return
      }
    }

    busy.current = true
    setLoading(true)

    Promise.all([
      fetchFloor(layout),
      fetchData(layout, tab, history),
    ]).then(
      ([f, d]) => {
        if (ctrl.signal.aborted) return
        setFloor(f)
        setData(d.data as T)
        setError('')
        setLoadedAt(d.at)
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

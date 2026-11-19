import dayjs from 'dayjs'

import { useCachedQuery } from '../../../hooks/useCachedQuery'
import { getCostMonitoringChart, getCostMonitoringMonths, toApiMonth } from '../../../services/costMonitoringService'
import { getFacConfirmProcessGroups } from '../../../services/facConfirmService'
import { listFloors } from '../../../services/machineLocatorService'
import { fetchHseMonitor } from '../../../services/machineMonitorService'
import { hasAnyRole } from '../../../services/authService'
import type { FacConfirmProcessGroup } from '../../../types/facConfirm'
import { loadFacConfirmPreferences } from '../../../utils/uiPreferences'
import { FAC_CONFIRM_DIVS } from '../../facConfirm/facConfirmFilters'

/**
 * Số liệu "Việc của tôi hôm nay" ở Trang chủ. Mỗi thẻ có `link` mở thẳng trang
 * đã lọc sẵn (bộ lọc trên URL, xem useUrlFilters).
 *
 *   facConfirm  PO cần xác nhận hôm nay chưa xác nhận (Division đang dùng ở Fac Confirm)
 *   cost        khung Cost tháng này đã vượt (+ dự báo vượt)
 *   machine     máy / nhóm lỗi HSE chưa đóng trên mọi tầng
 *
 * Cache theo phiên (useCachedQuery): quay lại Trang chủ không gọi API lại ngay.
 */

// Trang chủ mở cả ngày: số liệu tải lại ngầm sau 2 phút
const FRESH_MS = 2 * 60_000

const PROCESS_ORDER: FacConfirmProcessGroup[] = ['Rough', 'Heat', 'Fine']

export interface TodayTask<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export interface FacConfirmTask {
  divLabel: string
  remaining: number
  byProcess: { process: FacConfirmProcessGroup, remaining: number }[]
  link: string
}

export interface CostTask {
  month: string
  over: number
  willExceed: number
  link: string
}

export interface MachineTask {
  active: number
  overdue: number
  topFloorName: string | null
  link: string
}

function todayKey() {
  return dayjs().format('YYYY-MM-DD')
}

// ---------------------------------------------------------
// FAC CONFIRM: cần xác nhận - đã xác nhận (theo PO), từng công đoạn
// ---------------------------------------------------------

async function loadFacConfirm(div: string, expD: string, signal: AbortSignal): Promise<FacConfirmTask> {
  const groups = await getFacConfirmProcessGroups(
    { div, expD, heatType: 'All', filters: [], logicOperator: 'and' },
    signal,
  )

  const byProcess = PROCESS_ORDER.map((process) => {
    const group = groups.find((item) => item.processGroup === process)
    return {
      process,
      remaining: group ? Math.max(0, group.requiredOrderCount - group.confirmedOrderCount) : 0,
    }
  })

  // mở công đoạn còn nhiều nhất; hết rồi thì công đoạn người dùng hay mở
  const top = byProcess.reduce((best, item) => (item.remaining > best.remaining ? item : best), byProcess[0])
  const procGrp = top.remaining > 0 ? top.process : loadFacConfirmPreferences().procGrp

  return {
    divLabel: FAC_CONFIRM_DIVS.find((item) => item.value === div)?.label ?? div,
    remaining: byProcess.reduce((sum, item) => sum + item.remaining, 0),
    byProcess,
    link: `/fac-confirm?${new URLSearchParams({ div, expD, procGrp })}`,
  }
}

// ---------------------------------------------------------
// COST: tháng này; chưa có số tháng này thì tháng mới nhất có dữ liệu
// ---------------------------------------------------------

async function loadCost(signal: AbortSignal): Promise<CostTask> {
  let month = dayjs().format('YYYY-MM')
  let result

  try {
    result = await getCostMonitoringChart(month, '', signal)
  } catch (error) {
    const months = (await getCostMonitoringMonths(signal)).map(toApiMonth).sort()
    const latest = months.at(-1)
    if (!latest || latest === month) throw error

    month = latest
    result = await getCostMonitoringChart(month, '', signal)
  }

  return {
    month: dayjs(`${month}-01`).format('MM/YYYY'),
    over: result.charts.filter((chart) => chart.forecast?.status === 'OVER').length,
    willExceed: result.charts.filter((chart) => chart.forecast?.status === 'WILL_EXCEED').length,
    link: '/cost-monitoring',
  }
}

// ---------------------------------------------------------
// MACHINE: lỗi HSE chưa đóng (status khác SAFE) trên mọi tầng
// ---------------------------------------------------------

async function loadMachine(signal: AbortSignal): Promise<MachineTask> {
  const floors = await listFloors()

  const results = await Promise.all(floors.map(async (floor) => {
    try {
      const data = await fetchHseMonitor(floor.id, signal)
      const targets = [...Object.values(data.machines), ...data.unassigned]

      return {
        floor,
        active: targets.filter((item) => item.status !== 'SAFE').length,
        overdue: targets.filter((item) => item.status === 'OVERDUE').length,
      }
    } catch {
      // 1 tầng lỗi không làm hỏng cả thẻ
      return null
    }
  }))

  const ok = results.filter((item): item is NonNullable<typeof item> => item !== null)
  if (floors.length > 0 && ok.length === 0) throw new Error('HSE')

  const top = ok.reduce<(typeof ok)[number] | null>(
    (best, item) => (item.active > (best?.active ?? 0) ? item : best),
    null,
  )

  const params = new URLSearchParams({ tab: 'hse' })
  if (top) params.set('layout', top.floor.id)

  return {
    active: ok.reduce((sum, item) => sum + item.active, 0),
    overdue: ok.reduce((sum, item) => sum + item.overdue, 0),
    topFloorName: top?.floor.name ?? null,
    link: `/monitoring/machine?${params}`,
  }
}

function toTask<T>(query: { data: T | null, loading: boolean, error: string | null }): TodayTask<T> {
  return { data: query.data, loading: query.loading && !query.data, error: query.data ? null : query.error }
}

export function useTodayTasks() {
  const today = todayKey()
  const canFacConfirm = hasAnyRole(['PC', 'PRO'])
  const div = loadFacConfirmPreferences().div

  const facConfirm = useCachedQuery<FacConfirmTask>(
    canFacConfirm ? `home:today:fac:${div}:${today}` : null,
    (signal) => loadFacConfirm(div, today, signal),
    { freshMs: FRESH_MS },
  )

  const cost = useCachedQuery<CostTask>(
    `home:today:cost:${today}`,
    loadCost,
    { freshMs: FRESH_MS },
  )

  const machine = useCachedQuery<MachineTask>(
    `home:today:hse:${today}`,
    loadMachine,
    { freshMs: FRESH_MS },
  )

  return {
    facConfirm: canFacConfirm ? toTask(facConfirm) : null,
    cost: toTask(cost),
    machine: toTask(machine),
  }
}

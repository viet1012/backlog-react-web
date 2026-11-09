import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import type {
  CostDetailResponse,
  CostDetailTarget,
  CostDetailTransactionPage,
  CostDetailTxQuery,
  CostMonitoringChartResponse,
  CostPlWeeksResponse,
  CostSimuWeek,
} from '../types/costMonitoring'
import {
  getCostMonitoringChart,
  getCostMonitoringDetail,
  getCostMonitoringDetailTransactions,
  getCostMonitoringMonths,
  getCostMonitoringPlWeeks,
  toApiMonth,
} from '../services/costMonitoringService'
import { getMessages } from '../i18n/i18nContext'


function toErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}


// ---------- detail 1 khung (drawer) – target null hoặc open = false → không gọi API ----------
export function useCostMonitoringDetail(
  // dạng "2026.10"
  month: string | null,
  target: CostDetailTarget | null,
  simuWeek: CostSimuWeek,
  refreshKey = 0,
  // drawer đang mở; đóng thì giữ data (nội dung không mất lúc trượt ra) nhưng không tải lại
  open = true,
) {
  const [data, setData] =
    useState<CostDetailResponse | null>(null)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const div = target?.div
  const chart = target?.chart

  // đổi khung / tháng → bỏ số của khung cũ ngay (không hiện nhầm trong lúc tải)
  const requestKey = month && div && chart ? `${month}|${div}|${chart}|${simuWeek}` : null
  const [loadedKey, setLoadedKey] =
    useState(requestKey)
  if (loadedKey !== requestKey) {
    setLoadedKey(requestKey)
    setData(null)
    setError(null)
  }

  // refreshKey đã xử lý (tải xong với refresh=true, hoặc bấm ↻ lúc drawer đóng → bỏ qua)
  const refreshedKey =
    useRef(refreshKey)

  // "requestKey|refreshKey" của lần tải thành công gần nhất → mở lại drawer không gọi API thừa
  const loadedFor =
    useRef<string | null>(null)

  useEffect(() => {
    // bấm ↻ khi drawer đóng: không gửi refresh ở lần mở sau (chart đã refresh rồi)
    if (!open) {
      refreshedKey.current = refreshKey
      return
    }

    if (!month || !div || !chart) {
      return
    }

    const loadKey = `${month}|${div}|${chart}|${simuWeek}|${refreshKey}`
    if (loadedFor.current === loadKey) {
      return
    }

    // chỉ lượt do nút ↻ (khi drawer đang mở) mới gửi refresh=true
    const forceRefresh =
      refreshKey !== refreshedKey.current

    const controller =
      new AbortController()

    setLoading(true)
    setError(null)

    // trang giao dịch đầu (cả kỳ) đi kèm luôn → không gọi API lần 2 khi vừa mở
    getCostMonitoringDetail(
      toApiMonth(month),
      { div, chart },
      simuWeek,
      { date: null, page: 0, size: COST_TX_DEFAULT_PAGE_SIZE },
      controller.signal,
      forceRefresh,
    )
      .then((response) => {
        refreshedKey.current = refreshKey
        loadedFor.current = loadKey
        setData(response)
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setData(null)
          setError(toErrorMessage(err, getMessages().costDetail.loadFailed))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [month, div, chart, simuWeek, refreshKey, open])

  return { data, loading, error }
}


// số dòng / trang mặc định = mặc định của BE
export const COST_TX_DEFAULT_PAGE_SIZE = 50

// ---------- trang giao dịch (server-side: lọc ngày + phân trang) ----------
// query trùng trang đầu mặc định → dùng luôn initial (đã có trong response detail), không gọi API
export function useCostDetailTransactions(
  // dạng "2026.10"
  month: string | null,
  target: CostDetailTarget | null,
  simuWeek: CostSimuWeek,
  query: CostDetailTxQuery,
  initial: CostDetailTransactionPage | null,
) {
  const [fetched, setFetched] =
    useState<CostDetailTransactionPage | null>(null)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const useInitial =
    query.date === null && query.page === 0 && query.size === COST_TX_DEFAULT_PAGE_SIZE

  const div = target?.div
  const chart = target?.chart
  const { date, page, size } = query

  useEffect(() => {
    if (useInitial || !month || !div || !chart || !initial) {
      return
    }

    const controller =
      new AbortController()

    setLoading(true)
    setError(null)

    getCostMonitoringDetailTransactions(
      toApiMonth(month),
      { div, chart },
      simuWeek,
      { date, page, size },
      controller.signal,
    )
      .then((response) => {
        setFetched(response)
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(toErrorMessage(err, getMessages().costDetail.loadFailed))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
    // initial đổi (refresh / đổi khung) → tải lại trang đang xem
  }, [useInitial, month, div, chart, simuWeek, date, page, size, initial])

  return {
    data: useInitial ? initial : fetched,
    loading: useInitial ? false : loading,
    error: useInitial ? null : error,
  }
}


export function useCostMonitoring() {
  const [months, setMonths] =
    useState<string[]>([])

  // dạng "2026.10" như API /months trả về
  const [month, setMonth] =
    useState<string | null>(null)

  const [simuWeek, setSimuWeek] =
    useState<CostSimuWeek>('')

  const [data, setData] =
    useState<CostMonitoringChartResponse | null>(null)

  // null = chưa tải / lỗi → dropdown không khóa tuần nào
  const [plWeeks, setPlWeeks] =
    useState<CostPlWeeksResponse | null>(null)

  // đổi tháng → bỏ danh sách tuần của tháng cũ ngay (tránh khóa nhầm tuần)
  const [plWeeksMonth, setPlWeeksMonth] =
    useState(month)
  if (plWeeksMonth !== month) {
    setPlWeeksMonth(month)
    setPlWeeks(null)
  }

  const [monthsLoading, setMonthsLoading] =
    useState(true)

  const [chartLoading, setChartLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null)

  const [refreshKey, setRefreshKey] =
    useState(0)

  const refresh =
    useCallback(() => {
      setRefreshKey(
        (value) => value + 1,
      )
    }, [])

  // refreshKey đã tải xong với refresh=true; khác refreshKey hiện tại = lượt này do nút ↻
  // (chỉ cập nhật khi tải thành công → request bị hủy giữa chừng thì lượt sau vẫn gửi refresh)
  const chartRefreshedKey =
    useRef(0)

  // ---------- months ----------
  useEffect(() => {
    const controller =
      new AbortController()

    async function load() {
      setMonthsLoading(true)
      setError(null)

      try {
        const response =
          await getCostMonitoringMonths(
            controller.signal,
          )

        setMonths(response)

        // giữ tháng đang chọn nếu còn trong danh sách, không thì lấy mới nhất
        setMonth((current) =>
          current && response.includes(current)
            ? current
            : response[0] ?? null,
        )
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            toErrorMessage(err, getMessages().cost.monthsLoadFailed),
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setMonthsLoading(false)
        }
      }
    }

    void load()

    return () => {
      controller.abort()
    }
  }, [refreshKey])

  // ---------- tuần PL simulation có số (không chặn chart; lỗi → null = chưa biết) ----------
  useEffect(() => {
    if (!month) {
      return
    }

    const controller =
      new AbortController()

    getCostMonitoringPlWeeks(toApiMonth(month), controller.signal)
      .then((response) => {
        setPlWeeks(response)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPlWeeks(null)
        }
      })

    return () => {
      controller.abort()
    }
  }, [month, refreshKey])

  // ---------- chart ----------
  useEffect(() => {
    if (!month) {
      return
    }

    const controller =
      new AbortController()

    const forceRefresh =
      refreshKey !== chartRefreshedKey.current

    async function load(selectedMonth: string) {
      setChartLoading(true)
      setError(null)

      try {
        const response =
          await getCostMonitoringChart(
            toApiMonth(selectedMonth),
            simuWeek,
            controller.signal,
            forceRefresh,
          )

        chartRefreshedKey.current = refreshKey
        setData(response)
        setLastUpdated(new Date())
      } catch (err) {
        if (!controller.signal.aborted) {
          setData(null)
          setError(
            toErrorMessage(err, getMessages().cost.chartLoadFailed),
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setChartLoading(false)
        }
      }
    }

    void load(month)

    return () => {
      controller.abort()
    }
  }, [month, simuWeek, refreshKey])

  return {
    months,
    month,
    setMonth,
    simuWeek,
    setSimuWeek,
    plWeeks,
    data,
    loading: monthsLoading || chartLoading,
    error,
    lastUpdated,
    refresh,
    // cho drawer detail tải lại cùng nút Refresh
    refreshKey,
  }
}

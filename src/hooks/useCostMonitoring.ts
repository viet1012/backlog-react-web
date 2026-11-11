import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type {
  CostDetailResponse,
  CostDetailTarget,
  CostDetailTransactionPage,
  CostDetailTxQuery,
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
import { useCachedQuery } from './useCachedQuery'

const EMPTY_MONTHS: string[] = []


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


// Cache theo phiên (useCachedQuery): quay lại trang / tháng / tuần vừa xem => hiện ngay,
// tải lại ngầm nếu đã cũ. Nút ↻ (refreshKey) bỏ qua cache và gửi refresh=true cho chart.
export function useCostMonitoring() {
  // tháng người dùng chọn (dạng "2026.10" như API /months trả về); null = mới nhất
  const [selectedMonth, setMonth] =
    useState<string | null>(null)

  const [simuWeek, setSimuWeek] =
    useState<CostSimuWeek>('')

  const [refreshKey, setRefreshKey] =
    useState(0)

  const refresh =
    useCallback(() => {
      setRefreshKey(
        (value) => value + 1,
      )
    }, [])

  // ---------- months ----------
  const monthsQuery = useCachedQuery(
    'cost:months',
    (signal) => getCostMonitoringMonths(signal),
    {
      refreshKey,
      fallbackError: () => getMessages().cost.monthsLoadFailed,
    },
  )

  const months = monthsQuery.data ?? EMPTY_MONTHS

  // giữ tháng đang chọn nếu còn trong danh sách, không thì lấy mới nhất
  const month =
    selectedMonth && months.includes(selectedMonth)
      ? selectedMonth
      : months[0] ?? null

  // ---------- tuần PL simulation có số (không chặn chart; lỗi → null = chưa biết) ----------
  const plWeeksQuery = useCachedQuery(
    month ? `cost:pl-weeks:${month}` : null,
    (signal) => getCostMonitoringPlWeeks(toApiMonth(month!), signal),
    { refreshKey },
  )

  // đổi tháng → không dùng danh sách tuần của tháng cũ (tránh khóa nhầm tuần)
  const plWeeks: CostPlWeeksResponse | null =
    plWeeksQuery.stale || plWeeksQuery.error
      ? null
      : plWeeksQuery.data

  // ---------- chart ----------
  const chartQuery = useCachedQuery(
    month ? `cost:chart:${month}|${simuWeek}` : null,
    (signal, force) => getCostMonitoringChart(
      toApiMonth(month!),
      simuWeek,
      signal,
      force,
    ),
    {
      refreshKey,
      fallbackError: () => getMessages().cost.chartLoadFailed,
    },
  )

  const lastUpdated = useMemo(
    () => (chartQuery.updatedAt == null ? null : new Date(chartQuery.updatedAt)),
    [chartQuery.updatedAt],
  )

  return {
    months,
    month,
    setMonth,
    simuWeek,
    setSimuWeek,
    plWeeks,
    // lỗi chart → không hiện chart của tháng / tuần khác
    data: chartQuery.error ? null : chartQuery.data,
    loading: monthsQuery.loading || chartQuery.loading,
    error: monthsQuery.error ?? chartQuery.error,
    lastUpdated,
    refresh,
    // cho drawer detail tải lại cùng nút Refresh
    refreshKey,
  }
}

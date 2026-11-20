import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type {
  CostDetailResponse,
  CostDetailTarget,
  CostDetailTransactionPage,
  CostPlWeeksResponse,
  CostSimuWeek,
} from '../types/costMonitoring'
import {
  getCostMonitoringChart,
  getCostMonitoringDetail,
  getCostTransactionFacets,
  getCostTransactionsPage,
  getCostMonitoringMonths,
  getCostMonitoringPlWeeks,
  toApiMonth,
  type CostTxFacetColumn,
  type CostTxFacets,
  type CostTxServerQuery,
} from '../services/costMonitoringService'
import dayjs from 'dayjs'
import { getMessages } from '../i18n/i18nContext'
import { clearQueryCache, readQueryCache } from '../utils/queryCache'
import { isQueryInFlight, prefetchQuery, useCachedQuery } from './useCachedQuery'

const EMPTY_MONTHS: string[] = []


function toErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}


// ---------- detail 1 khung – cache theo phiên (useCachedQuery) ----------
// Quay lại khung vừa xem → hiện ngay; còn mới (< 2 phút) thì không gọi lại API.
const DETAIL_CACHE_PREFIX = 'costDetail|'
const DETAIL_FRESH_MS = 2 * 60_000

function detailKey(month: string, target: CostDetailTarget, simuWeek: CostSimuWeek, dataVersion: number) {
  return `${DETAIL_CACHE_PREFIX}${month}|${target.div}|${target.chart}|${simuWeek}|v${dataVersion}`
}

function loadDetail(
  month: string,
  target: CostDetailTarget,
  simuWeek: CostSimuWeek,
  signal: AbortSignal,
  force: boolean,
) {
  // trang giao dịch đầu (cả kỳ) đi kèm luôn → không gọi API lần 2 khi vừa mở
  return getCostMonitoringDetail(
    toApiMonth(month),
    target,
    simuWeek,
    { date: null, page: 0, size: COST_TX_DEFAULT_PAGE_SIZE },
    signal,
    force,
  )
}

/** Tải trước detail 1 khung vào cache (rê chuột lên chart / ô chọn khung) */
export function prefetchCostDetail(
  month: string | null,
  target: CostDetailTarget,
  simuWeek: CostSimuWeek,
  dataVersion = 0,
) {
  if (!month) return

  // Đang có request detail chạy (khung đang mở hoặc prefetch trước) → không bắn thêm.
  // Trước đây lướt chuột qua 9 chart bắn ~9 request cùng lúc → request của khung
  // thật sự mở phải xếp hàng sau (trình duyệt ~6 kết nối / server, BE xử lý nặng).
  if (isQueryInFlight(DETAIL_CACHE_PREFIX)) return

  prefetchQuery(
    detailKey(month, target, simuWeek, dataVersion),
    (signal) => loadDetail(month, target, simuWeek, signal, false),
    DETAIL_FRESH_MS,
  )
}

// Đổi khung liên tục (phím mũi tên) → chỉ gọi API cho khung dừng lại ≥ delay ms.
// Khung đã có cache thì đổi ngay. (useCachedQuery không hủy request nên phải chặn từ đầu.)
function useSettledKey(key: string | null, delay = 250) {
  const [settled, setSettled] = useState(key)
  const immediate = key === null || readQueryCache(key) !== undefined

  useEffect(() => {
    if (immediate || key === settled) return
    const timer = window.setTimeout(() => setSettled(key), delay)
    return () => window.clearTimeout(timer)
  }, [key, settled, immediate, delay])

  return immediate ? key : settled
}

export function useCostMonitoringDetail(
  // dạng "2026.10"
  month: string | null,
  target: CostDetailTarget | null,
  simuWeek: CostSimuWeek,
  refreshKey = 0,
  // đang xem chi tiết; đóng thì không tải
  open = true,
  // tăng khi dữ liệu nguồn đổi (nạp OT) → key mới, tải lại (không gửi refresh=true)
  dataVersion = 0,
) {
  // Chỉ nút ↻ bấm lúc đang xem chi tiết mới gửi refresh=true cho detail.
  // Bấm ↻ lúc đóng: chart đã refresh → bỏ cache detail, lần mở sau tải thường.
  const [seenRefresh, setSeenRefresh] = useState(refreshKey)
  const [detailRefresh, setDetailRefresh] = useState(0)
  if (seenRefresh !== refreshKey) {
    setSeenRefresh(refreshKey)
    if (open) setDetailRefresh((n) => n + 1)
    else clearQueryCache(DETAIL_CACHE_PREFIX)
  }

  const wantedKey = open && month && target ? detailKey(month, target, simuWeek, dataVersion) : null
  const key = useSettledKey(wantedKey)

  const query = useCachedQuery<CostDetailResponse>(
    key,
    (signal, force) => loadDetail(month!, target!, simuWeek, signal, force),
    {
      refreshKey: detailRefresh,
      freshMs: DETAIL_FRESH_MS,
      fallbackError: () => getMessages().costDetail.loadFailed,
    },
  )

  // dữ liệu của khung khác (đang tải / đang chờ khung mới) → không hiện để tránh nhầm số
  const waiting = key !== wantedKey
  return {
    data: query.stale || waiting ? null : query.data,
    loading: query.loading || waiting,
    error: waiting ? null : query.error,
  }
}


// số dòng / trang mặc định = mặc định của BE
export const COST_TX_DEFAULT_PAGE_SIZE = 50

// ---------- trang giao dịch (BE: tìm / lọc / sắp xếp / phân trang – /detail/transactions) ----------
// query null = mặc định (không tìm / lọc / sắp xếp, trang đầu, số dòng mặc định) → dùng luôn initial
// (trang đầu đi kèm /detail), không gọi API.
// Đổi query: giữ trang đang hiện (FE làm mờ) trong lúc tải; request cũ bị hủy.
interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useCostTransactionsPage(
  target: CostDetailTarget,
  query: CostTxServerQuery | null,
  page: number,
  size: number,
  initial: CostDetailTransactionPage,
) {
  const [state, setState] = useState<FetchState<CostDetailTransactionPage>>({ data: null, loading: false, error: null })

  // query là object mới mỗi render → so theo nội dung
  const key = query ? JSON.stringify([target.div, target.chart, query, page, size]) : null

  useEffect(() => {
    if (key === null || query === null) return

    const controller = new AbortController()

    // oxlint-disable-next-line react/set-state-in-effect
    setState((prev) => ({ ...prev, loading: true, error: null }))

    getCostTransactionsPage(target, query, page, size, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setState((prev) => ({ ...prev, loading: false, error: toErrorMessage(err, getMessages().costDetail.loadFailed) }))
        }
      })

    return () => controller.abort()
    // key gói đủ target / query / page / size; initial đổi (refresh) → tải lại trang đang xem
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [key, initial])

  if (query === null) {
    return { data: initial, loading: false, error: null }
  }

  return { data: state.data ?? initial, loading: state.loading, error: state.error }
}


// ---------- giá trị dropdown lọc 1 cột (BE: /detail/transactions/facets) ----------
// column null = dropdown đang đóng → không gọi API
export function useCostTransactionFacets(
  target: CostDetailTarget,
  query: CostTxServerQuery,
  column: CostTxFacetColumn | null,
) {
  const [state, setState] = useState<FetchState<CostTxFacets> & { key: string | null }>(
    { key: null, data: null, loading: false, error: null },
  )

  const key = column ? JSON.stringify([target.div, target.chart, column, { ...query, sort: null }]) : null

  useEffect(() => {
    if (key === null || column === null) return

    const controller = new AbortController()

    // oxlint-disable-next-line react/set-state-in-effect
    setState({ key, data: null, loading: true, error: null })

    getCostTransactionFacets(target, query, column, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ key, data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setState({ key, data: null, loading: false, error: toErrorMessage(err, getMessages().costDetail.loadFailed) })
        }
      })

    return () => controller.abort()
    // key gói đủ target / query / column
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return state.key === key ? state : { key, data: null, loading: key !== null, error: null }
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

  // dữ liệu nguồn đổi (vd vừa nạp OT; BE đã xóa cache): tải lại /chart như bình thường,
  // KHÔNG gửi refresh=true. Đổi version trong key → bỏ qua cache FE, giữ chart cũ trong lúc tải.
  const [dataVersion, setDataVersion] =
    useState(0)

  const reloadData =
    useCallback(() => {
      clearQueryCache('cost:chart:')
      setDataVersion((value) => value + 1)
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
  const chartKey = (value: string) => `cost:chart:${value}|${simuWeek}|${dataVersion}`

  const chartQuery = useCachedQuery(
    month ? chartKey(month) : null,
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

  // ---------- tải trước chart tháng hiện tại, song song với /months ----------
  // Trước đây: chờ /months xong mới biết tháng mới nhất rồi mới gọi /chart (2 lượt nối tiếp).
  // Thường tháng mới nhất chính là tháng hiện tại => gọi luôn /chart tháng này cùng lúc với
  // /months, cùng key cache với chartQuery. /months về mà đúng tháng này thì chartQuery dùng
  // lại request đang chạy / kết quả đã có. Khác tháng thì chỉ tốn 1 request, giao diện
  // không đổi (tháng hiển thị vẫn do /months quyết định như cũ).
  const [guessMonth] = useState(() => dayjs().format('YYYY.MM'))
  const monthsKnown = monthsQuery.data !== null || monthsQuery.error !== null

  useCachedQuery(
    !monthsKnown && selectedMonth === null ? chartKey(guessMonth) : null,
    (signal) => getCostMonitoringChart(toApiMonth(guessMonth), simuWeek, signal),
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
    reloadData,
    // cho drawer detail tải lại (không refresh=true) sau khi dữ liệu nguồn đổi
    dataVersion,
  }
}

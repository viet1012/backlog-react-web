import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  getFacConfirm,
  getFacConfirmConfirmedProcesses,
  getFacConfirmProcessGroups,
  searchFacConfirm,
} from '../services/facConfirmService'

import {
  getFacConfirmProcessIdentityByBackendName,
} from '../config/facConfirmProcessConfig'

import type {
  FacConfirmConfirmedProcess,
  FacConfirmDataScope,
  FacConfirmFilterItem,
  FacConfirmProcessGroup,
  FacConfirmProcessGroupSummary,
  FacConfirmRow,
} from '../types/facConfirm'

interface UseFacConfirmDataParams
  extends FacConfirmDataScope {
  page: number
  pageSize: number
  excelFilters: FacConfirmFilterItem[]
  search: string
}

// =========================================================
// CACHE TẠM THEO BỘ LỌC
//
// Quay lại bộ lọc vừa xem => hiện ngay từ cache, rồi tải lại ngầm.
// Tối đa CACHE_MAX_ENTRIES mục, sống CACHE_TTL_MS.
// Lưu xong / Làm mới => clearFacConfirmCache().
// =========================================================

interface FacConfirmCacheEntry {
  storedAt: number
  procGrp: FacConfirmProcessGroup
  rows: FacConfirmRow[]
  confirmedProcesses: FacConfirmConfirmedProcess[]
  totalElements: number
}

const CACHE_MAX_ENTRIES = 10
const CACHE_TTL_MS = 60_000

const facConfirmCache = new Map<string, FacConfirmCacheEntry>()

function readCache(key: string): FacConfirmCacheEntry | null {
  const entry = facConfirmCache.get(key)

  if (!entry) {
    return null
  }

  if (Date.now() - entry.storedAt > CACHE_TTL_MS) {
    facConfirmCache.delete(key)
    return null
  }

  return entry
}

function writeCache(key: string, entry: FacConfirmCacheEntry): void {
  // Map giữ thứ tự chèn => xóa rồi chèn lại để mục mới nhất ở cuối
  facConfirmCache.delete(key)
  facConfirmCache.set(key, entry)

  while (facConfirmCache.size > CACHE_MAX_ENTRIES) {
    const oldestKey = facConfirmCache.keys().next().value

    if (oldestKey === undefined) {
      break
    }

    facConfirmCache.delete(oldestKey)
  }
}

export function clearFacConfirmCache(): void {
  facConfirmCache.clear()
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    && error.name === 'AbortError'
}

function getCurrentPageAufnrs(rows: FacConfirmRow[]): string[] {
  return [...new Set(
    rows
      .map((row) => row.aufnr?.trim())
      .filter((aufnr): aufnr is string => Boolean(aufnr)),
  )]
}

function mergeConfirmedProcesses(
  rows: FacConfirmRow[],
  confirmedProcesses: FacConfirmConfirmedProcess[],
): FacConfirmRow[] {
  if (rows.length === 0 || confirmedProcesses.length === 0) {
    return rows
  }

  const confirmedByAufnr = new Map<
    string,
    FacConfirmConfirmedProcess[]
  >()

  confirmedProcesses.forEach((item) => {
    const aufnr = item.aufnr?.trim()

    if (!aufnr) {
      return
    }

    const records = confirmedByAufnr.get(aufnr) ?? []
    records.push(item)
    confirmedByAufnr.set(aufnr, records)
  })

  return rows.map((row) => {
    const confirmed = confirmedByAufnr.get(row.aufnr?.trim())

    if (!confirmed?.length) {
      return row
    }

    const displayRow = { ...row }

    confirmed.forEach((item) => {
      if (!item.confirmFnTime) {
        return
      }

      const identity = getFacConfirmProcessIdentityByBackendName(
        item.processGrp,
      )

      displayRow[identity.field] = item.confirmFnTime
    })

    return displayRow
  })
}

export function useFacConfirmData({
  div,
  expD,
  procGrp,
  classify,
  heatType,
  page,
  pageSize,
  excelFilters,
  search,
}: UseFacConfirmDataParams) {
  const [rows, setRows] = useState<FacConfirmRow[]>([])
  const [confirmedProcesses, setConfirmedProcesses] = useState<
    FacConfirmConfirmedProcess[]
  >([])
  const [processGroups, setProcessGroups] = useState<
    FacConfirmProcessGroupSummary[]
  >([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Bộ lọc của dữ liệu đang hiển thị (khác requestKey => đang hiện dữ liệu cũ)
  const [loaded, setLoaded] = useState<{
    key: string
    procGrp: FacConfirmProcessGroup
  } | null>(null)

  const requestKey = useMemo(
    () => JSON.stringify({
      div,
      expD,
      procGrp,
      classify: classify ?? null,
      heatType,
      search: search.trim(),
      excelFilters,
      page,
      pageSize,
    }),
    [
      classify,
      div,
      excelFilters,
      expD,
      heatType,
      page,
      pageSize,
      procGrp,
      search,
    ],
  )

  const tableRequestRef = useRef<AbortController | null>(null)
  const summaryRequestRef = useRef<AbortController | null>(null)

  const displayRows = useMemo(
    () => mergeConfirmedProcesses(rows, confirmedProcesses),
    [confirmedProcesses, rows],
  )

  const loadData = useCallback(async () => {
    tableRequestRef.current?.abort()

    const controller = new AbortController()
    tableRequestRef.current = controller
    setLoading(true)
    setError(null)

    // Có cache => hiện ngay, vẫn tải lại ngầm bên dưới
    const cached = readCache(requestKey)

    if (cached) {
      setRows(cached.rows)
      setConfirmedProcesses(cached.confirmedProcesses)
      setTotalElements(cached.totalElements)
      setLoaded({ key: requestKey, procGrp: cached.procGrp })
    }

    try {
      const request = {
        div,
        expD,
        procGrp,
        classify,
        heatType,
        page,
        size: pageSize,
      }

      const trimmedSearch = search.trim()

      const result = excelFilters.length > 0 || trimmedSearch
        ? await searchFacConfirm(
          {
            ...request,
            filters: excelFilters,
            logicOperator: 'and',
            search: trimmedSearch || undefined,
          },
          controller.signal,
        )
        : await getFacConfirm(
          request,
          controller.signal,
        )

      if (
        controller.signal.aborted
        || tableRequestRef.current !== controller
      ) {
        return
      }

      const aufnrs = getCurrentPageAufnrs(result.content)
      let confirmed: FacConfirmConfirmedProcess[] = []

      if (aufnrs.length > 0) {
        try {
          confirmed = await getFacConfirmConfirmedProcesses(
            aufnrs,
            controller.signal,
          )
        } catch (confirmedError) {
          if (
            isAbortError(confirmedError)
            || controller.signal.aborted
            || tableRequestRef.current !== controller
          ) {
            return
          }

          console.error(
            'Load Fac Confirm confirmed processes failed:',
            confirmedError,
          )
        }
      }

      if (
        controller.signal.aborted
        || tableRequestRef.current !== controller
      ) {
        return
      }

      setRows(result.content)
      setConfirmedProcesses(confirmed)
      setTotalElements(result.totalElements)
      setLoaded({ key: requestKey, procGrp })
      setLastUpdated(new Date())

      writeCache(requestKey, {
        storedAt: Date.now(),
        procGrp,
        rows: result.content,
        confirmedProcesses: confirmed,
        totalElements: result.totalElements,
      })
    } catch (requestError) {
      if (
        isAbortError(requestError)
        || tableRequestRef.current !== controller
      ) {
        return
      }

      console.error('Load Fac Confirm failed:', requestError)

      // Giữ dữ liệu cũ (nếu có), chỉ báo lỗi
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load Fac Confirm',
      )
    } finally {
      if (tableRequestRef.current === controller) {
        tableRequestRef.current = null
        setLoading(false)
      }
    }
  }, [
    classify,
    div,
    excelFilters,
    expD,
    heatType,
    page,
    pageSize,
    procGrp,
    requestKey,
    search,
  ])

  const loadProcessGroups = useCallback(async () => {
    summaryRequestRef.current?.abort()

    const controller = new AbortController()
    summaryRequestRef.current = controller
    setSummaryLoading(true)

    try {
      const result = await getFacConfirmProcessGroups(
        {
          div,
          expD,
          classify,
          heatType,
          filters: excelFilters,
          logicOperator: 'and',
        },
        controller.signal,
      )

      if (
        controller.signal.aborted
        || summaryRequestRef.current !== controller
      ) {
        return
      }

      setProcessGroups(result)
    } catch (requestError) {
      if (
        isAbortError(requestError)
        || summaryRequestRef.current !== controller
      ) {
        return
      }

      console.error('Load process groups failed:', requestError)
    } finally {
      if (summaryRequestRef.current === controller) {
        summaryRequestRef.current = null
        setSummaryLoading(false)
      }
    }
  }, [
    classify,
    div,
    excelFilters,
    expD,
    heatType,
  ])

  useEffect(() => {
    let active = true

    queueMicrotask(() => {
      if (active) {
        void loadData()
      }
    })

    return () => {
      active = false
      tableRequestRef.current?.abort()
    }
  }, [loadData])

  useEffect(() => {
    let active = true

    queueMicrotask(() => {
      if (active) {
        void loadProcessGroups()
      }
    })

    return () => {
      active = false
      summaryRequestRef.current?.abort()
    }
  }, [loadProcessGroups])

  // Làm mới / sau khi lưu: bỏ cache để không hiện dữ liệu cũ
  const handleRefresh = useCallback(() => {
    clearFacConfirmCache()
    void loadData()
    void loadProcessGroups()
  }, [loadData, loadProcessGroups])

  return {
    rows: displayRows,
    confirmedProcesses,
    processGroups,
    totalElements,
    loading,

    // Lần tải đầu, chưa có dữ liệu nào => skeleton
    initialLoading: loading && loaded == null,

    // Đang hiện dữ liệu của bộ lọc trước, chờ dữ liệu mới
    stale: loaded != null && loaded.key !== requestKey,

    // Công đoạn của dữ liệu đang hiển thị (đổi khi dữ liệu mới về)
    loadedProcGrp: loaded?.procGrp ?? null,

    summaryLoading,
    error,
    lastUpdated,
    handleRefresh,
  }
}

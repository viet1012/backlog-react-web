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
  FacConfirmFilterItem,
  FacConfirmProcessGroup,
  FacConfirmProcessGroupSummary,
  FacConfirmRow,
} from '../types/facConfirm'

interface UseFacConfirmDataParams {
  div: string
  expD: string
  procGrp: FacConfirmProcessGroup
  page: number
  pageSize: number
  excelFilters: FacConfirmFilterItem[]
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
  page,
  pageSize,
  excelFilters,
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
  const [processGroupsLoading, setProcessGroupsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

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
    let mainResultLoaded = false

    setLoading(true)
    setError(null)

    try {
      const request = {
        div,
        expD,
        procGrp,
        page,
        size: pageSize,
      }

      const result = excelFilters.length > 0
        ? await searchFacConfirm({
          ...request,
          filters: excelFilters,
          logicOperator: 'and',
        }, controller.signal)
        : await getFacConfirm(request, controller.signal)

      mainResultLoaded = true

      const aufnrs = getCurrentPageAufnrs(result.content)
      const confirmed = aufnrs.length > 0
        ? await getFacConfirmConfirmedProcesses(
          aufnrs,
          controller.signal,
        )
        : []

      if (
        controller.signal.aborted
        || tableRequestRef.current !== controller
      ) {
        return
      }

      setRows(result.content)
      setConfirmedProcesses(confirmed)
      setTotalElements(result.totalElements)
      setLastUpdated(new Date())
    } catch (requestError) {
      if (
        isAbortError(requestError)
        || tableRequestRef.current !== controller
      ) {
        return
      }

      console.error('Load Fac Confirm failed:', requestError)

      if (mainResultLoaded) {
        setRows([])
        setConfirmedProcesses([])
        setTotalElements(0)
      }

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
  }, [div, excelFilters, expD, page, pageSize, procGrp])

  const loadProcessGroups = useCallback(async () => {
    summaryRequestRef.current?.abort()

    const controller = new AbortController()
    summaryRequestRef.current = controller
    setProcessGroupsLoading(true)

    try {
      const result = await getFacConfirmProcessGroups(
        div,
        expD,
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
        setProcessGroupsLoading(false)
      }
    }
  }, [div, expD])

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

  const handleRefresh = useCallback(() => {
    void loadData()
    void loadProcessGroups()
  }, [loadData, loadProcessGroups])

  return {
    rows: displayRows,
    confirmedProcesses,
    processGroups,
    totalElements,
    loading,
    processGroupsLoading,
    error,
    lastUpdated,
    handleRefresh,
  }
}

import { useCallback, useEffect, useState } from 'react'
import { getFacConfirm, getFacConfirmProcessGroups, searchFacConfirm } from '../services/facConfirmService'
import type {
  FacConfirmFilterItem, FacConfirmProcessGroup, FacConfirmProcessGroupSummary, FacConfirmRow,
} from '../types/facConfirm'

interface UseFacConfirmDataParams {
  div: string
  expD: string
  procGrp: FacConfirmProcessGroup
  page: number
  pageSize: number
  excelFilters: FacConfirmFilterItem[]
}

export function useFacConfirmData(params: UseFacConfirmDataParams) {
  const { div, expD, procGrp, page, pageSize, excelFilters } = params
  const [rows, setRows] = useState<FacConfirmRow[]>([])
  const [processGroups, setProcessGroups] = useState<FacConfirmProcessGroupSummary[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [processGroupsLoading, setProcessGroupsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const request = { div, expD, procGrp, page, size: pageSize }
      const result = excelFilters.length > 0
        ? await searchFacConfirm({ ...request, filters: excelFilters, logicOperator: 'and' }, signal)
        : await getFacConfirm(request, signal)
      setRows(result.content)
      setTotalElements(result.totalElements)
      setLastUpdated(new Date())
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') return
      setError(requestError instanceof Error ? requestError.message : 'Failed to load Fac Confirm')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [div, excelFilters, expD, page, pageSize, procGrp])

  const loadProcessGroups = useCallback(async (signal?: AbortSignal) => {
    setProcessGroupsLoading(true)
    try {
      setProcessGroups(await getFacConfirmProcessGroups(div, expD, signal))
    } catch (requestError) {
      if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) {
        console.error('Load process groups failed:', requestError)
      }
    } finally {
      if (!signal?.aborted) setProcessGroupsLoading(false)
    }
  }, [div, expD])

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => {
      if (!controller.signal.aborted) void loadData(controller.signal)
    })
    return () => controller.abort()
  }, [loadData])

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => {
      if (!controller.signal.aborted) void loadProcessGroups(controller.signal)
    })
    return () => controller.abort()
  }, [loadProcessGroups])

  const handleRefresh = useCallback(() => {
    void loadData()
    void loadProcessGroups()
  }, [loadData, loadProcessGroups])

  return {
    rows, processGroups, totalElements, loading, processGroupsLoading,
    error, lastUpdated, handleRefresh,
  }
}

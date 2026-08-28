import { useCallback, useEffect, useState } from 'react'
import type { GridSortModel } from '@mui/x-data-grid'
import { isExcelFilterField } from '../config/backlogFilterFields'
import { searchReports, type BacklogFilterItem, type ReportFilters } from '../services/reportService'
import type { ProductionOrder } from '../types/report'

interface UseBacklogDataParams {
  page: number
  pageSize: number
  filters: ReportFilters
  excelFilters: BacklogFilterItem[]
  sortModel: GridSortModel
}

function createTopFilters(filters: ReportFilters): BacklogFilterItem[] {
  const items: BacklogFilterItem[] = []
  const search = filters.search.trim()
  if (search) items.push({ field: 'VBELN', operator: 'contains', value: search })
  if (filters.status) items.push({ field: 'Status', operator: 'equals', value: filters.status })
  if (filters.div) items.push({ field: 'Div', operator: 'equals', value: filters.div })
  if (filters.currentProcess) items.push({ field: 'CurrentProcess', operator: 'equals', value: filters.currentProcess })
  if (filters.shipBy) items.push({ field: 'ShipBy', operator: 'equals', value: filters.shipBy })
  if (filters.productionDate) items.push({ field: 'ProductionD', operator: 'is', value: filters.productionDate })
  return items
}

export function useBacklogData({ page, pageSize, filters, excelFilters, sortModel }: UseBacklogDataParams) {
  const [data, setData] = useState<ProductionOrder[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    async function loadReports() {
      setLoading(true)
      setError(null)
      try {
        const activeSort = sortModel[0]
        const response = await searchReports(
          page,
          pageSize,
          { filters: [...excelFilters, ...createTopFilters(filters)], logicOperator: 'and' },
          controller.signal,
          activeSort?.sort && isExcelFilterField(activeSort.field)
            ? { field: activeSort.field, direction: activeSort.sort }
            : undefined,
        )
        setData(response.content)
        setTotalElements(response.totalElements)
        setLastUpdated(new Date())
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setData([])
          setTotalElements(0)
          setError(requestError instanceof Error ? requestError.message : 'Unable to load production backlog')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void loadReports()
    return () => controller.abort()
  }, [excelFilters, filters, page, pageSize, refreshKey, sortModel])

  const handleRefresh = useCallback(() => setRefreshKey((value) => value + 1), [])
  return { data, totalElements, loading, error, lastUpdated, handleRefresh }
}

import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import type {
  GridSortModel,
} from '@mui/x-data-grid'

import {
  isExcelFilterField,
} from '../config/backlogFilterFields'

import {
  getBacklogStatusSummary,
  searchReports,
  type BacklogFilterItem,
  type BacklogStatusSummary,
  type ReportFilters,
} from '../services/reportService'

import type {
  ProductionOrder,
} from '../types/report'


interface UseBacklogDataParams {
  page: number
  pageSize: number
  filters: ReportFilters
  excelFilters: BacklogFilterItem[]
  sortModel: GridSortModel
}


// =========================================================
// TOP FILTERS
// =========================================================

function createTopFilters(
  filters: ReportFilters,
): BacklogFilterItem[] {

  const items: BacklogFilterItem[] = []

  const search =
    filters.search.trim()

  if (search) {
    items.push({
      field: 'VBELN',
      operator: 'contains',
      value: search,
    })
  }

  if (filters.status) {
    items.push({
      field: 'Status',
      operator: 'equals',
      value: filters.status,
    })
  }

  if (filters.div) {
    items.push({
      field: 'Div',
      operator: 'equals',
      value: filters.div,
    })
  }

  if (filters.currentProcess) {
    items.push({
      field: 'CurrentProcess',
      operator: 'equals',
      value: filters.currentProcess,
    })
  }

  if (filters.shipBy) {
    items.push({
      field: 'ShipBy',
      operator: 'equals',
      value: filters.shipBy,
    })
  }

  if (filters.productionDate) {
    items.push({
      field: 'ProductionD',
      operator: 'is',
      value: filters.productionDate,
    })
  }

  return items
}


// =========================================================
// REMOVE STATUS FILTER FOR SUMMARY
// =========================================================

function removeStatusFilters(
  filters: BacklogFilterItem[],
): BacklogFilterItem[] {

  return filters.filter(
    (filter) =>
      filter.field
        .trim()
        .toLowerCase()
      !== 'status',
  )
}


// =========================================================
// HOOK
// =========================================================

export function useBacklogData({
  page,
  pageSize,
  filters,
  excelFilters,
  sortModel,
}: UseBacklogDataParams) {

  const [
    data,
    setData,
  ] = useState<ProductionOrder[]>([])

  const [
    totalElements,
    setTotalElements,
  ] = useState(0)

  const [
    summary,
    setSummary,
  ] = useState<BacklogStatusSummary | null>(
    null,
  )

  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  )

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState<Date | null>(
    null,
  )

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0)


  useEffect(() => {

    const controller =
      new AbortController()


    async function loadBacklog() {

      setLoading(true)
      setError(null)

      try {

        // ===================================================
        // ALL ACTIVE FILTERS
        // ===================================================

        const topFilters =
          createTopFilters(
            filters,
          )

        const allFilters = [
          ...excelFilters,
          ...topFilters,
        ]


        // ===================================================
        // DETAIL REQUEST
        // ===================================================

        const detailFilterRequest = {
          filters:
            allFilters,

          logicOperator:
            'and' as const,
        }


        // ===================================================
        // SUMMARY REQUEST
        //
        // bỏ Status để 4 status cards vẫn luôn hiển thị
        // ===================================================

        const summaryFilterRequest = {
          filters:
            removeStatusFilters(
              allFilters,
            ),

          logicOperator:
            'and' as const,
        }


        // ===================================================
        // SORT
        // ===================================================

        const activeSort =
          sortModel[0]

        const sortRequest =
          activeSort?.sort
            && isExcelFilterField(
              activeSort.field,
            )
            ? {
              field:
                activeSort.field,

              direction:
                activeSort.sort,
            }
            : undefined


        // ===================================================
        // LOAD DETAIL + SUMMARY
        // ===================================================

        const [
          detailResponse,
          summaryResponse,
        ] = await Promise.all([
          searchReports(
            page,
            pageSize,
            detailFilterRequest,
            controller.signal,
            sortRequest,
          ),

          getBacklogStatusSummary(
            summaryFilterRequest,
            controller.signal,
          ),
        ])


        if (
          controller.signal.aborted
        ) {
          return
        }


        // ===================================================
        // SET DATA
        // ===================================================

        setData(
          detailResponse.content,
        )

        setTotalElements(
          detailResponse.totalElements,
        )

        setSummary(
          summaryResponse,
        )

        setLastUpdated(
          new Date(),
        )

      } catch (requestError) {

        if (
          controller.signal.aborted
        ) {
          return
        }

        setData([])
        setTotalElements(0)
        setSummary(null)

        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to load production backlog',
        )

      } finally {

        if (
          !controller.signal.aborted
        ) {
          setLoading(false)
        }
      }
    }


    void loadBacklog()


    return () => {
      controller.abort()
    }

  }, [
    excelFilters,
    filters,
    page,
    pageSize,
    refreshKey,
    sortModel,
  ])


  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh =
    useCallback(
      () =>
        setRefreshKey(
          (value) =>
            value + 1,
        ),
      [],
    )


  return {
    data,
    totalElements,

    summary,

    loading,
    error,

    lastUpdated,

    handleRefresh,
  }
}
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
  searchReports,
  type BacklogFilterItem,
  type ReportFilters,
} from '../services/reportService'

import type {
  ProductionOrder,
} from '../types/report'

import {
  createBacklogFilters,
} from './backlogFilterUtils'


interface UseBacklogDataParams {
  page: number
  pageSize: number
  filters: ReportFilters
  excelFilters: BacklogFilterItem[]
  sortModel: GridSortModel
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

        const allFilters =
          createBacklogFilters(
            filters,
            excelFilters,
          )


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
        // LOAD DETAIL
        // ===================================================

        const detailResponse =
          await searchReports(
            page,
            pageSize,
            detailFilterRequest,
            controller.signal,
            sortRequest,
          )


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

    loading,
    error,

    lastUpdated,

    handleRefresh,
    refreshKey,
  }
}

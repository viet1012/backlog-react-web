import {
  useCallback,
  useMemo,
  useState,
} from 'react'

import type {
  GridSortModel,
} from '@mui/x-data-grid'

import {
  isExcelFilterField,
} from '../config/backlogFilterFields'
import { getMessages } from '../i18n/i18nContext'

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
import { useCachedQuery } from './useCachedQuery'


interface UseBacklogDataParams {
  page: number
  pageSize: number
  filters: ReportFilters
  excelFilters: BacklogFilterItem[]
  sortModel: GridSortModel
}

const EMPTY_ROWS: ProductionOrder[] = []


// =========================================================
// HOOK
//
// Cache theo trang / bộ lọc / sort (useCachedQuery):
// quay lại trang Backlog hoặc trang bảng vừa xem => hiện ngay, tải lại ngầm nếu đã cũ
// =========================================================

export function useBacklogData({
  page,
  pageSize,
  filters,
  excelFilters,
  sortModel,
}: UseBacklogDataParams) {

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0)


  // ===================================================
  // REQUEST
  // ===================================================

  const request =
    useMemo(
      () => {

        const activeSort =
          sortModel[0]

        return {
          filterRequest: {
            filters:
              createBacklogFilters(
                filters,
                excelFilters,
              ),

            logicOperator:
              'and' as const,
          },

          sortRequest:
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
              : undefined,

          search:
            filters.search,
        }
      },
      [
        excelFilters,
        filters,
        sortModel,
      ],
    )


  const query =
    useCachedQuery(
      `backlog:list:${JSON.stringify([page, pageSize, request])}`,
      (signal) =>
        searchReports(
          page,
          pageSize,
          request.filterRequest,
          signal,
          request.sortRequest,
          request.search,
        ),
      {
        refreshKey,
        fallbackError: () => getMessages().backlog.loadFailed,
      },
    )


  const lastUpdated =
    useMemo(
      () => (query.updatedAt == null
        ? null
        : new Date(query.updatedAt)),
      [query.updatedAt],
    )


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
    data:
      query.data?.content ?? EMPTY_ROWS,

    totalElements:
      query.data?.totalElements ?? 0,

    loading:
      query.loading,

    error:
      query.error,

    lastUpdated,

    handleRefresh,
    refreshKey,
  }
}

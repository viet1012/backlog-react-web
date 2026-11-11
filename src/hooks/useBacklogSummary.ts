import { useMemo } from 'react'
import {
  getBacklogStatusSummary,
  type BacklogFilterItem,
  type ReportFilters,
} from '../services/reportService'
import { createBacklogFilters, removeStatusFilters } from './backlogFilterUtils'
import { getMessages } from '../i18n/i18nContext'
import { useCachedQuery } from './useCachedQuery'

interface UseBacklogSummaryParams {
  filters: ReportFilters
  excelFilters: BacklogFilterItem[]
  refreshKey: number
}

export function useBacklogSummary({
  filters,
  excelFilters,
  refreshKey,
}: UseBacklogSummaryParams) {
  const { div, currentProcess, shipBy, productionDate } = filters

  const summaryFilters = useMemo(
    () => removeStatusFilters(createBacklogFilters({
      search: '',
      status: '',
      div,
      currentProcess,
      shipBy,
      productionDate,
    }, excelFilters)),
    [
      currentProcess,
      div,
      excelFilters,
      productionDate,
      shipBy,
    ],
  )

  // Summary has an independent lifecycle so its failure never clears table data.
  // Cached per filter: coming back to the page shows it right away.
  const query = useCachedQuery(
    `backlog:summary:${JSON.stringify([filters.search, summaryFilters])}`,
    (signal) => getBacklogStatusSummary(
      { filters: summaryFilters, logicOperator: 'and' },
      signal,
      filters.search,
    ),
    {
      refreshKey,
      fallbackError: () => getMessages().misc.backlogSummaryFailed,
    },
  )

  return {
    // lỗi => không hiện tổng hợp của bộ lọc khác
    summary: query.error ? null : query.data,
    loading: query.loading,
    error: query.error,
  }
}

import { useEffect, useMemo, useState } from 'react'
import {
  getBacklogStatusSummary,
  type BacklogFilterItem,
  type BacklogStatusSummary,
  type ReportFilters,
} from '../services/reportService'
import { createBacklogFilters, removeStatusFilters } from './backlogFilterUtils'

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
  const [summary, setSummary] = useState<BacklogStatusSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { search, div, currentProcess, shipBy, productionDate } = filters

  const summaryFilters = useMemo(
    () => removeStatusFilters(createBacklogFilters({
      search,
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
      search,
      shipBy,
    ],
  )

  useEffect(() => {
    const controller = new AbortController()

    // Summary has an independent lifecycle so its failure never clears table data.
    // oxlint-disable-next-line react/set-state-in-effect
    setLoading(true)
    setError(null)

    void getBacklogStatusSummary(
      { filters: summaryFilters, logicOperator: 'and' },
      controller.signal,
    )
      .then((response) => {
        if (!controller.signal.aborted) setSummary(response)
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return
        setSummary(null)
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to load backlog status summary',
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [refreshKey, summaryFilters])

  return { summary, loading, error }
}

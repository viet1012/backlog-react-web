import type { BacklogFilterItem, ReportFilters } from '../services/reportService'

export function createBacklogFilters(
  filters: ReportFilters,
  excelFilters: BacklogFilterItem[],
): BacklogFilterItem[] {
  const topFilters: BacklogFilterItem[] = []
  const search = filters.search.trim()

  if (search) topFilters.push({ field: 'VBELN', operator: 'contains', value: search })
  if (filters.status) topFilters.push({ field: 'Status', operator: 'equals', value: filters.status })
  if (filters.div) topFilters.push({ field: 'Div', operator: 'equals', value: filters.div })
  if (filters.currentProcess) {
    topFilters.push({ field: 'CurrentProcess', operator: 'equals', value: filters.currentProcess })
  }
  if (filters.shipBy) topFilters.push({ field: 'ShipBy', operator: 'equals', value: filters.shipBy })
  if (filters.productionDate) {
    topFilters.push({ field: 'ProductionD', operator: 'is', value: filters.productionDate })
  }

  return [...excelFilters, ...topFilters]
}

export function removeStatusFilters(filters: BacklogFilterItem[]) {
  return filters.filter(
    (filter) => filter.field.trim().toLowerCase() !== 'status',
  )
}

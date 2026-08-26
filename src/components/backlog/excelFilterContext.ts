import { createContext, useContext } from 'react'
import type { ExcelFilterField } from '../../config/backlogFilterFields'
import type { BacklogFilterItem } from '../../services/reportService'

export interface ExcelFilterContextValue {
  excelFilters: BacklogFilterItem[]
  onExcelFiltersChange: (filters: BacklogFilterItem[]) => void
  openFilter: (
    field: ExcelFilterField,
    label: string,
    anchorEl: HTMLElement,
  ) => void
}

export const ExcelFilterContext =
  createContext<ExcelFilterContextValue | null>(null)

export function useExcelColumnFilter() {
  const context = useContext(ExcelFilterContext)
  if (!context) {
    throw new Error(
      'Excel column filter must be rendered inside ExcelColumnFilterProvider',
    )
  }
  return context
}

export function useOptionalExcelColumnFilter() {
  return useContext(ExcelFilterContext)
}

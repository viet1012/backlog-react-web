import { createContext, useContext } from 'react'

export type ExcelFilterKind = 'text' | 'number' | 'date'

export interface ExcelFilterItem {
  field: string
  operator: string
  value?: string
  values?: string[]
}

export interface ExcelFilterOptionsRequest {
  field: string
  filters: ExcelFilterItem[]
  logicOperator: 'and' | 'or'
  search?: string
  limit?: number
}

export interface ExcelFilterContextValue {
  excelFilters: ExcelFilterItem[]
  onExcelFiltersChange: (filters: ExcelFilterItem[]) => void
  isFilterableField: (field: string) => boolean
  openFilter: (
    field: string,
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

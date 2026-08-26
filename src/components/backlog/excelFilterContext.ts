import type {
  GridFilterModel,
} from '@mui/x-data-grid'

import {
  createContext,
  useContext,
} from 'react'

import type {
  ExcelFilterField,
} from '../../config/backlogFilterFields'


// =========================================================
// CONTEXT TYPE
// =========================================================

export interface ExcelFilterContextValue {

  filterModel: GridFilterModel

  onFilterChange: (
    model: GridFilterModel,
  ) => void

  openFilter: (
    field: ExcelFilterField,
    label: string,
    anchorEl: HTMLElement,
  ) => void
}


// =========================================================
// CONTEXT
// =========================================================

export const ExcelFilterContext =
  createContext<
    ExcelFilterContextValue | null
  >(null)


// =========================================================
// HOOK
// =========================================================

export function useExcelColumnFilter() {

  const context =
    useContext(
      ExcelFilterContext,
    )

  if (!context) {
    throw new Error(
      'Excel column menu must be rendered inside ExcelColumnFilterProvider',
    )
  }

  return context
}
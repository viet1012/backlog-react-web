import { useCallback, useState } from 'react'
import type { GridColumnVisibilityModel } from '@mui/x-data-grid'
import {
  loadGridPreferences,
  saveGridPreferences,
  type GridPreferences,
} from '../utils/uiPreferences'

export function useGridPreferences(gridKey: string, defaultPageSize = 20) {
  const [preferences, setPreferences] = useState<GridPreferences>(() =>
    loadGridPreferences(gridKey, defaultPageSize),
  )

  const updatePreferences = useCallback((
    update: (current: GridPreferences) => GridPreferences,
  ) => {
    setPreferences((current) => {
      const next = update(current)
      saveGridPreferences(gridKey, next)
      return next
    })
  }, [gridKey])

  const setColumnVisibilityModel = useCallback((model: GridColumnVisibilityModel) => {
    updatePreferences((current) => ({ ...current, columnVisibilityModel: model }))
  }, [updatePreferences])

  const setColumnOrder = useCallback((columnOrder: string[]) => {
    updatePreferences((current) => ({ ...current, columnOrder }))
  }, [updatePreferences])

  const setColumnWidth = useCallback((field: string, width: number) => {
    if (!Number.isFinite(width) || width <= 0) return
    updatePreferences((current) => ({
      ...current,
      columnWidths: { ...current.columnWidths, [field]: width },
    }))
  }, [updatePreferences])

  const setPageSize = useCallback((pageSize: number) => {
    if (!Number.isInteger(pageSize) || pageSize <= 0) return
    updatePreferences((current) => ({ ...current, pageSize }))
  }, [updatePreferences])

  return {
    ...preferences,
    setColumnVisibilityModel,
    setColumnOrder,
    setColumnWidth,
    setPageSize,
  }
}

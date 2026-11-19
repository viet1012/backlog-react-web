import { useCallback, useState } from 'react'
import type { GridColumnVisibilityModel } from '@mui/x-data-grid'
import {
  loadGridDensity,
  loadGridPreferences,
  saveGridDensity,
  saveGridPreferences,
  type GridDensity,
  type GridPreferences,
} from '../utils/uiPreferences'
import { getCurrentEmployeeId } from '../services/authService'

const NO_PINNED: string[] = []

interface GridPreferenceOptions {
  /** Cột ghim mặc định (vd mã PO / Aufnr) khi người dùng chưa tự chỉnh */
  defaultPinned?: string[]
}

export function useGridPreferences(
  gridKey: string,
  defaultPageSize = 100,
  { defaultPinned = NO_PINNED }: GridPreferenceOptions = {},
) {
  const [preferences, setPreferences] = useState<GridPreferences>(() =>
    loadGridPreferences(gridKey, defaultPageSize),
  )

  // Mật độ dòng: nhớ theo người đăng nhập (máy dùng chung)
  const [userKey] = useState(() => getCurrentEmployeeId() ?? 'anonymous')
  const [density, setDensityState] = useState<GridDensity>(() => loadGridDensity(gridKey, userKey))

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

  const setDensity = useCallback((next: GridDensity) => {
    setDensityState(next)
    saveGridDensity(gridKey, userKey, next)
  }, [gridKey, userKey])

  const pinnedColumns = preferences.pinnedColumns ?? defaultPinned

  // Ghim / bỏ ghim 1 cột (từ menu tiêu đề cột)
  const togglePinnedColumn = useCallback((field: string) => {
    updatePreferences((current) => {
      const pinned = current.pinnedColumns ?? defaultPinned
      return {
        ...current,
        pinnedColumns: pinned.includes(field)
          ? pinned.filter((item) => item !== field)
          : [...pinned, field],
      }
    })
  }, [updatePreferences, defaultPinned])

  return {
    ...preferences,
    pinnedColumns,
    density,
    setColumnVisibilityModel,
    setColumnOrder,
    setColumnWidth,
    setPageSize,
    setDensity,
    togglePinnedColumn,
  }
}

import { createContext, useContext } from 'react'

/**
 * Ghim cột (bản Community của DataGrid không có sẵn): ReusableDataGrid cung cấp,
 * menu tiêu đề cột (ExcelColumnMenu) đọc để hiện mục "Ghim cột / Bỏ ghim".
 */
export interface GridPinContextValue {
  pinnedColumns: readonly string[]
  togglePinnedColumn: (field: string) => void
}

export const GridPinContext = createContext<GridPinContextValue | null>(null)

export function useGridPin(): GridPinContextValue | null {
  return useContext(GridPinContext)
}

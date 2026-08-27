import { useMemo } from 'react'
import {
  DataGrid,
  type GridColDef,
  type GridColumnOrderChangeParams,
  type GridColumnResizeParams,
  type GridColumnVisibilityModel,
  type GridEventListener,
  type GridPaginationModel,
  type GridRowIdGetter,
  type GridSlotsComponent,
  type GridSortModel,
  type GridValidRowModel,
} from '@mui/x-data-grid'
import { applyGridColumnPreferences } from '../../../utils/uiPreferences'
import { dataGridHeaderSx } from '../../../theme/dataGridHeaderStyles'

export interface ReusableDataGridProps<T extends GridValidRowModel> {
  rows: T[]
  columns: GridColDef<T>[]
  getRowId: GridRowIdGetter<T>
  loading: boolean
  page: number
  pageSize: number
  rowCount: number
  sortModel: GridSortModel
  columnVisibilityModel: GridColumnVisibilityModel
  columnOrder: string[]
  columnWidths: Record<string, number>
  onPaginationChange: (model: GridPaginationModel) => void
  onSortChange: (model: GridSortModel) => void
  onColumnVisibilityModelChange: (model: GridColumnVisibilityModel) => void
  onColumnOrderChange: (order: string[]) => void
  onColumnWidthChange: (field: string, width: number) => void
  pageSizeOptions?: number[]
  toolbar?: GridSlotsComponent['toolbar']
  columnMenu?: GridSlotsComponent['columnMenu']
  onColumnHeaderClick?: GridEventListener<'columnHeaderClick'>
  paginationMode?: 'client' | 'server'
  sortingMode?: 'client' | 'server'
}

export function ReusableDataGrid<T extends GridValidRowModel>({
  rows,
  columns,
  getRowId,
  loading,
  page,
  pageSize,
  rowCount,
  sortModel,
  columnVisibilityModel,
  columnOrder,
  columnWidths,
  onPaginationChange,
  onSortChange,
  onColumnVisibilityModelChange,
  onColumnOrderChange,
  onColumnWidthChange,
  pageSizeOptions = [20, 50, 100],
  toolbar,
  columnMenu,
  onColumnHeaderClick,
  paginationMode = 'server',
  sortingMode = 'server',
}: ReusableDataGridProps<T>) {
  const preferredColumns = useMemo(
    () => applyGridColumnPreferences(columns, columnOrder, columnWidths),
    [columnOrder, columnWidths, columns],
  )

  function handleColumnOrderChange(params: GridColumnOrderChangeParams) {
    const nextOrder = preferredColumns.map((column) => column.field)
    const [movedField] = nextOrder.splice(params.oldIndex, 1)
    if (!movedField) return
    nextOrder.splice(params.targetIndex, 0, movedField)
    onColumnOrderChange(nextOrder)
  }

  function handleColumnWidthChange(params: GridColumnResizeParams) {
    onColumnWidthChange(params.colDef.field, params.width)
  }

  return (
    <DataGrid<T>
      rows={rows}
      columns={preferredColumns}
      getRowId={getRowId}
      loading={loading}
      paginationMode={paginationMode}
      filterMode="server"
      sortingMode={sortingMode}
      sortModel={sortModel}
      onSortModelChange={onSortChange}
      rowCount={rowCount}
      paginationModel={{ page, pageSize }}
      onPaginationModelChange={onPaginationChange}
      pageSizeOptions={pageSizeOptions}
      columnVisibilityModel={columnVisibilityModel}
      onColumnVisibilityModelChange={onColumnVisibilityModelChange}
      onColumnOrderChange={handleColumnOrderChange}
      onColumnWidthChange={handleColumnWidthChange}
      slots={{ toolbar, columnMenu }}
      showToolbar={Boolean(toolbar)}
      density="compact"
      disableRowSelectionOnClick
      onColumnHeaderClick={onColumnHeaderClick}
      sx={dataGridHeaderSx}
    />
  )
}

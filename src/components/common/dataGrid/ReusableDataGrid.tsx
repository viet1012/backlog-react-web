import { useMemo } from 'react'

import {
  DataGrid,
  type DataGridProps,
  type GridCellParams,
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

import {
  applyGridColumnPreferences,
} from '../../../utils/uiPreferences'

import {
  dataGridHeaderSx,
} from '../../../theme/dataGridHeaderStyles'


export interface ReusableDataGridProps<
  T extends GridValidRowModel
> {
  rows: T[]

  columns: GridColDef<T>[]

  getRowId: GridRowIdGetter<T>

  loading: boolean

  page: number

  pageSize: number

  rowCount: number

  sortModel: GridSortModel

  columnVisibilityModel:
  GridColumnVisibilityModel

  columnOrder: string[]

  columnWidths:
  Record<string, number>

  onPaginationChange:
  (model: GridPaginationModel) => void

  onSortChange:
  (model: GridSortModel) => void

  onColumnVisibilityModelChange:
  (
    model:
      GridColumnVisibilityModel,
  ) => void

  onColumnOrderChange:
  (order: string[]) => void

  onColumnWidthChange:
  (
    field: string,
    width: number,
  ) => void

  pageSizeOptions?: number[]

  toolbar?:
  GridSlotsComponent['toolbar']

  columnMenu?:
  GridSlotsComponent['columnMenu']

  onColumnHeaderClick?:
  GridEventListener<'columnHeaderClick'>

  paginationMode?:
  'client' | 'server'

  sortingMode?:
  'client' | 'server'

  getCellClassName?: (
    params: GridCellParams<T>,
  ) => string

  processRowUpdate?:
  DataGridProps<T>['processRowUpdate']

  onProcessRowUpdateError?:
  DataGridProps<T>['onProcessRowUpdateError']
}


export function ReusableDataGrid<
  T extends GridValidRowModel
>({
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

  pageSizeOptions = [
    20,
    50,
    100,
  ],

  toolbar,
  columnMenu,

  onColumnHeaderClick,

  paginationMode = 'server',

  sortingMode = 'server',

  getCellClassName,

  processRowUpdate,

  onProcessRowUpdateError,

}: ReusableDataGridProps<T>) {

  // =====================================================
  // COLUMN PREFERENCES
  // =====================================================

  const preferredColumns =
    useMemo(
      () =>
        applyGridColumnPreferences(
          columns,
          columnOrder,
          columnWidths,
        ),
      [
        columns,
        columnOrder,
        columnWidths,
      ],
    )


  // =====================================================
  // COLUMN ORDER
  // =====================================================

  function handleColumnOrderChange(
    params:
      GridColumnOrderChangeParams,
  ) {

    const nextOrder =
      preferredColumns.map(
        (column) =>
          column.field,
      )

    const [
      movedField,
    ] =
      nextOrder.splice(
        params.oldIndex,
        1,
      )

    if (!movedField) {
      return
    }

    nextOrder.splice(
      params.targetIndex,
      0,
      movedField,
    )

    onColumnOrderChange(
      nextOrder,
    )
  }


  // =====================================================
  // COLUMN WIDTH
  // =====================================================

  function handleColumnWidthChange(
    params:
      GridColumnResizeParams,
  ) {

    onColumnWidthChange(
      params.colDef.field,
      params.width,
    )
  }


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <DataGrid<T>

      rows={
        rows
      }

      columns={
        preferredColumns
      }

      getRowId={
        getRowId
      }

      loading={
        loading
      }

      paginationMode={
        paginationMode
      }

      rowCount={
        rowCount
      }

      paginationModel={{
        page,
        pageSize,
      }}

      onPaginationModelChange={
        onPaginationChange
      }

      pageSizeOptions={
        pageSizeOptions
      }

      filterMode="server"

      sortingMode={
        sortingMode
      }

      sortModel={
        sortModel
      }

      onSortModelChange={
        onSortChange
      }

      columnVisibilityModel={
        columnVisibilityModel
      }

      onColumnVisibilityModelChange={
        onColumnVisibilityModelChange
      }

      onColumnOrderChange={
        handleColumnOrderChange
      }

      onColumnWidthChange={
        handleColumnWidthChange
      }

      getCellClassName={
        getCellClassName
      }

      processRowUpdate={
        processRowUpdate
      }

      onProcessRowUpdateError={
        onProcessRowUpdateError
      }

      slots={{
        toolbar,
        columnMenu,
      }}

      showToolbar={
        Boolean(toolbar)
      }

      density="compact"

      disableRowSelectionOnClick

      onColumnHeaderClick={
        onColumnHeaderClick
      }

      sx={
        dataGridHeaderSx
      }

    />
  )
}
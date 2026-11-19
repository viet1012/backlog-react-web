import { memo, useCallback, useEffect, useMemo, useRef } from 'react'

import {
  DataGrid,
  type DataGridProps,
  type GridCellParams,
  type GridApi,
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

import type { RefObject } from 'react'

import {
  applyGridColumnPreferences,
} from '../../../utils/uiPreferences'

import {
  dataGridHeaderSx,
} from '../../../theme/dataGridHeaderStyles'
import { FactoryNoRowsOverlay } from '../FactoryNoRowsOverlay'
import { appScrollbarSx } from '../../../theme/scrollbarStyle'
import type { Theme } from '@mui/material/styles'


// Module-level (stable) sx: an inline function made Emotion re-resolve the
// ~450-line header/body styles on every parent render
const gridSx = (theme: Theme) => ({
  ...dataGridHeaderSx(theme),

  '& .MuiDataGrid-scrollbar--vertical': {
    width: 14,
  },

  '& .MuiDataGrid-scrollbar--horizontal': {
    height: 14,
  },

  '& .MuiDataGrid-scrollbar': {
    ...appScrollbarSx,
  },
})

export interface ReusableDataGridProps<
  T extends GridValidRowModel
> {
  rows: T[]

  columns: GridColDef<T>[]

  isCellEditable?: DataGridProps<T>['isCellEditable']
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

  onCellEditStop?:
  DataGridProps<T>['onCellEditStop']

  apiRef?: RefObject<GridApi | null>

  onCellClick?:
  GridEventListener<'cellClick'>

  onCellKeyDown?:
  GridEventListener<'cellKeyDown'>

  // Mặc định: overlay tải của DataGrid.
  // 'skeleton' => dòng skeleton (vd chỉ dùng cho lần tải đầu).
  loadingOverlayVariant?:
  'skeleton' | 'linear-progress' | 'circular-progress'

  // Thay overlay rỗng mặc định (FactoryNoRowsOverlay)
  noRowsOverlay?:
  GridSlotsComponent['noRowsOverlay']

  // Lỗi API: bảng không có dòng => cảnh lỗi (thay cho overlay rỗng) + nút Thử lại.
  // Còn dòng cũ thì DataGrid không hiện overlay, trang tự báo lỗi.
  error?: string | null
  onRetry?: () => void
}


function ReusableDataGridInner<
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

  isCellEditable,

  processRowUpdate,

  onProcessRowUpdateError,

  onCellEditStop,

  apiRef,
  onCellClick,
  onCellKeyDown,

  loadingOverlayVariant,
  noRowsOverlay,

  error,
  onRetry,

}: ReusableDataGridProps<T>) {

  // =====================================================
  // ERROR OVERLAY
  //
  // Component ổn định theo (error, có onRetry): callback đổi
  // mỗi render không làm overlay mount lại (chạy lại hoạt cảnh).
  // =====================================================

  const onRetryRef =
    useRef(onRetry)

  useEffect(() => {
    onRetryRef.current = onRetry
  }, [onRetry])

  const canRetry =
    Boolean(onRetry)

  const errorOverlay =
    useMemo(
      () => error
        ? function ErrorRowsOverlay() {
          return (
            <FactoryNoRowsOverlay
              tone="error"
              detail={error}
              onRetry={
                canRetry
                  ? () => onRetryRef.current?.()
                  : undefined
              }
            />
          )
        }
        : undefined,
      [
        error,
        canRetry,
      ],
    )


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

  const handleColumnOrderChange = useCallback((
    params:
      GridColumnOrderChangeParams,
  ) => {

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
  }, [preferredColumns, onColumnOrderChange])


  // =====================================================
  // COLUMN WIDTH
  // =====================================================

  const handleColumnWidthChange = useCallback((
    params:
      GridColumnResizeParams,
  ) => {

    onColumnWidthChange(
      params.colDef.field,
      params.width,
    )
  }, [onColumnWidthChange])


  // =====================================================
  // STABLE OBJECT PROPS
  // New objects every render made DataGrid re-process them on each parent
  // render (e.g. every keystroke in a page's search box)
  // =====================================================

  const paginationModel = useMemo(
    () => ({ page, pageSize }),
    [page, pageSize],
  )

  const slots = useMemo(
    () => ({
      toolbar,
      columnMenu,
      noRowsOverlay:
        errorOverlay
        ?? noRowsOverlay
        ?? FactoryNoRowsOverlay,
    }),
    [toolbar, columnMenu, errorOverlay, noRowsOverlay],
  )

  const slotProps = useMemo(
    () => (loadingOverlayVariant
      ? {
        loadingOverlay: {
          variant: loadingOverlayVariant,
          noRowsVariant: loadingOverlayVariant,
        },
      }
      : undefined),
    [loadingOverlayVariant],
  )


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <DataGrid<T>

      apiRef={apiRef}

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

      paginationModel={paginationModel}

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

      isCellEditable={
        isCellEditable
      }

      processRowUpdate={
        processRowUpdate
      }

      onProcessRowUpdateError={
        onProcessRowUpdateError
      }

      onCellEditStop={
        onCellEditStop
      }

      onCellClick={
        onCellClick
      }
      onCellKeyDown={
        onCellKeyDown
      }

      slots={slots}

      slotProps={slotProps}

      showToolbar={
        Boolean(toolbar)
      }

      density="compact"

      disableRowSelectionOnClick

      onColumnHeaderClick={
        onColumnHeaderClick
      }
      sx={gridSx}

    />
  )
}

// memo: a parent re-render with unchanged grid props (typing in a search box,
// a status tick) no longer re-renders the grid at all
export const ReusableDataGrid = memo(ReusableDataGridInner) as typeof ReusableDataGridInner

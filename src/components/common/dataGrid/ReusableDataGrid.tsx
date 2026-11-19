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
import type { GridDensity } from '../../../utils/uiPreferences'
import { GridPinContext } from './gridPinContext'

const NO_PINNED: readonly string[] = []


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

  // Mật độ dòng (gọn / vừa / thoáng), nhớ theo người dùng – xem useGridPreferences
  density?: GridDensity
  onDensityChange?: (density: GridDensity) => void

  // Cột ghim bên trái khi cuộn ngang (vd mã PO / Aufnr). Bản Community không
  // có pinning => tự làm bằng position: sticky (cùng cách bản Pro làm)
  pinnedColumns?: readonly string[]
  // Có thì menu tiêu đề cột hiện mục "Ghim cột / Bỏ ghim"
  onTogglePinnedColumn?: (field: string) => void
}

// =========================================================
// GHIM CỘT (position: sticky)
//
// Cột ghim được đưa lên đầu, mỗi cột nhận class app-pinned + app-pinned-<i>;
// `left` của từng cột = tổng độ rộng các cột ghim trước nó. Tắt ảo hóa cột
// để cột ghim luôn được vẽ khi cuộn xa sang phải.
// =========================================================

const PINNED_CLASS = 'app-pinned'
const PINNED_LAST_CLASS = 'app-pinned-last'
const DEFAULT_COLUMN_WIDTH = 100
const PINNED_COLUMN_BUFFER_PX = 100_000

function joinClass(...names: (string | false | undefined)[]) {
  return names.filter(Boolean).join(' ')
}

function withPinnedClass<T extends GridValidRowModel>(
  column: GridColDef<T>,
  className: string,
): GridColDef<T> {
  const { cellClassName, headerClassName } = column

  return {
    ...column,
    cellClassName: typeof cellClassName === 'function'
      ? (params) => joinClass(cellClassName(params), className)
      : joinClass(cellClassName, className),
    headerClassName: typeof headerClassName === 'function'
      ? (params) => joinClass(headerClassName(params), className)
      : joinClass(headerClassName, className),
  }
}

function applyPinnedColumns<T extends GridValidRowModel>(
  columns: GridColDef<T>[],
  pinned: readonly string[],
  visibility: GridColumnVisibilityModel,
): { columns: GridColDef<T>[], offsets: number[] } {
  // chỉ cột có thật và đang hiện
  const fields = pinned.filter((field) =>
    visibility[field] !== false && columns.some((column) => column.field === field))

  if (fields.length === 0) return { columns, offsets: [] }

  const offsets: number[] = []
  let left = 0

  const pinnedColumns = fields.map((field, index) => {
    const column = columns.find((item) => item.field === field)!
    offsets.push(left)
    left += column.width ?? DEFAULT_COLUMN_WIDTH

    return withPinnedClass(
      column,
      joinClass(PINNED_CLASS, `${PINNED_CLASS}-${index}`, index === fields.length - 1 && PINNED_LAST_CLASS),
    )
  })

  return {
    columns: [...pinnedColumns, ...columns.filter((column) => !fields.includes(column.field))],
    offsets,
  }
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

  density = 'compact',
  onDensityChange,

  pinnedColumns = NO_PINNED,
  onTogglePinnedColumn,

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


  // Cột ghim lên đầu + class sticky; offsets = `left` của từng cột ghim
  const pinned =
    useMemo(
      () =>
        applyPinnedColumns(
          preferredColumns,
          pinnedColumns,
          columnVisibilityModel,
        ),
      [
        preferredColumns,
        pinnedColumns,
        columnVisibilityModel,
      ],
    )

  const displayColumns =
    pinned.columns

  const pinnedOffsetsKey =
    pinned.offsets.join(',')

  const sx = useMemo(
    () => {
      const offsets = pinnedOffsetsKey
        ? pinnedOffsetsKey.split(',').map(Number)
        : []

      if (offsets.length === 0) return gridSx

      const leftRules = Object.fromEntries(
        offsets.map((left, index) => [
          `& .${PINNED_CLASS}-${index}`,
          { left },
        ]),
      )

      return [gridSx, leftRules]
    },
    [pinnedOffsetsKey],
  )

  const pinContext =
    useMemo(
      () => (onTogglePinnedColumn
        ? {
          pinnedColumns,
          togglePinnedColumn: onTogglePinnedColumn,
        }
        : null),
      [pinnedColumns, onTogglePinnedColumn],
    )


  // =====================================================
  // COLUMN ORDER
  // =====================================================

  const handleColumnOrderChange = useCallback((
    params:
      GridColumnOrderChangeParams,
  ) => {

    const nextOrder =
      displayColumns.map(
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
  }, [displayColumns, onColumnOrderChange])


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
    <GridPinContext.Provider value={pinContext}>
    <DataGrid<T>

      apiRef={apiRef}

      rows={
        rows
      }

      columns={
        displayColumns
      }

      // Cột ghim (sticky) phải luôn được vẽ, kể cả khi cuộn xa sang phải:
      // v9 không còn disableColumnVirtualization => vùng đệm cột rất lớn
      // (vẫn ảo hóa theo dòng)
      columnBufferPx={
        pinned.offsets.length > 0
          ? PINNED_COLUMN_BUFFER_PX
          : undefined
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

      density={density}

      onDensityChange={onDensityChange}

      disableRowSelectionOnClick

      onColumnHeaderClick={
        onColumnHeaderClick
      }
      sx={sx}

    />
    </GridPinContext.Provider>
  )
}

// memo: a parent re-render with unchanged grid props (typing in a search box,
// a status tick) no longer re-renders the grid at all
export const ReusableDataGrid = memo(ReusableDataGridInner) as typeof ReusableDataGridInner

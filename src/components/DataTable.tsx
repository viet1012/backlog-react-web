import {
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  type GridColumnVisibilityModel,
  type GridPaginationModel,
  type GridSortModel,
} from '@mui/x-data-grid'
import { useEffect, useMemo, useRef } from 'react'
import { FilteredEmptyState } from './common/loadState'
import type { GridDensity } from '../utils/uiPreferences'
import { createBacklogColumns } from './backlog/backlogColumns'
import { useI18n } from '../i18n/useI18n'
import { ExcelColumnFilterProvider } from './common/dataGrid/ExcelColumnFilter'
import { ExcelColumnMenu } from './common/dataGrid/ExcelColumnMenu'
import { ReusableDataGrid } from './common/dataGrid/ReusableDataGrid'
import type { ExcelFilterOptionsRequest } from './common/dataGrid/excelFilterContext'
import {
  getBacklogFilterKind,
  isExcelFilterField,
} from '../config/backlogFilterFields'
import {
  getBacklogFilterOptions,
  type BacklogFilterItem,
} from '../services/reportService'
import { preventColumnHeaderSort } from '../theme/dataGridHeaderStyles'
import type { ProductionOrder } from '../types/report'

interface DataTableProps {
  data: ProductionOrder[]
  loading: boolean
  page: number
  pageSize: number
  totalElements: number
  excelFilters: BacklogFilterItem[]
  optionContextFilters: BacklogFilterItem[]
  sortModel: GridSortModel
  columnVisibilityModel: GridColumnVisibilityModel
  columnOrder: string[]
  columnWidths: Record<string, number>
  onColumnVisibilityModelChange: (model: GridColumnVisibilityModel) => void
  onColumnOrderChange: (order: string[]) => void
  onColumnWidthChange: (field: string, width: number) => void
  onExcelFiltersChange: (filters: BacklogFilterItem[]) => void
  onSortChange: (model: GridSortModel) => void
  onPaginationChange: (model: GridPaginationModel) => void
  // Lỗi tải => cảnh lỗi API trong bảng + nút Thử lại
  error?: string | null
  onRetry?: () => void
  // Chỉ truyền khi đang có bộ lọc: bảng trống => "Không tìm thấy kết quả"
  // (vd link cũ mà PO không còn) + nút Xóa bộ lọc
  onClearFilters?: () => void
  filterSummary?: string
  // Mật độ dòng (nhớ theo người dùng) + cột ghim khi cuộn ngang
  density: GridDensity
  onDensityChange: (density: GridDensity) => void
  pinnedColumns: readonly string[]
  onTogglePinnedColumn: (field: string) => void
}

function BacklogToolbar() {
  return (
    <GridToolbarContainer sx={{ justifyContent: 'flex-end', minHeight: 40, px: 1, py: 0.5, gap: 0.5 }}>
      <GridToolbarDensitySelector />
      <GridToolbarColumnsButton />
    </GridToolbarContainer>
  )
}

function getFilterKind(field: string) {
  return isExcelFilterField(field) ? getBacklogFilterKind(field) : 'text'
}

async function loadFilterOptions(
  request: ExcelFilterOptionsRequest,
  signal?: AbortSignal,
) {
  if (!isExcelFilterField(request.field)) {
    throw new Error(`Unsupported backlog filter field: ${request.field}`)
  }
  return getBacklogFilterOptions({
    ...request,
    field: request.field,
  }, signal)
}

export function DataTable({
  data,
  loading,
  page,
  pageSize,
  totalElements,
  excelFilters,
  optionContextFilters,
  sortModel,
  columnVisibilityModel,
  columnOrder,
  columnWidths,
  onColumnVisibilityModelChange,
  onColumnOrderChange,
  onColumnWidthChange,
  onExcelFiltersChange,
  onSortChange,
  onPaginationChange,
  error,
  onRetry,
  onClearFilters,
  filterSummary,
  density,
  onDensityChange,
  pinnedColumns,
  onTogglePinnedColumn,
}: DataTableProps) {
  const { t } = useI18n()
  const columns = useMemo(() => createBacklogColumns(t), [t])

  // Overlay ổn định theo (có lọc, mô tả): callback đổi mỗi render không làm
  // overlay mount lại (chạy lại hoạt cảnh)
  const clearRef = useRef(onClearFilters)
  useEffect(() => {
    clearRef.current = onClearFilters
  }, [onClearFilters])

  const filtered = Boolean(onClearFilters)
  const noRowsOverlay = useMemo(
    () => filtered
      ? function BacklogNoMatchOverlay() {
        return (
          <FilteredEmptyState
            summary={filterSummary}
            onClearFilters={() => clearRef.current?.()}
          />
        )
      }
      : undefined,
    [filtered, filterSummary],
  )

  return (
    <ExcelColumnFilterProvider
      excelFilters={excelFilters}
      optionContextFilters={optionContextFilters}
      onExcelFiltersChange={onExcelFiltersChange}
      isFilterableField={isExcelFilterField}
      getFilterKind={getFilterKind}
      loadOptions={loadFilterOptions}
    >
      <ReusableDataGrid<ProductionOrder>
        rows={data}
        columns={columns}
        getRowId={(row) => [
          row.VBELN ?? '', row.ZGLOBAL_CODE ?? '', row.PIER_AUFNR ?? '', row.AUFNR ?? '',
        ].join('|')}
        loading={loading}
        page={page}
        pageSize={pageSize}
        rowCount={totalElements}
        sortModel={sortModel}
        columnVisibilityModel={columnVisibilityModel}
        columnOrder={columnOrder}
        columnWidths={columnWidths}
        onPaginationChange={onPaginationChange}
        onSortChange={onSortChange}
        onColumnVisibilityModelChange={onColumnVisibilityModelChange}
        onColumnOrderChange={onColumnOrderChange}
        onColumnWidthChange={onColumnWidthChange}
        toolbar={BacklogToolbar}
        columnMenu={ExcelColumnMenu}
        onColumnHeaderClick={preventColumnHeaderSort}
        error={error}
        onRetry={onRetry}
        noRowsOverlay={noRowsOverlay}
        density={density}
        onDensityChange={onDensityChange}
        pinnedColumns={pinnedColumns}
        onTogglePinnedColumn={onTogglePinnedColumn}
      />
    </ExcelColumnFilterProvider>
  )
}

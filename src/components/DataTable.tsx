import {
  GridToolbarColumnsButton,
  GridToolbarContainer,
  type GridColumnVisibilityModel,
  type GridPaginationModel,
  type GridSortModel,
} from '@mui/x-data-grid'
import { backlogColumns } from './backlog/backlogColumns'
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
}

function BacklogToolbar() {
  return (
    <GridToolbarContainer sx={{ justifyContent: 'flex-end', minHeight: 40, px: 1, py: 0.5 }}>
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
}: DataTableProps) {
  return (
    <ExcelColumnFilterProvider
      excelFilters={excelFilters}
      onExcelFiltersChange={onExcelFiltersChange}
      isFilterableField={isExcelFilterField}
      getFilterKind={getFilterKind}
      loadOptions={loadFilterOptions}
    >
      <ReusableDataGrid<ProductionOrder>
        rows={data}
        columns={backlogColumns}
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
      />
    </ExcelColumnFilterProvider>
  )
}

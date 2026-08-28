import { useCallback } from 'react'
import {
  GridToolbarColumnsButton,
  GridToolbarContainer,
  type GridColumnVisibilityModel,
  type GridPaginationModel,
  type GridSortModel,
} from '@mui/x-data-grid'
import { ExcelColumnFilterProvider } from '../common/dataGrid/ExcelColumnFilter'
import { ExcelColumnMenu } from '../common/dataGrid/ExcelColumnMenu'
import { ReusableDataGrid } from '../common/dataGrid/ReusableDataGrid'
import type { ExcelFilterOptionsRequest } from '../common/dataGrid/excelFilterContext'
import {
  getFacConfirmFilterKind,
  isFacConfirmFilterField,
} from '../../config/facConfirmFilterFields'
import { getFacConfirmFilterOptions } from '../../services/facConfirmService'
import { preventColumnHeaderSort } from '../../theme/dataGridHeaderStyles'
import type {
  FacConfirmFilterItem,
  FacConfirmProcessGroup,
  FacConfirmRow,
} from '../../types/facConfirm'
import { facConfirmColumns } from './facConfirmColumns'

interface FacConfirmDataTableProps {
  rows: FacConfirmRow[]
  loading: boolean
  div: string
  expD: string
  procGrp: FacConfirmProcessGroup
  excelFilters: FacConfirmFilterItem[]
  paginationModel: GridPaginationModel
  rowCount: number
  sortModel: GridSortModel
  columnVisibilityModel: GridColumnVisibilityModel
  columnOrder: string[]
  columnWidths: Record<string, number>
  onExcelFiltersChange: (filters: FacConfirmFilterItem[]) => void
  onPaginationChange: (model: GridPaginationModel) => void
  onSortChange: (model: GridSortModel) => void
  onColumnVisibilityModelChange: (model: GridColumnVisibilityModel) => void
  onColumnOrderChange: (order: string[]) => void
  onColumnWidthChange: (field: string, width: number) => void
}

function FacConfirmToolbar() {
  return (
    <GridToolbarContainer sx={{ justifyContent: 'flex-end', minHeight: 40, px: 1, py: 0.5 }}>
      <GridToolbarColumnsButton />
    </GridToolbarContainer>
  )
}

export function FacConfirmDataTable({
  rows,
  loading,
  div,
  expD,
  procGrp,
  excelFilters,
  paginationModel,
  rowCount,
  sortModel,
  columnVisibilityModel,
  columnOrder,
  columnWidths,
  onExcelFiltersChange,
  onPaginationChange,
  onSortChange,
  onColumnVisibilityModelChange,
  onColumnOrderChange,
  onColumnWidthChange,
}: FacConfirmDataTableProps) {
  const loadOptions = useCallback((
    request: ExcelFilterOptionsRequest,
    signal?: AbortSignal,
  ) => getFacConfirmFilterOptions({
    ...request,
    div,
    expD,
    procGrp,
  }, signal), [div, expD, procGrp])

  return (
    <ExcelColumnFilterProvider
      excelFilters={excelFilters}
      onExcelFiltersChange={onExcelFiltersChange}
      isFilterableField={isFacConfirmFilterField}
      getFilterKind={getFacConfirmFilterKind}
      loadOptions={loadOptions}
    >
      <ReusableDataGrid<FacConfirmRow>
        rows={rows}
        columns={facConfirmColumns}
        getRowId={(row) => [row.aufnr, row.zglobalCode ?? ''].join('|')}
        loading={loading}
        paginationMode="server"
        page={paginationModel.page}
        pageSize={paginationModel.pageSize}
        rowCount={rowCount}
        onPaginationChange={onPaginationChange}
        sortingMode="client"
        sortModel={sortModel}
        onSortChange={onSortChange}
        columnVisibilityModel={columnVisibilityModel}
        columnOrder={columnOrder}
        columnWidths={columnWidths}
        onColumnVisibilityModelChange={onColumnVisibilityModelChange}
        onColumnOrderChange={onColumnOrderChange}
        onColumnWidthChange={onColumnWidthChange}
        toolbar={FacConfirmToolbar}
        columnMenu={ExcelColumnMenu}
        onColumnHeaderClick={preventColumnHeaderSort}
      />
    </ExcelColumnFilterProvider>
  )
}

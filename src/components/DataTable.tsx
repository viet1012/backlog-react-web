import {
  DataGrid,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  type GridFilterModel,
  type GridPaginationModel,
  type GridSortModel,
} from '@mui/x-data-grid'

import { backlogColumns } from './backlog/backlogColumns'
import { ExcelColumnFilterProvider } from './backlog/ExcelColumnFilter'

import type { ProductionOrder } from '../types/report'
import { ExcelColumnMenu } from './backlog/ExcelColumnMenu'
import {
  dataGridHeaderSx,
  preventColumnHeaderSort,
} from '../theme/dataGridHeaderStyles'

interface DataTableProps {
  data: ProductionOrder[]
  loading: boolean

  page: number
  pageSize: number
  totalElements: number

  filterModel: GridFilterModel
  sortModel: GridSortModel

  onFilterChange: (model: GridFilterModel) => void
  onSortChange: (model: GridSortModel) => void
  onPaginationChange: (model: GridPaginationModel) => void
}

function BacklogToolbar() {
  return (
    <GridToolbarContainer
      sx={{
        justifyContent: 'flex-end',
        minHeight: 40,
        px: 1,
        py: 0.5,
      }}
    >
      <GridToolbarColumnsButton />
    </GridToolbarContainer>
  )
}

export function DataTable({
  data,
  loading,

  page,
  pageSize,
  totalElements,

  filterModel,
  sortModel,

  onFilterChange,
  onSortChange,
  onPaginationChange,
}: DataTableProps) {

  return (
    <ExcelColumnFilterProvider
      filterModel={filterModel}
      onFilterChange={onFilterChange}
    >
      <DataGrid
        rows={data}
        columns={backlogColumns}

        getRowId={(row) => row.AUFNR}

        loading={loading}

        paginationMode="server"
        filterMode="server"
        sortingMode="server"

        filterModel={filterModel}
        sortModel={sortModel}

        onFilterModelChange={onFilterChange}
        onSortModelChange={onSortChange}

        rowCount={totalElements}

        paginationModel={{
          page,
          pageSize,
        }}

        onPaginationModelChange={
          onPaginationChange
        }

        pageSizeOptions={[
          20,
          50,
          100,
        ]}

        slots={{
          toolbar: BacklogToolbar,

          // QUAN TRỌNG:
          // thay menu mặc định của MUI
          columnMenu: ExcelColumnMenu,
        }}

        showToolbar

        density="compact"

        disableRowSelectionOnClick

        onColumnHeaderClick={preventColumnHeaderSort}

        sx={dataGridHeaderSx}
      />
    </ExcelColumnFilterProvider>
  )
}

import {
  DataGrid,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  type GridFilterModel,
  type GridPaginationModel,
} from '@mui/x-data-grid'
import { backlogColumns } from './backlog/backlogColumns'
import type { ProductionOrder } from '../types/report'
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
  onFilterChange: (model: GridFilterModel) => void
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
  onFilterChange,
  onPaginationChange,
}: DataTableProps) {
  return (
    <DataGrid
      rows={data}
      columns={backlogColumns}
      getRowId={(row) => row.AUFNR}
      loading={loading}
      paginationMode="server"
      filterMode="server"
      filterModel={filterModel}
      onFilterModelChange={onFilterChange}
      rowCount={totalElements}
      paginationModel={{ page, pageSize }}
      onPaginationModelChange={onPaginationChange}
      pageSizeOptions={[20, 50, 100]}
      slots={{ toolbar: BacklogToolbar }}
      showToolbar
      density="compact"
      disableRowSelectionOnClick
      onColumnHeaderClick={preventColumnHeaderSort}
      sx={dataGridHeaderSx}
    />
  )
}

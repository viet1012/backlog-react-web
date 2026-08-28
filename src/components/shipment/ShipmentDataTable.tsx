import { useState } from 'react'
import {
  GridToolbarColumnsButton, GridToolbarContainer,
  type GridPaginationModel, type GridSortModel,
} from '@mui/x-data-grid'
import { backlogColumns } from '../backlog/backlogColumns'
import { ReusableDataGrid } from '../common/dataGrid/ReusableDataGrid'
import { useGridPreferences } from '../../hooks/useGridPreferences'
import { preventColumnHeaderSort } from '../../theme/dataGridHeaderStyles'
import type { ProductionOrder } from '../../types/report'

function ShipmentToolbar() {
  return (
    <GridToolbarContainer sx={{ justifyContent: 'flex-end', minHeight: 40, px: 1, py: 0.5 }}>
      <GridToolbarColumnsButton />
    </GridToolbarContainer>
  )
}

interface ShipmentDataTableProps {
  rows: ProductionOrder[]
  loading: boolean
}

export function ShipmentDataTable({ rows, loading }: ShipmentDataTableProps) {
  const [page, setPage] = useState(0)
  const [sortModel, setSortModel] = useState<GridSortModel>([])
  const preferences = useGridPreferences('shipping-schedule', 20)

  function handlePaginationChange(model: GridPaginationModel) {
    if (model.pageSize !== preferences.pageSize) {
      preferences.setPageSize(model.pageSize)
      setPage(0)
      return
    }
    setPage(model.page)
  }

  return (
    <ReusableDataGrid<ProductionOrder>
      rows={rows}
      columns={backlogColumns}
      getRowId={(row) => `${row.VBELN}-${row.AUFNR}-${row.ZGLOBAL_CODE}`}
      loading={loading}
      page={page}
      pageSize={preferences.pageSize}
      rowCount={rows.length}
      sortModel={sortModel}
      onSortChange={setSortModel}
      onPaginationChange={handlePaginationChange}
      paginationMode="client"
      sortingMode="client"
      columnVisibilityModel={preferences.columnVisibilityModel}
      columnOrder={preferences.columnOrder}
      columnWidths={preferences.columnWidths}
      onColumnVisibilityModelChange={preferences.setColumnVisibilityModel}
      onColumnOrderChange={preferences.setColumnOrder}
      onColumnWidthChange={preferences.setColumnWidth}
      onColumnHeaderClick={preventColumnHeaderSort}
      pageSizeOptions={[20, 50, 100]}
      toolbar={ShipmentToolbar}
    />
  )
}

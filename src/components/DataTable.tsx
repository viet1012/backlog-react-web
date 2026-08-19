import {
  DataGrid,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  type GridColumnVisibilityModel,
  type GridPaginationModel,
} from '@mui/x-data-grid'
import { backlogColumns } from './backlog/backlogColumns'
import type { ProductionOrder } from '../types/report'

interface DataTableProps {
  data: ProductionOrder[]
  loading: boolean
  page: number
  pageSize: number
  totalElements: number
  onPaginationChange: (model: GridPaginationModel) => void
}

const initialColumnVisibility: GridColumnVisibilityModel = {
  PIER_AUFNR: false,
  AUFNR: false,
  IssueD: false,
  ExportD: false,
  ORG_Date: false,
  MSM_Ship: false,
  RRONYU1: false,
  GAMNG: false,
  NETPR: false,
  PHCD: false,
  KWMENG: false,
  RODENK: false,
  LOEKZ: false,
  MTO_ID: false,
  PRT_ADDCMT1: false,
  PRT_ADDCMT2: false,
  PRT_STS: false,
  FERTH: false,
  PO_SRG_Convert: false,
  ToDrill: false,
  ToHeat: false,
  ToPK: false,
  HeatCharge: false,
  Z300Qty: false,
  PkQty: false,
  TimeSQuenching: false,
  TimeFHeat: false,
  C_PRODH: false,
  C_KEYCONTROL1: false,
  C_KEYCONTROL3: false,
  Updater: false,
  UpdatedAt: false,
}

function BacklogToolbar() {
  return (
    <GridToolbarContainer sx={{ justifyContent: 'flex-end', px: 1, py: 0.5 }}>
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
  onPaginationChange,
}: DataTableProps) {
  return (
    <DataGrid
      rows={data}
      columns={backlogColumns}
      getRowId={(row) => row.AUFNR}
      loading={loading}
      paginationMode="server"
      rowCount={totalElements}
      paginationModel={{ page, pageSize }}
      onPaginationModelChange={onPaginationChange}
      pageSizeOptions={[20, 50, 100]}
      initialState={{ columns: { columnVisibilityModel: initialColumnVisibility } }}
      slots={{ toolbar: BacklogToolbar }}
      showToolbar
      density="compact"
      disableRowSelectionOnClick
      sx={{
        border: 0,
        color: '#243047',
        '& .MuiDataGrid-columnHeaders': {
          bgcolor: '#f7f9fc',
          borderBottom: '1px solid #dfe4ec',
        },
        '& .MuiDataGrid-columnHeaderTitle': {
          fontWeight: 700,
          fontSize: 12,
          color: '#44516a',
        },
        '& .MuiDataGrid-cell': {
          borderColor: '#edf0f4',
          fontSize: 12,
        },
        '& .MuiDataGrid-row:nth-of-type(even)': { bgcolor: '#fafbfd' },
        '& .MuiDataGrid-row:hover': { bgcolor: '#eef5ff' },
        '& .MuiDataGrid-footerContainer': {
          minHeight: 46,
          borderTop: '1px solid #dfe4ec',
        },
      }}
    />
  )
}

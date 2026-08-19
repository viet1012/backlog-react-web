/* oxlint-disable react/only-export-components -- this file intentionally exports DataGrid column definitions containing render functions */
import { Chip, Tooltip } from '@mui/material'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import type { ProductionOrder } from '../../types/report'

function TextCell({ value }: GridRenderCellParams<ProductionOrder>) {
  const text = value == null || value === '' ? '-' : String(value)

  return (
    <Tooltip title={text} enterDelay={500}>
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </span>
    </Tooltip>
  )
}

function formatDateTime(value: string | null): string {
  if (!value || value.startsWith('1900-01-01')) return '-'
  return value.slice(0, 16).replace('T', ' ')
}

function formatNumber(value: number | null): string {
  return value == null
    ? '-'
    : new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(value)
}

function getStatusColor(status: string | null) {
  const value = status?.toUpperCase() ?? ''
  if (value.includes('DELAY')) return 'error' as const
  if (value.includes('DONE') || value.includes('COMPLETE')) return 'success' as const
  if (value.includes('WIP')) return 'warning' as const
  if (value.includes('WAIT') || value === 'NYI') return 'info' as const
  return 'default' as const
}

const textColumn = (
  field: keyof ProductionOrder,
  headerName: string,
  width = 140,
): GridColDef<ProductionOrder> => ({
  field,
  headerName,
  width,
  renderCell: TextCell,
})

const dateColumn = (
  field: keyof ProductionOrder,
  headerName: string,
): GridColDef<ProductionOrder> => ({
  field,
  headerName,
  width: 155,
  valueFormatter: (value: string | null) => formatDateTime(value),
})

const numberColumn = (
  field: keyof ProductionOrder,
  headerName: string,
): GridColDef<ProductionOrder> => ({
  field,
  headerName,
  type: 'number',
  width: 120,
  align: 'right',
  headerAlign: 'right',
  valueFormatter: (value: number | null) => formatNumber(value),
})

export const backlogColumns: GridColDef<ProductionOrder>[] = [
  textColumn('VBELN', 'Sales Order', 135),
  textColumn('ZGLOBAL_CODE', 'Global Code', 150),
  textColumn('PNAME', 'Product Name', 260),
  {
    field: 'Status',
    headerName: 'Status',
    width: 120,
    renderCell: ({ value }) => (
      <Chip
        label={value || 'Unknown'}
        color={getStatusColor(value)}
        size="small"
        variant="outlined"
        sx={{ height: 22, fontWeight: 600, fontSize: 11 }}
      />
    ),
  },
  textColumn('CurrentProcess', 'Current Process', 170),
  textColumn('PIER_AUFNR', 'Parent Order', 150),
  textColumn('AUFNR', 'Production Order', 150),
  dateColumn('IssueD', 'Issue Date'),
  dateColumn('ProductionD', 'Production Date'),
  dateColumn('PromiseD', 'Promise Date'),
  dateColumn('ExportD', 'Export Date'),
  dateColumn('ORG_Date', 'Original Date'),
  dateColumn('MSM_Ship', 'MSM Ship'),
  textColumn('RRONYU1', 'Customer Code', 120),
  textColumn('ShipBy', 'Ship By', 100),
  numberColumn('GAMNG', 'Order Qty'),
  numberColumn('NETPR', 'Net Price'),
  textColumn('PHCD', 'PHCD', 120),
  numberColumn('KWMENG', 'Sales Qty'),
  textColumn('RODENK', 'RODENK', 100),
  textColumn('LOEKZ', 'Delete Flag', 110),
  textColumn('MTO_ID', 'MTO ID', 150),
  textColumn('PRT_ADDCMT1', 'Comment 1', 220),
  textColumn('PRT_ADDCMT2', 'Comment 2', 220),
  textColumn('PRT_STS', 'PRT Status', 110),
  textColumn('Div', 'Division', 90),
  textColumn('FERTH', 'Product Type', 150),
  textColumn('PO_SRG_Convert', 'Converted PO', 160),
  dateColumn('ToDrill', 'To Drill'),
  dateColumn('ToHeat', 'To Heat'),
  dateColumn('ToPK', 'To Packing'),
  textColumn('HeatCharge', 'Heat Charge', 170),
  numberColumn('ProcessQty', 'Process Qty'),
  numberColumn('Z300Qty', 'Z300 Qty'),
  numberColumn('PkQty', 'Packing Qty'),
  numberColumn('FinalQty', 'Final Qty'),
  dateColumn('TimeSQuenching', 'Start Quenching'),
  dateColumn('TimeFHeat', 'Finish Heat'),
  textColumn('C_PRODH', 'Product Hierarchy', 150),
  textColumn('C_KEYCONTROL1', 'Key Control 1', 230),
  textColumn('C_KEYCONTROL3', 'Key Control 3', 230),
  textColumn('Updater', 'Updater', 120),
  dateColumn('UpdatedAt', 'Updated At'),
]

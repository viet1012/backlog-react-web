/* oxlint-disable react/only-export-components -- this file intentionally exports DataGrid column definitions containing render functions */
import FilterAltRoundedIcon
  from '@mui/icons-material/FilterAltRounded'

import {
  alpha,
  Chip,
  Tooltip,
} from '@mui/material'

import {
  useGridApiContext,
  type GridColDef,
  type GridRenderCellParams,
} from '@mui/x-data-grid'

import type {
  ProductionOrder,
} from '../../types/report'
import { DATA_GRID_COLUMN_WIDTHS } from '../common/dataGrid/dataGridColumnWidths'
import { useOptionalExcelColumnFilter } from '../common/dataGrid/excelFilterContext'
import { getBacklogStatusColor } from './backlogStatus'


// =========================================================
// HEADER FILTER
// =========================================================

interface FilterHeaderProps {
  field: string
  label: string
}

function FilterHeader({
  field,
  label,
}: FilterHeaderProps) {

  const apiRef =
    useGridApiContext()

  const excelFilter = useOptionalExcelColumnFilter()
  const isFiltered = excelFilter?.excelFilters.some(
    (filter) => filter.field === field,
  ) ?? false

  return (
    <span
      role="button"
      tabIndex={0}

      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()

        apiRef.current.showColumnMenu(
          field,
        )
      }}

      onKeyDown={(event) => {
        if (
          event.key === 'Enter'
          || event.key === ' '
        ) {
          event.preventDefault()
          event.stopPropagation()

          apiRef.current.showColumnMenu(
            field,
          )
        }
      }}

      style={{
        width: '100%',
        height: '100%',

        display: 'flex',
        alignItems: 'center',

        gap: 5,

        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >

      {/* ================================
          COLUMN NAME
      ================================= */}

      <span
        style={{
          minWidth: 0,

          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',

          fontWeight:
            isFiltered
              ? 700
              : undefined,
        }}
      >
        {label}
      </span>


      {/* ================================
          ACTIVE FILTER INDICATOR
      ================================= */}

      {isFiltered && (
        <FilterAltRoundedIcon
          color="primary"

          sx={{
            fontSize: 16,
            flexShrink: 0,
          }}
        />
      )}

    </span>
  )
}

// =========================================================
// CELL RENDERERS
// =========================================================

function TextCell({
  value,
}: GridRenderCellParams<ProductionOrder>) {

  const text =
    value == null
      || value === ''
      ? '-'
      : String(value)

  return (
    <Tooltip
      title={text}
      enterDelay={500}
    >
      <span
        style={{
          width: '100%',

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


// =========================================================
// FORMATTERS
// =========================================================

function formatDateTime(
  value: string | null,
): string {

  if (
    !value
    || value.startsWith(
      '1900-01-01',
    )
  ) {
    return '-'
  }

  return value
    .slice(0, 16)
    .replace('T', ' ')
}


function formatNumber(
  value: number | null,
): string {

  if (value == null) {
    return '-'
  }

  return new Intl.NumberFormat(
    'en-US',
    {
      maximumFractionDigits: 3,
    },
  ).format(value)
}


// =========================================================
// STATUS
// =========================================================




// =========================================================
// COLUMN BUILDERS
// =========================================================

const textColumn = (
  field: keyof ProductionOrder,
  headerName: string,
  width = 140,
): GridColDef<ProductionOrder> => ({

  field,
  headerName,
  width,

  // Giữ Sort trong menu 3 chấm
  sortable: true,

  renderCell:
    TextCell,

  renderHeader: () => (
    <FilterHeader
      field={field}
      label={headerName}
    />
  ),
})


const dateColumn = (
  field: keyof ProductionOrder,
  headerName: string,
  width = 120,
): GridColDef<ProductionOrder> => ({

  field,
  headerName,
  width,

  // Giữ Sort trong menu
  sortable: true,

  valueFormatter: (
    value: string | null,
  ) =>
    formatDateTime(value),

  renderHeader: () => (
    <FilterHeader
      field={field}
      label={headerName}
    />
  ),
})


const numberColumn = (
  field: keyof ProductionOrder,
  headerName: string,
  width = 110,
): GridColDef<ProductionOrder> => ({

  field,
  headerName,

  type: 'number',

  width,

  sortable: true,

  align: 'right',
  headerAlign: 'right',

  valueFormatter: (
    value: number | null,
  ) =>
    formatNumber(value),

  renderHeader: () => (
    <FilterHeader
      field={field}
      label={headerName}
    />
  ),
})


// =========================================================
// COLUMNS
// =========================================================

export const backlogColumns:
  GridColDef<ProductionOrder>[] = [

    // -------------------------------------------------------
    // MAIN
    // -------------------------------------------------------

    textColumn(
      'VBELN',
      'Sales Order',
      120,
    ),

    textColumn(
      'ZGLOBAL_CODE',
      'Global Code',
      DATA_GRID_COLUMN_WIDTHS.globalCode,
    ),

    textColumn(
      'PNAME',
      'Product Name',
      DATA_GRID_COLUMN_WIDTHS.productName,
    ),


    // --------------------------f-----------------------------
    // STATUS
    // -------------------------------------------------------

    {
      field: 'Status',

      headerName:
        'Status',

      width: 100,

      sortable: true,

      renderHeader: () => (
        <FilterHeader
          field="Status"
          label="Status"
        />
      ),

      renderCell: ({ value }) => {
        const color = getBacklogStatusColor(value)

        return (
          <Chip
            label={value || 'Unknown'}
            size="small"
            variant="outlined"
            sx={{
              height: 22,
              fontSize: 11,
              fontWeight: 700,

              color,

              borderColor: alpha(
                color,
                0.55,
              ),

              bgcolor: alpha(
                color,
                0.08,
              ),

              '& .MuiChip-label': {
                px: 1,
              },

              '&:hover': {
                bgcolor: alpha(
                  color,
                  0.14,
                ),
              },
            }}
          />
        )
      }
    },


    textColumn(
      'CurrentProcess',
      'Current Process',
      DATA_GRID_COLUMN_WIDTHS.currentProcess,
    ),


    // -------------------------------------------------------
    // ORDER
    // -------------------------------------------------------

    textColumn(
      'PIER_AUFNR',
      'PIER_AUFNR',
      130,
    ),

    textColumn(
      'AUFNR',
      'Production Order',
      140,
    ),


    // -------------------------------------------------------
    // DATE
    // -------------------------------------------------------

    dateColumn(
      'IssueD',
      'Issue Date',
      DATA_GRID_COLUMN_WIDTHS.date,
    ),

    dateColumn(
      'ProductionD',
      'Production Date',
    ),

    dateColumn(
      'PromiseD',
      'Promise Date',
    ),

    dateColumn(
      'ExportD',
      'Export Date',
      DATA_GRID_COLUMN_WIDTHS.date,
    ),

    dateColumn(
      'ORG_Date',
      'Original Date',
    ),

    dateColumn(
      'MSM_Ship',
      'MSM Ship',
    ),


    // -------------------------------------------------------
    // CUSTOMER / SHIPPING
    // -------------------------------------------------------

    textColumn(
      'RRONYU1',
      'Customer Code',
      DATA_GRID_COLUMN_WIDTHS.customer,
    ),

    textColumn(
      'ShipBy',
      'Ship By',
      DATA_GRID_COLUMN_WIDTHS.shipBy,
    ),


    // -------------------------------------------------------
    // QTY / PRICE
    // -------------------------------------------------------

    numberColumn(
      'GAMNG',
      'Order Qty',
    ),

    numberColumn(
      'NETPR',
      'Net Price',
    ),

    textColumn(
      'PHCD',
      'PHCD',
      120,
    ),

    numberColumn(
      'KWMENG',
      'Sales Qty',
    ),


    // -------------------------------------------------------
    // FLAGS / CONTROL
    // -------------------------------------------------------

    textColumn(
      'RODENK',
      'RODENK',
      100,
    ),

    textColumn(
      'LOEKZ',
      'Delete Flag',
      110,
    ),

    textColumn(
      'MTO_ID',
      'MTO ID',
      DATA_GRID_COLUMN_WIDTHS.mtoId,
    ),


    // -------------------------------------------------------
    // COMMENTS
    // -------------------------------------------------------

    textColumn(
      'PRT_ADDCMT1',
      'Comment 1',
      180,
    ),

    textColumn(
      'PRT_ADDCMT2',
      'Comment 2',
      DATA_GRID_COLUMN_WIDTHS.comment,
    ),

    textColumn(
      'PRT_STS',
      'PRT Status',
      110,
    ),


    // -------------------------------------------------------
    // PRODUCT
    // -------------------------------------------------------

    textColumn(
      'Div',
      'Division',
      90,
    ),

    textColumn(
      'FERTH',
      'Product Type',
      DATA_GRID_COLUMN_WIDTHS.productType,
    ),

    textColumn(
      'PO_SRG_Convert',
      'Converted PO',
      160,
    ),


    // -------------------------------------------------------
    // PROCESS DATE
    // -------------------------------------------------------

    dateColumn(
      'ToDrill',
      'To Drill',
      DATA_GRID_COLUMN_WIDTHS.date,
    ),

    dateColumn(
      'ToHeat',
      'To Heat',
      DATA_GRID_COLUMN_WIDTHS.date,
    ),

    dateColumn(
      'ToPK',
      'To Packing',
      DATA_GRID_COLUMN_WIDTHS.date,
    ),


    textColumn(
      'HeatCharge',
      'Heat Charge',
      130,
    ),


    // -------------------------------------------------------
    // PROCESS QTY
    // -------------------------------------------------------

    numberColumn(
      'ProcessQty',
      'Process Qty',
    ),

    numberColumn(
      'Z300Qty',
      'Z300 Qty',
    ),

    numberColumn(
      'PkQty',
      'Packing Qty',
    ),

    numberColumn(
      'FinalQty',
      'Final Qty',
      DATA_GRID_COLUMN_WIDTHS.quantity,
    ),


    // -------------------------------------------------------
    // PROCESS TIME
    // -------------------------------------------------------

    dateColumn(
      'TimeSQuenching',
      'Start Quenching',
    ),

    dateColumn(
      'TimeFHeat',
      'Finish Heat',
    ),


    // -------------------------------------------------------
    // CONTROL DATA
    // -------------------------------------------------------

    textColumn(
      'C_PRODH',
      'C_PRODH',
      130,
    ),

    textColumn(
      'C_KEYCONTROL1',
      'Key Control 1',
      140,
    ),

    textColumn(
      'C_KEYCONTROL3',
      'Key Control 3',
      140,
    ),

    // -------------------------------------------------------
    // CLASSIFICATION / PROCESS GROUP
    // -------------------------------------------------------

    textColumn(
      'Classify',
      'Classify',
      120,
    ),

    textColumn(
      'ProcessGrp2',
      'Process Group',
      140,
    ),

    textColumn(
      'ProductGrp',
      'Product Group',
      130,
    ),

    textColumn(
      'CountODBF',
      'Count ODBF',
      110,
    ),

    textColumn(
      'Status2',
      'Status 2',
      120,
    ),

    // -------------------------------------------------------
    // PICKUP / PACKING
    // -------------------------------------------------------

    dateColumn(
      'Pickup_Time',
      'Pickup Time',
      DATA_GRID_COLUMN_WIDTHS.date,
    ),

    dateColumn(
      'PK_Received',
      'PK Received',
      DATA_GRID_COLUMN_WIDTHS.date,
    ),

    numberColumn(
      'WaitingDays',
      'Waiting Days',
      DATA_GRID_COLUMN_WIDTHS.quantity,
    ),

    textColumn(
      'Heat_Note',
      'Heat Note',
      DATA_GRID_COLUMN_WIDTHS.heatNote,
    ),
    // -------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------

    textColumn(
      'Updater',
      'Updater',
      120,
    ),

    dateColumn(
      'UpdatedAt',
      'Updated At',
    ),
  ]

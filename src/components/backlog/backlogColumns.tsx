/* oxlint-disable react/only-export-components -- this file intentionally exports DataGrid column definitions containing render functions */

import {
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

  function openFilterPanel() {
    apiRef.current.showFilterPanel(
      field,
    )
  }

  return (
    <span
      role="button"
      tabIndex={0}

      onClick={(event) => {
        // Quan trọng:
        // không cho click header chạy sorting
        event.stopPropagation()

        openFilterPanel()
      }}

      onKeyDown={(event) => {
        if (
          event.key === 'Enter'
          || event.key === ' '
        ) {
          event.preventDefault()
          event.stopPropagation()

          openFilterPanel()
        }
      }}

      style={{
        width: '100%',
        height: '100%',

        display: 'flex',
        alignItems: 'center',

        overflow: 'hidden',

        cursor: 'pointer',
      }}
    >
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
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

function getStatusColor(
  status: string | null,
) {

  const value =
    status
      ?.toUpperCase()
      .trim()
    ?? ''

  if (
    value.includes('DELAY')
  ) {
    return 'error' as const
  }

  if (
    value.includes('DONE')
    || value.includes('COMPLETE')
  ) {
    return 'success' as const
  }

  if (
    value.includes('WIP')
  ) {
    return 'warning' as const
  }

  if (
    value.includes('WAIT')
    || value === 'NYI'
  ) {
    return 'info' as const
  }

  return 'default' as const
}


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
  width = 155,
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
  width = 120,
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
      135,
    ),

    textColumn(
      'ZGLOBAL_CODE',
      'Global Code',
      150,
    ),

    textColumn(
      'PNAME',
      'Product Name',
      260,
    ),


    // -------------------------------------------------------
    // STATUS
    // -------------------------------------------------------

    {
      field: 'Status',

      headerName:
        'Status',

      width: 120,

      sortable: true,

      renderHeader: () => (
        <FilterHeader
          field="Status"
          label="Status"
        />
      ),

      renderCell: ({
        value,
      }) => (
        <Chip
          label={
            value || 'Unknown'
          }

          color={
            getStatusColor(
              value,
            )
          }

          size="small"

          variant="outlined"

          sx={{
            height: 22,

            fontSize: 11,
            fontWeight: 600,
          }}
        />
      ),
    },


    textColumn(
      'CurrentProcess',
      'Current Process',
      170,
    ),


    // -------------------------------------------------------
    // ORDER
    // -------------------------------------------------------

    textColumn(
      'PIER_AUFNR',
      'Parent Order',
      150,
    ),

    textColumn(
      'AUFNR',
      'Production Order',
      150,
    ),


    // -------------------------------------------------------
    // DATE
    // -------------------------------------------------------

    dateColumn(
      'IssueD',
      'Issue Date',
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
      120,
    ),

    textColumn(
      'ShipBy',
      'Ship By',
      100,
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
      150,
    ),


    // -------------------------------------------------------
    // COMMENTS
    // -------------------------------------------------------

    textColumn(
      'PRT_ADDCMT1',
      'Comment 1',
      220,
    ),

    textColumn(
      'PRT_ADDCMT2',
      'Comment 2',
      220,
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
      150,
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
    ),

    dateColumn(
      'ToHeat',
      'To Heat',
    ),

    dateColumn(
      'ToPK',
      'To Packing',
    ),


    textColumn(
      'HeatCharge',
      'Heat Charge',
      170,
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
      'Product Hierarchy',
      150,
    ),

    textColumn(
      'C_KEYCONTROL1',
      'Key Control 1',
      230,
    ),

    textColumn(
      'C_KEYCONTROL3',
      'Key Control 3',
      230,
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
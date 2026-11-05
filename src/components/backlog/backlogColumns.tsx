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
import type { Messages } from '../../i18n/messages/en'


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

export function createBacklogColumns(
  t: Messages,
): GridColDef<ProductionOrder>[] {
  const h = t.columns

  return [

    // -------------------------------------------------------
    // MAIN
    // -------------------------------------------------------

    textColumn(
      'VBELN',
      h.salesOrder,
      120,
    ),

    textColumn(
      'ZGLOBAL_CODE',
      h.globalCode,
      DATA_GRID_COLUMN_WIDTHS.globalCode,
    ),

    textColumn(
      'PNAME',
      h.productName,
      DATA_GRID_COLUMN_WIDTHS.productName,
    ),


    // --------------------------f-----------------------------
    // STATUS
    // -------------------------------------------------------

    {
      field: 'Status',

      headerName:
        h.status,

      width: 100,

      sortable: true,

      renderHeader: () => (
        <FilterHeader
          field="Status"
          label={h.status}
        />
      ),

      renderCell: ({ value }) => {
        const color = getBacklogStatusColor(value)

        return (
          <Chip
            label={value || t.common.unknown}
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
      h.currentProcess,
      DATA_GRID_COLUMN_WIDTHS.currentProcess,
    ),


    // -------------------------------------------------------
    // ORDER
    // -------------------------------------------------------

    textColumn(
      'PIER_AUFNR',
      h.pierAufnr,
      130,
    ),

    textColumn(
      'AUFNR',
      h.productionOrder,
      140,
    ),


    // -------------------------------------------------------
    // DATE
    // -------------------------------------------------------

    dateColumn(
      'IssueD',
      h.issueDate,
      DATA_GRID_COLUMN_WIDTHS.date,
    ),

    dateColumn(
      'ProductionD',
      h.productionDate,
    ),

    dateColumn(
      'PromiseD',
      h.promiseDate,
    ),

    dateColumn(
      'ExportD',
      h.exportDate,
      DATA_GRID_COLUMN_WIDTHS.date,
    ),

    dateColumn(
      'ORG_Date',
      h.originalDate,
    ),

    dateColumn(
      'MSM_Ship',
      h.msmShip,
    ),


    // -------------------------------------------------------
    // CUSTOMER / SHIPPING
    // -------------------------------------------------------

    textColumn(
      'RRONYU1',
      h.customerCode,
      DATA_GRID_COLUMN_WIDTHS.customer,
    ),

    textColumn(
      'ShipBy',
      h.shipBy,
      DATA_GRID_COLUMN_WIDTHS.shipBy,
    ),


    // -------------------------------------------------------
    // QTY / PRICE
    // -------------------------------------------------------

    numberColumn(
      'GAMNG',
      h.orderQty,
    ),

    numberColumn(
      'NETPR',
      h.netPrice,
    ),

    textColumn(
      'PHCD',
      h.phcd,
      120,
    ),

    numberColumn(
      'KWMENG',
      h.salesQty,
    ),


    // -------------------------------------------------------
    // FLAGS / CONTROL
    // -------------------------------------------------------

    textColumn(
      'RODENK',
      h.rodenk,
      100,
    ),

    textColumn(
      'LOEKZ',
      h.deleteFlag,
      110,
    ),

    textColumn(
      'MTO_ID',
      h.mtoId,
      DATA_GRID_COLUMN_WIDTHS.mtoId,
    ),


    // -------------------------------------------------------
    // COMMENTS
    // -------------------------------------------------------

    textColumn(
      'PRT_ADDCMT1',
      h.comment1,
      180,
    ),

    textColumn(
      'PRT_ADDCMT2',
      h.comment2,
      DATA_GRID_COLUMN_WIDTHS.comment,
    ),

    textColumn(
      'PRT_STS',
      h.prtStatus,
      110,
    ),


    // -------------------------------------------------------
    // PRODUCT
    // -------------------------------------------------------

    textColumn(
      'Div',
      h.division,
      90,
    ),

    textColumn(
      'FERTH',
      h.productType,
      DATA_GRID_COLUMN_WIDTHS.productType,
    ),

    textColumn(
      'PO_SRG_Convert',
      h.convertedPo,
      160,
    ),


    // -------------------------------------------------------
    // PROCESS DATE
    // -------------------------------------------------------

    dateColumn(
      'ToDrill',
      h.toDrill,
      DATA_GRID_COLUMN_WIDTHS.date,
    ),

    dateColumn(
      'ToHeat',
      h.toHeat,
      DATA_GRID_COLUMN_WIDTHS.date,
    ),

    dateColumn(
      'ToPK',
      h.toPacking,
      DATA_GRID_COLUMN_WIDTHS.date,
    ),


    textColumn(
      'HeatCharge',
      h.heatCharge,
      130,
    ),


    // -------------------------------------------------------
    // PROCESS QTY
    // -------------------------------------------------------

    numberColumn(
      'ProcessQty',
      h.processQty,
    ),

    numberColumn(
      'Z300Qty',
      h.z300Qty,
    ),

    numberColumn(
      'PkQty',
      h.packingQty,
    ),

    numberColumn(
      'FinalQty',
      h.finalQty,
      DATA_GRID_COLUMN_WIDTHS.quantity,
    ),


    // -------------------------------------------------------
    // PROCESS TIME
    // -------------------------------------------------------

    dateColumn(
      'TimeSQuenching',
      h.startQuenching,
    ),

    dateColumn(
      'TimeFHeat',
      h.finishHeat,
    ),


    // -------------------------------------------------------
    // CONTROL DATA
    // -------------------------------------------------------

    textColumn(
      'C_PRODH',
      h.cProdh,
      130,
    ),

    textColumn(
      'C_KEYCONTROL1',
      h.keyControl1,
      140,
    ),

    textColumn(
      'C_KEYCONTROL3',
      h.keyControl3,
      140,
    ),

    // -------------------------------------------------------
    // CLASSIFICATION / PROCESS GROUP
    // -------------------------------------------------------

    textColumn(
      'Classify',
      h.classify,
      120,
    ),

    textColumn(
      'ProcessGrp2',
      h.processGroup,
      140,
    ),

    textColumn(
      'ProductGrp',
      h.productGroup,
      130,
    ),

    textColumn(
      'CountODBF',
      h.countOdbf,
      110,
    ),

    textColumn(
      'Status2',
      h.status2,
      120,
    ),

    // -------------------------------------------------------
    // PICKUP / PACKING
    // -------------------------------------------------------

    dateColumn(
      'Pickup_Time',
      h.pickupTime,
      DATA_GRID_COLUMN_WIDTHS.date,
    ),

    dateColumn(
      'PK_Received',
      h.pkReceived,
      DATA_GRID_COLUMN_WIDTHS.date,
    ),

    numberColumn(
      'WaitingDays',
      h.waitingDays,
      DATA_GRID_COLUMN_WIDTHS.quantity,
    ),

    textColumn(
      'Heat_Note',
      h.heatNote,
      DATA_GRID_COLUMN_WIDTHS.heatNote,
    ),
    // -------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------

    textColumn(
      'Updater',
      h.updater,
      120,
    ),

    dateColumn(
      'UpdatedAt',
      h.updatedAt,
    ),
  ]
}

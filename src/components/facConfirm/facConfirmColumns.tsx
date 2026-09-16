import type {
    GridColDef,
} from '@mui/x-data-grid'

import type {
    FacConfirmProcessGroup,
    FacConfirmRow,
} from '../../types/facConfirm'

import {
    ExcelFilterHeader,
} from '../common/dataGrid/ExcelFilterHeader'
import { DATA_GRID_COLUMN_WIDTHS } from '../common/dataGrid/dataGridColumnWidths'

import {
    FAC_CONFIRM_PROCESS_CONFIG,
} from '../../config/facConfirmProcessConfig'

import {
    formatFacConfirmDateTime,
} from '../../utils/facConfirmDateTime'

import {
    Box,
} from '@mui/material'

import {
    FacConfirmDateTimeEditCell,
} from './FacConfirmDateTimeEditCell'


function renderDateTimeEditCell(
    params: Parameters<
        typeof FacConfirmDateTimeEditCell
    >[0],
) {
    return (
        <FacConfirmDateTimeEditCell
            {...params}
        />
    )
}

const facConfirmColumnDefinitions:
    GridColDef<FacConfirmRow>[] = [

        {
            field: 'ferth',
            headerName: 'Product Type',
            width: DATA_GRID_COLUMN_WIDTHS.productType,
        },

        {
            field: 'productGrp',
            headerName: 'Product Group',
            width: 130,
        },

        {
            field: 'aufnr',
            headerName: 'AUFNR',
            width: 130,
        },

        {
            field: 'zglobalCode',
            headerName: 'Global Code',
            width: DATA_GRID_COLUMN_WIDTHS.globalCode,
        },

        {
            field: 'issueD',
            headerName: 'Issue Date',
            width: DATA_GRID_COLUMN_WIDTHS.date,
        },

        {
            field: 'exportD',
            headerName: 'Export Date',
            width: DATA_GRID_COLUMN_WIDTHS.date,
        },

        {
            field: 'cusId',
            headerName: 'Customer',
            width: DATA_GRID_COLUMN_WIDTHS.customer,
        },

        {
            field: 'shipBy',
            headerName: 'Ship By',
            width: DATA_GRID_COLUMN_WIDTHS.shipBy,
        },

        {
            field: 'mtoId',
            headerName: 'MTO ID',
            width: DATA_GRID_COLUMN_WIDTHS.mtoId,
        },

        {
            field: 'prtAddcmt2',
            headerName: 'Comment',
            width: DATA_GRID_COLUMN_WIDTHS.comment,
        },

        {
            field: 'currentProcess',
            headerName: 'Current Process',
            width: DATA_GRID_COLUMN_WIDTHS.currentProcess,
        },

        {
            field: 'finalQty',
            headerName: 'Final Qty',
            width: DATA_GRID_COLUMN_WIDTHS.quantity,
            type: 'number',
        },

        {
            field: 'pname',
            headerName: 'Product Name',
            width: DATA_GRID_COLUMN_WIDTHS.productName,
        },
        {
            field: 'note',
            headerName: 'Heat Note',
            width: DATA_GRID_COLUMN_WIDTHS.heatNote,

            renderCell: (params) => {
                if (!params.value) {
                    return '-'
                }

                return (
                    <Box
                        sx={() => ({
                            width: '100%',

                            fontSize: 12,
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        })}
                    >
                        {params.value}
                    </Box>
                )
            },
        },
        {
            field: 'toDrill',
            headerName: 'To Drill',
            width: DATA_GRID_COLUMN_WIDTHS.date,
            valueFormatter: (value) => formatFacConfirmDateTime(value),
            renderEditCell:
                renderDateTimeEditCell,
        },
        {
            field: 'toHeat',
            headerName: 'To Heat',
            width: DATA_GRID_COLUMN_WIDTHS.date,
            valueFormatter: (value) => formatFacConfirmDateTime(value),
            renderEditCell:
                renderDateTimeEditCell,
        },
        {
            field: 'heatStart',
            headerName: 'Heat Start',
            width: DATA_GRID_COLUMN_WIDTHS.date,

            valueFormatter: (value) =>
                formatFacConfirmDateTime(value),

            renderCell: (params) => {
                if (!params.value) {
                    return ''
                }

                return formatFacConfirmDateTime(
                    params.value,
                )
            },

            renderEditCell:
                renderDateTimeEditCell,
        },
        {
            field: 'heatFinish',
            headerName: 'Heat Finish',
            width: DATA_GRID_COLUMN_WIDTHS.date,

            valueFormatter: (value) =>
                formatFacConfirmDateTime(value),

            renderCell: (params) => {
                if (!params.value) {
                    return ''
                }

                return formatFacConfirmDateTime(
                    params.value,
                )
            },

            renderEditCell:
                renderDateTimeEditCell,
        },
        {
            field: 'toPk',
            headerName: 'To PK',
            width: DATA_GRID_COLUMN_WIDTHS.date,
            valueFormatter: (value) => formatFacConfirmDateTime(value),
            renderEditCell:
                renderDateTimeEditCell,
        },
    ]


// =========================================================
// BUILD COLUMNS
// =========================================================

export function getFacConfirmColumns(
    activeProcess:
        FacConfirmProcessGroup | null,
): GridColDef<FacConfirmRow>[] {

    const allowedFields: Set<string> | null =
        activeProcess
            ? new Set<string>(
                FAC_CONFIRM_PROCESS_CONFIG[activeProcess].columns,
            )
            : null

    return facConfirmColumnDefinitions.map(
        (column) => ({

            ...column,

            sortable: true,

            editable:
                allowedFields?.has(
                    column.field,
                ) ?? false,

            renderHeader: () => (
                <ExcelFilterHeader
                    field={column.field}
                    label={
                        column.headerName
                        ?? column.field
                    }
                />
            ),
        }),
    )
}

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
    getProcessEditableFields,
} from '../../config/facConfirmEditRules'

import {
    formatFacConfirmDateTime,
} from '../../utils/facConfirmDateTime'

import {
    FacConfirmDateTimeEditCell,
} from './FacConfirmDateTimeEditCell'

import type { Messages } from '../../i18n/messages/en'


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

                // Plain span + static style object: an MUI Box with an sx
                // function ran Emotion for every visible cell on every render
                return (
                    <span style={NOTE_CELL_STYLE}>
                        {params.value}
                    </span>
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
        // Heat Start không hiển thị: field vẫn có trong row,
        // chỉ dùng để validate To CLG.
        {
            field: 'heatFinish',
            headerName: 'To CLG',
            width: DATA_GRID_COLUMN_WIDTHS.date,

            // valueFormatter only (the renderCell doing the same formatting
            // sent every cell through the slower custom-render path)
            valueFormatter: (value) =>
                value
                    ? formatFacConfirmDateTime(value)
                    : '',

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

// field → shared header key in t.columns
const headerKeys: Partial<Record<string, keyof Messages['columns']>> = {
    ferth: 'productType',
    productGrp: 'productGroup',
    aufnr: 'aufnr',
    zglobalCode: 'globalCode',
    issueD: 'issueDate',
    exportD: 'exportDate',
    cusId: 'customer',
    shipBy: 'shipBy',
    mtoId: 'mtoId',
    prtAddcmt2: 'comment',
    currentProcess: 'currentProcess',
    finalQty: 'finalQty',
    pname: 'productName',
    note: 'heatNote',
    toDrill: 'toDrill',
    toHeat: 'toHeat',
    heatFinish: 'toClg',
    toPk: 'toPk',
}


const NOTE_CELL_STYLE = {
    display: 'block',
    width: '100%',
    fontSize: 12,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
} as const

export function getFacConfirmColumns(
    activeProcess:
        FacConfirmProcessGroup | null,
    t: Messages,
): GridColDef<FacConfirmRow>[] {

    // Cột có thể sửa ở công đoạn (gồm cột quy tắc mở thêm).
    // Quyền từng ô: isCellEditable -> getEditableFields.
    const allowedFields: Set<string> | null =
        activeProcess
            ? new Set<string>(
                getProcessEditableFields(activeProcess),
            )
            : null

    return facConfirmColumnDefinitions.map(
        (column) => {
            const headerKey = headerKeys[column.field]
            const headerName = headerKey
                ? t.columns[headerKey]
                : column.headerName

            return {

            ...column,

            headerName,

            sortable: true,

            editable:
                allowedFields?.has(
                    column.field,
                ) ?? false,

            renderHeader: () => (
                <ExcelFilterHeader
                    field={column.field}
                    label={
                        headerName
                        ?? column.field
                    }
                />
            ),
            }
        },
    )
}

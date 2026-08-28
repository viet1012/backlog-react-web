import type {
    GridColDef,
} from '@mui/x-data-grid'

import type {
    FacConfirmRow,
} from '../../types/facConfirm'
import { ExcelFilterHeader } from '../common/dataGrid/ExcelFilterHeader'


const facConfirmColumnDefinitions:
    GridColDef<FacConfirmRow>[] = [

        {
            field: 'ferth',
            headerName: 'Product Type',
            width: 150,
        },

        {
            field: 'productGrp',
            headerName: 'Product Group',
            width: 150,
        },

        {
            field: 'aufnr',
            headerName: 'AUFNR',
            width: 150,
        },

        {
            field: 'zglobalCode',
            headerName: 'Global Code',
            width: 170,
        },

        {
            field: 'issueD',
            headerName: 'Issue Date',
            width: 125,
        },

        {
            field: 'exportD',
            headerName: 'Export Date',
            width: 125,
        },

        {
            field: 'cusId',
            headerName: 'Customer',
            width: 110,
        },

        {
            field: 'shipBy',
            headerName: 'Ship By',
            width: 100,
        },

        {
            field: 'mtoId',
            headerName: 'MTO ID',
            width: 130,
        },

        {
            field: 'prtAddcmt2',
            headerName: 'Comment',
            width: 220,
        },

        {
            field: 'currentProcess',
            headerName: 'Current Process',
            width: 150,
        },

        {
            field: 'finalQty',
            headerName: 'Final Qty',
            width: 100,
            type: 'number',
        },

        // Product Name chuyển xuống đây
        {
            field: 'pname',
            headerName: 'Product Name',
            width: 200,
        },

        {
            field: 'toDrill',
            headerName: 'To Drill',
            width: 165,
        },

        {
            field: 'toHeat',
            headerName: 'To Heat',
            width: 165,
        },

        {
            field: 'heatStart',
            headerName: 'Heat Start',
            width: 175,
        },

        {
            field: 'heatFinish',
            headerName: 'Heat Finish',
            width: 175,
        },

        {
            field: 'toPk',
            headerName: 'To PK',
            width: 165,
        },
    ]

export const facConfirmColumns: GridColDef<FacConfirmRow>[] =
    facConfirmColumnDefinitions.map((column) => ({
        ...column,
        sortable: true,
        renderHeader: () => (
            <ExcelFilterHeader
                field={column.field}
                label={column.headerName ?? column.field}
            />
        ),
    }))

import {
    Box,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
} from '@mui/material'

import CloseRoundedIcon
    from '@mui/icons-material/CloseRounded'

import {
    DataGrid,
    GridToolbarColumnsButton,
    GridToolbarContainer,
    type GridColumnOrderChangeParams,
    type GridColumnResizeParams,
    type GridPaginationModel,
} from '@mui/x-data-grid'
import { useMemo, useState } from 'react'

import { backlogColumns }
    from '../../backlog/backlogColumns'

import type {
    ShipmentDetailFilter,
} from '../../../types/shipment'

import type {
    ProductionOrder,
} from '../../../types/report'
import { uiTokens } from '../../../theme/uiTokens'
import {
    dataGridHeaderSx,
    preventColumnHeaderSort,
} from '../../../theme/dataGridHeaderStyles'
import { useGridPreferences } from '../../../hooks/useGridPreferences'
import { applyGridColumnPreferences } from '../../../utils/uiPreferences'


interface ShipmentDetailDialogProps {
    open: boolean
    filter: ShipmentDetailFilter | null
    data: ProductionOrder[]
    loading: boolean
    error: string | null
    onClose: () => void
}


function ShipmentDetailToolbar() {
    return (
        <GridToolbarContainer
            sx={(theme) => ({
                justifyContent: 'flex-end',
                minHeight: 40,
                px: 1,
                py: 0.5,

                bgcolor:
                    theme.palette.mode === 'dark'
                        ? '#131f33'
                        : '#f6f8fb',

                borderBottom:
                    `1px solid ${theme.palette.divider}`,
            })}
        >
            <GridToolbarColumnsButton />
        </GridToolbarContainer>
    )
}


export function ShipmentDetailDialog({
    open,
    filter,
    data,
    loading,
    error,
    onClose,
}: ShipmentDetailDialogProps) {
    const [page, setPage] = useState(0)
    const {
        columnVisibilityModel,
        columnOrder,
        columnWidths,
        pageSize,
        setColumnVisibilityModel,
        setColumnOrder,
        setColumnWidth,
        setPageSize,
    } = useGridPreferences('shipping-schedule', 20)

    const preferredColumns = useMemo(
        () => applyGridColumnPreferences(backlogColumns, columnOrder, columnWidths),
        [columnOrder, columnWidths],
    )

    function handleColumnOrderChange(params: GridColumnOrderChangeParams) {
        const nextOrder = preferredColumns.map((column) => column.field)
        const [movedField] = nextOrder.splice(params.oldIndex, 1)
        if (!movedField) return
        nextOrder.splice(params.targetIndex, 0, movedField)
        setColumnOrder(nextOrder)
    }

    function handleColumnWidthChange(params: GridColumnResizeParams) {
        setColumnWidth(params.colDef.field, params.width)
    }

    function handlePaginationChange(model: GridPaginationModel) {
        if (model.pageSize !== pageSize) {
            setPageSize(model.pageSize)
            setPage(0)
            return
        }
        setPage(model.page)
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen
        >

            {/* HEADER */}
            <DialogTitle
                sx={(theme) => ({
                    minHeight: 58,

                    px: 2,
                    py: 0.75,

                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',

                    bgcolor: 'transparent',

                    borderBottom:
                        `1px solid ${theme.palette.divider}`,
                })}
            >

                <Box>

                    <Typography
                        sx={{
                            fontSize: uiTokens.dialogTypography.titleFontSize,
                            fontWeight: 800,
                        }}
                    >
                        SHIPMENT DETAIL
                    </Typography>

                    {filter && (
                        <Typography
                            sx={{
                                mt: 0.15,
                                fontSize: uiTokens.typography.updatedStatus,
                                color: 'text.secondary',
                            }}
                        >
                            Customer:
                            {' '}
                            <b>{filter.cusId}</b>

                            {' · '}

                            Ship By:
                            {' '}
                            <b>{filter.shipBy}</b>

                            {filter.exportDate && (
                                <>
                                    {' · '}
                                    Export Date:
                                    {' '}
                                    <b>{filter.exportDate}</b>
                                </>
                            )}

                            {' · '}

                            Orders:
                            {' '}
                            <b>{data.length.toLocaleString()}</b>
                        </Typography>
                    )}

                </Box>


                <IconButton
                    size="small"
                    onClick={onClose}
                >
                    <CloseRoundedIcon />
                </IconButton>

            </DialogTitle>


            {/* CONTENT */}
            <DialogContent
                sx={{
                    p: 0,

                    flex: 1,

                    minHeight: 0,

                    display: 'flex',
                    flexDirection: 'column',

                    overflow: 'hidden',
                }}
            >

                {error && (
                    <Box
                        sx={{
                            px: 2,
                            py: 0.75,

                            bgcolor: 'error.main',
                            color: 'error.contrastText',

                            fontSize: uiTokens.typography.body,
                        }}
                    >
                        {error}
                    </Box>
                )}


                {loading && data.length === 0 ? (

                    <Box
                        sx={{
                            flex: 1,

                            display: 'grid',
                            placeItems: 'center',
                        }}
                    >
                        <CircularProgress size={28} />
                    </Box>

                ) : (

                    <Box
                        sx={{
                            flex: 1,
                            minHeight: 0,
                            minWidth: 0,
                        }}
                    >

                        <DataGrid
                            rows={data}

                            // FULL COLUMNS GIỐNG BACKLOG
                            columns={preferredColumns}

                            columnVisibilityModel={columnVisibilityModel}
                            onColumnVisibilityModelChange={setColumnVisibilityModel}
                            onColumnOrderChange={handleColumnOrderChange}
                            onColumnWidthChange={handleColumnWidthChange}

                            getRowId={(row) =>
                                `${row.VBELN}-${row.AUFNR}-${row.ZGLOBAL_CODE}`
                            }

                            loading={loading}

                            density="compact"

                            disableRowSelectionOnClick

                            onColumnHeaderClick={preventColumnHeaderSort}

                            pageSizeOptions={[
                                20,
                                50,
                                100,
                            ]}

                            paginationModel={{ page, pageSize }}
                            onPaginationModelChange={handlePaginationChange}

                            slots={{
                                toolbar: ShipmentDetailToolbar,
                            }}

                            showToolbar

                            sx={dataGridHeaderSx}
                        />

                    </Box>

                )}

            </DialogContent>

        </Dialog>
    )
}

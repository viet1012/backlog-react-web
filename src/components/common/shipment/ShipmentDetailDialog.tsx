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
} from '@mui/x-data-grid'

import { backlogColumns }
    from '../../backlog/backlogColumns'

import type {
    ShipmentDetailFilter,
} from '../../../types/shipment'

import type {
    ProductionOrder,
} from '../../../types/report'


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

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen
            slotProps={{
                paper: {
                    sx: {
                        m: 0,
                        borderRadius: 0,
                    },
                },
            }}
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

                    bgcolor:
                        theme.palette.mode === 'dark'
                            ? '#131f33'
                            : '#f6f8fb',

                    borderBottom:
                        `1px solid ${theme.palette.divider}`,
                })}
            >

                <Box>

                    <Typography
                        sx={{
                            fontSize: 17,
                            fontWeight: 800,
                        }}
                    >
                        SHIPMENT DETAIL
                    </Typography>

                    {filter && (
                        <Typography
                            sx={{
                                mt: 0.15,
                                fontSize: 11,
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

                            fontSize: 12,
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
                            columns={backlogColumns}

                            getRowId={(row) =>
                                `${row.VBELN}-${row.AUFNR}-${row.ZGLOBAL_CODE}`
                            }

                            loading={loading}

                            density="compact"

                            disableRowSelectionOnClick

                            pageSizeOptions={[
                                20,
                                50,
                                100,
                            ]}

                            initialState={{
                                pagination: {
                                    paginationModel: {
                                        page: 0,
                                        pageSize: 20,
                                    },
                                },
                            }}

                            slots={{
                                toolbar: ShipmentDetailToolbar,
                            }}

                            showToolbar

                            sx={(theme) => {
                                const dark =
                                    theme.palette.mode === 'dark'

                                return {
                                    width: '100%',
                                    height: '100%',

                                    border: 0,

                                    color:
                                        dark
                                            ? '#dbe7f8'
                                            : '#243047',

                                    bgcolor:
                                        dark
                                            ? '#101a2b'
                                            : '#ffffff',


                                    // HEADER
                                    '& .MuiDataGrid-columnHeaders': {
                                        bgcolor:
                                            dark
                                                ? '#17243a'
                                                : '#eef3f8',

                                        borderBottom:
                                            `1px solid ${theme.palette.divider}`,
                                    },


                                    '& .MuiDataGrid-columnHeaderTitle': {
                                        fontWeight: 700,
                                        fontSize: 12,

                                        color:
                                            dark
                                                ? '#cbd8eb'
                                                : '#3b4a61',
                                    },


                                    // CELL
                                    '& .MuiDataGrid-cell': {
                                        borderColor:
                                            theme.palette.divider,

                                        fontSize: 12,
                                    },


                                    // EVEN ROW
                                    '& .MuiDataGrid-row:nth-of-type(even)': {
                                        bgcolor:
                                            dark
                                                ? '#121e31'
                                                : '#f8fafc',
                                    },


                                    // HOVER
                                    '& .MuiDataGrid-row:hover': {
                                        bgcolor:
                                            dark
                                                ? '#1b3150'
                                                : '#eef5ff',
                                    },


                                    // FOOTER
                                    '& .MuiDataGrid-footerContainer': {
                                        minHeight: 46,

                                        bgcolor:
                                            dark
                                                ? '#131f33'
                                                : '#f6f8fb',

                                        borderTop:
                                            `1px solid ${theme.palette.divider}`,
                                    },


                                    // SCROLLBAR
                                    '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': {
                                        width: 10,
                                        height: 10,
                                    },


                                    '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track': {
                                        bgcolor:
                                            dark
                                                ? '#0d1625'
                                                : '#e5eaf0',
                                    },


                                    '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': {
                                        bgcolor:
                                            dark
                                                ? '#33445e'
                                                : '#aab5c4',

                                        borderRadius: 8,
                                    },


                                    '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb:hover': {
                                        bgcolor:
                                            dark
                                                ? '#49617f'
                                                : '#8392a7',
                                    },
                                }
                            }}
                        />

                    </Box>

                )}

            </DialogContent>

        </Dialog>
    )
}
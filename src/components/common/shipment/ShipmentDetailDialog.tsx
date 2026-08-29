import {
    Box,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Typography,
} from '@mui/material'

import CloseRoundedIcon
    from '@mui/icons-material/CloseRounded'

import type {
    ShipmentDetailFilter,
} from '../../../types/shipment'

import type { ProductionOrder } from '../../../types/report'
import { uiTokens } from '../../../theme/uiTokens'
import { ShipmentDataTable } from '../../shipment/ShipmentDataTable'
import { AppButton } from '../AppButton'


interface ShipmentDetailDialogProps {
    open: boolean
    filter: ShipmentDetailFilter | null
    data: ProductionOrder[]
    loading: boolean
    error: string | null
    onClose: () => void
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


                <AppButton
                    compact
                    aria-label="Close"
                    onClick={onClose}
                    icon={<CloseRoundedIcon />}
                />

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

                        <ShipmentDataTable rows={data} loading={loading} />

                    </Box>

                )}

            </DialogContent>

        </Dialog>
    )
}

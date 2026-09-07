import {
    Alert,
    Box,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Typography,
    alpha,
} from '@mui/material'

import WarningAmberRoundedIcon
    from '@mui/icons-material/WarningAmberRounded'

import LocalFireDepartmentRoundedIcon
    from '@mui/icons-material/LocalFireDepartmentRounded'

import type {
    FacConfirmHeatWarningRequest,
} from './hooks/useFacConfirmHeatProcessGuard'

import {
    getFacConfirmHeatFieldLabel,
} from './hooks/useFacConfirmHeatProcessGuard'

import {
    AppButton,
} from '../common/AppButton'


// =========================================================
// PROPS
// =========================================================

interface FacConfirmNoHeatWarningDialogProps {
    request:
    FacConfirmHeatWarningRequest | null

    onConfirm:
    () => void

    onCancel:
    () => void
}


// =========================================================
// COMPONENT
// =========================================================

export function FacConfirmNoHeatWarningDialog({
    request,
    onConfirm,
    onCancel,
}: FacConfirmNoHeatWarningDialogProps) {

    const open =
        request !== null


    const fieldLabel =
        request
            ? getFacConfirmHeatFieldLabel(
                request.field,
            )
            : ''


    return (
        <Dialog
            open={
                open
            }

            onClose={
                onCancel
            }

            maxWidth="xs"

            fullWidth

            aria-labelledby="fac-confirm-no-heat-title"

            slotProps={{
                paper: {
                    sx: (theme) => ({
                        borderRadius:
                            2.5,

                        overflow:
                            'hidden',

                        border:
                            `1px solid ${alpha(
                                theme.palette.warning.main,
                                theme.palette.mode === 'dark'
                                    ? 0.24
                                    : 0.18,
                            )
                            }`,

                        boxShadow:
                            theme.palette.mode === 'dark'
                                ? '0 20px 60px rgba(0,0,0,0.42)'
                                : '0 20px 60px rgba(15,23,42,0.16)',
                    }),
                },
            }}
        >
            {/* ===================================================
          HEADER
      =================================================== */}

            <DialogTitle
                id="fac-confirm-no-heat-title"

                sx={{
                    display:
                        'flex',

                    alignItems:
                        'center',

                    gap:
                        1.25,

                    px:
                        2.5,

                    pt:
                        2.25,

                    pb:
                        1.5,
                }}
            >
                <Box
                    sx={(theme) => ({
                        width:
                            42,

                        height:
                            42,

                        flex:
                            '0 0 auto',

                        display:
                            'grid',

                        placeItems:
                            'center',

                        borderRadius:
                            2,

                        color:
                            theme.palette.warning.main,

                        bgcolor:
                            alpha(
                                theme.palette.warning.main,

                                theme.palette.mode === 'dark'
                                    ? 0.16
                                    : 0.10,
                            ),
                    })}
                >
                    <WarningAmberRoundedIcon />
                </Box>


                <Box
                    sx={{
                        minWidth:
                            0,
                    }}
                >
                    <Typography
                        sx={{
                            fontSize:
                                16,

                            fontWeight:
                                800,

                            lineHeight:
                                1.3,

                            color:
                                'text.primary',
                        }}
                    >
                        PO không có công đoạn Nhiệt
                    </Typography>


                    <Typography
                        variant="caption"

                        sx={{
                            color:
                                'text.secondary',
                        }}
                    >
                        Heat process validation
                    </Typography>
                </Box>
            </DialogTitle>


            <Divider />


            {/* ===================================================
          CONTENT
      =================================================== */}

            <DialogContent
                sx={{
                    px:
                        2.5,

                    py:
                        2,
                }}
            >
                <Alert
                    severity="warning"

                    icon={
                        <LocalFireDepartmentRoundedIcon
                            fontSize="inherit"
                        />
                    }

                    sx={{
                        mb:
                            2,

                        alignItems:
                            'center',

                        '& .MuiAlert-message': {
                            width:
                                '100%',
                        },
                    }}
                >
                    PO này không được xác định có công đoạn Nhiệt.
                </Alert>


                {/* =================================================
            DETAILS
        ================================================= */}

                <Box
                    sx={(theme) => ({
                        overflow:
                            'hidden',

                        borderRadius:
                            1.75,

                        border:
                            `1px solid ${theme.palette.divider
                            }`,

                        bgcolor:
                            alpha(
                                theme.palette.text.primary,

                                theme.palette.mode === 'dark'
                                    ? 0.025
                                    : 0.018,
                            ),
                    })}
                >
                    {/* PO */}

                    <Box
                        sx={{
                            minHeight:
                                42,

                            px:
                                1.5,

                            display:
                                'grid',

                            gridTemplateColumns:
                                '100px minmax(0, 1fr)',

                            alignItems:
                                'center',

                            gap:
                                1.5,
                        }}
                    >
                        <Typography
                            variant="body2"

                            sx={{
                                color:
                                    'text.secondary',

                                fontWeight:
                                    600,
                            }}
                        >
                            PO
                        </Typography>


                        <Typography
                            variant="body2"

                            sx={{
                                color:
                                    'text.primary',

                                fontWeight:
                                    800,

                                textAlign:
                                    'right',

                                fontVariantNumeric:
                                    'tabular-nums',

                                overflowWrap:
                                    'anywhere',
                            }}
                        >
                            {request?.aufnr ?? '-'}
                        </Typography>
                    </Box>


                    <Divider />


                    {/* FIELD */}

                    <Box
                        sx={{
                            minHeight:
                                42,

                            px:
                                1.5,

                            display:
                                'grid',

                            gridTemplateColumns:
                                '100px minmax(0, 1fr)',

                            alignItems:
                                'center',

                            gap:
                                1.5,
                        }}
                    >
                        <Typography
                            variant="body2"

                            sx={{
                                color:
                                    'text.secondary',

                                fontWeight:
                                    600,
                            }}
                        >
                            Column
                        </Typography>


                        <Typography
                            variant="body2"

                            sx={{
                                color:
                                    'text.primary',

                                fontWeight:
                                    700,

                                textAlign:
                                    'right',
                            }}
                        >
                            {fieldLabel || '-'}
                        </Typography>
                    </Box>
                </Box>


                {/* =================================================
            QUESTION
        ================================================= */}

                <Typography
                    sx={{
                        mt:
                            2,

                        fontSize:
                            13.5,

                        fontWeight:
                            500,

                        lineHeight:
                            1.6,

                        color:
                            'text.secondary',
                    }}
                >
                    Bạn vẫn muốn nhập thời gian cho PO này?
                </Typography>


                <Typography
                    variant="caption"

                    sx={{
                        display:
                            'block',

                        mt:
                            0.5,

                        color:
                            'text.disabled',
                    }}
                >
                    Chỉ tiếp tục nếu PO thực tế cần xử lý qua công đoạn Nhiệt.
                </Typography>
            </DialogContent>


            {/* ===================================================
          ACTION
      =================================================== */}

            <DialogActions
                sx={{
                    px:
                        2.5,

                    pb:
                        2.25,

                    pt:
                        0,

                    gap:
                        1,
                }}
            >
                <AppButton
                    appearance="default"

                    onClick={
                        onCancel
                    }
                >
                    No
                </AppButton>


                <AppButton
                    appearance="action"

                    onClick={
                        onConfirm
                    }
                >
                    Yes, continue
                </AppButton>
            </DialogActions>
        </Dialog>
    )
}
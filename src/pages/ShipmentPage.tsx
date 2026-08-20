import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Stack,
    TextField,
    Typography,
} from '@mui/material'

import {
    useEffect,
    useMemo,
    useState,
} from 'react'

import {
    getShipmentFulfillment,
} from '../services/shipmentService'

import type {
    ShipmentFulfillment,
} from '../types/shipment'

import {
    buildDateRange,
    buildShipmentRows,
    getDefaultShipmentDateRange,
} from '../components/shipment/shipmentHeatmapUtils'

import {
    ShipmentHeatmap,
} from '../components/shipment/ShipmentHeatmap'

const defaultRange =
    getDefaultShipmentDateRange()

export function ShipmentPage() {
    const [data, setData] =
        useState<ShipmentFulfillment[]>([])

    const [loading, setLoading] =
        useState(false)

    const [error, setError] =
        useState<string | null>(null)

    const [lastUpdated, setLastUpdated] =
        useState<Date | null>(null)

    const [refreshKey, setRefreshKey] =
        useState(0)

    // Giá trị user đang chọn
    const [fromD, setFromD] =
        useState(defaultRange.fromD)

    const [toD, setToD] =
        useState(defaultRange.toD)

    // Giá trị thực sự dùng để call API
    const [appliedFromD, setAppliedFromD] =
        useState(defaultRange.fromD)

    const [appliedToD, setAppliedToD] =
        useState(defaultRange.toD)

    useEffect(() => {
        const controller =
            new AbortController()

        async function loadData() {
            setLoading(true)
            setError(null)

            try {
                const result =
                    await getShipmentFulfillment(
                        appliedFromD,
                        appliedToD,
                        controller.signal,
                    )

                setData(result)

                setLastUpdated(
                    new Date(),
                )
            } catch (requestError) {
                if (
                    !controller.signal.aborted
                ) {
                    setError(
                        requestError instanceof Error
                            ? requestError.message
                            : 'Unable to load shipment fulfillment',
                    )
                }
            } finally {
                if (
                    !controller.signal.aborted
                ) {
                    setLoading(false)
                }
            }
        }

        void loadData()

        return () =>
            controller.abort()
    }, [
        appliedFromD,
        appliedToD,
        refreshKey,
    ])

    const dates =
        useMemo(
            () =>
                buildDateRange(
                    appliedFromD,
                    appliedToD,
                ),
            [
                appliedFromD,
                appliedToD,
            ],
        )

    const rows =
        useMemo(
            () =>
                buildShipmentRows(data),
            [data],
        )

    function handleApplyDate() {
        if (!fromD || !toD) {
            setError(
                'Please select From Date and To Date',
            )

            return
        }

        if (fromD > toD) {
            setError(
                'From Date cannot be after To Date',
            )

            return
        }

        setError(null)

        setAppliedFromD(fromD)
        setAppliedToD(toD)
    }

    function handleResetTwoWeeks() {
        const range =
            getDefaultShipmentDateRange()

        setFromD(range.fromD)
        setToD(range.toD)

        setAppliedFromD(
            range.fromD,
        )

        setAppliedToD(
            range.toD,
        )
    }

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',

                minWidth: 0,
                minHeight: 0,

                p: 1,

                display: 'flex',
                flexDirection: 'column',

                overflow: 'hidden',
            }}
        >
            {/* ===================== HEADER ===================== */}
            <Box
                sx={(theme) => ({
                    mb: 1,
                    px: 1.5,
                    py: 1.1,

                    border: '1px solid',
                    borderColor:
                        theme.palette.mode === 'dark'
                            ? 'rgba(148,163,184,0.16)'
                            : 'rgba(15,23,42,0.10)',

                    borderRadius: 2,

                    bgcolor:
                        theme.palette.mode === 'dark'
                            ? '#0d1418'
                            : '#f8fafc',
                })}
            >
                {/* TITLE + DATE FILTER */}
                <Stack
                    direction="row"
                    spacing={2}
                    sx={{
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    {/* LEFT TITLE */}
                    <Box>
                        <Typography
                            sx={{
                                fontFamily: 'monospace',
                                fontSize: 17,
                                fontWeight: 900,
                                letterSpacing: 0.5,
                            }}
                        >
                            SHIPMENT FULFILLMENT — GANTT / HEATMAP
                        </Typography>

                        <Typography
                            sx={{
                                mt: 0.25,
                                fontFamily: 'monospace',
                                fontSize: 10.5,
                                color: 'text.secondary',
                            }}
                        >
                            Rows: CusId · ShipBy — Columns: ExportD — Cell color/label:
                            FnRatio (FnQty / PoQty)
                        </Typography>
                    </Box>

                    {/* RIGHT FILTER */}
                    <Stack
                        direction="row"
                        spacing={0.75}
                        sx={{
                            alignItems: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <TextField
                            label="From"
                            type="date"
                            size="small"
                            value={fromD}
                            onChange={(event) =>
                                setFromD(event.target.value)
                            }
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                            }}
                            sx={{
                                width: 145,

                                '& .MuiInputBase-root': {
                                    height: 34,
                                    fontSize: 12,
                                },
                            }}
                        />

                        <Typography
                            sx={{
                                color: 'text.secondary',
                                fontSize: 12,
                            }}
                        >
                            →
                        </Typography>

                        <TextField
                            label="To"
                            type="date"
                            size="small"
                            value={toD}
                            onChange={(event) =>
                                setToD(event.target.value)
                            }
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                            }}
                            sx={{
                                width: 145,

                                '& .MuiInputBase-root': {
                                    height: 34,
                                    fontSize: 12,
                                },
                            }}
                        />

                        <Button
                            size="small"
                            variant="contained"
                            disabled={loading}
                            onClick={handleApplyDate}
                            sx={{
                                minWidth: 60,
                                height: 34,
                                textTransform: 'none',
                            }}
                        >
                            Apply
                        </Button>

                        <Button
                            size="small"
                            variant="outlined"
                            disabled={loading}
                            onClick={handleResetTwoWeeks}
                            sx={{
                                height: 34,
                                textTransform: 'none',
                            }}
                        >
                            14 Days
                        </Button>

                        <Button
                            size="small"
                            variant="outlined"
                            disabled={loading}
                            onClick={() =>
                                setRefreshKey(
                                    (value) => value + 1,
                                )
                            }
                            sx={{
                                minWidth: 70,
                                height: 34,
                                textTransform: 'none',
                            }}
                        >
                            Refresh
                        </Button>
                    </Stack>
                </Stack>

                {/* ===================== LEGEND ===================== */}
                <Stack
                    direction="row"
                    spacing={3}
                    sx={{
                        mt: 1,
                        alignItems: 'center',
                    }}
                >
                    {/* COLOR SCALE */}
                    <Stack
                        direction="row"
                        spacing={0.8}
                        sx={{
                            alignItems: 'center',
                        }}
                    >
                        <Typography
                            sx={{
                                fontFamily: 'monospace',
                                fontSize: 10,
                                color: 'text.secondary',
                            }}
                        >
                            0%
                        </Typography>

                        <Box
                            sx={{
                                width: 130,
                                height: 8,
                                borderRadius: 0.5,

                                background:
                                    'linear-gradient(90deg, #d94b42 0%, #dc9939 45%, #59b979 100%)',
                            }}
                        />

                        <Typography
                            sx={{
                                fontFamily: 'monospace',
                                fontSize: 10,
                                color: 'text.secondary',
                            }}
                        >
                            100%
                        </Typography>
                    </Stack>

                    {/* NO SHIPMENT */}
                    <Stack
                        direction="row"
                        spacing={0.6}
                        sx={{
                            alignItems: 'center',
                        }}
                    >
                        <Typography
                            sx={{
                                fontFamily: 'monospace',
                                fontSize: 10,
                                color: 'text.secondary',
                            }}
                        >
                            ▧
                        </Typography>

                        <Typography
                            sx={{
                                fontFamily: 'monospace',
                                fontSize: 10,
                                color: 'text.secondary',
                            }}
                        >
                            hatched = no shipment that day
                        </Typography>
                    </Stack>

                    {/* STOCK */}
                    <Stack
                        direction="row"
                        spacing={0.6}
                        sx={{
                            alignItems: 'center',
                            opacity: 0.55,
                        }}
                    >
                        <Box
                            sx={{
                                width: 7,
                                height: 7,
                                bgcolor: 'text.secondary',
                            }}
                        />

                        <Typography
                            sx={{
                                fontFamily: 'monospace',
                                fontSize: 10,
                                color: 'text.secondary',
                            }}
                        >
                            Stock row = warehouse stock (no ShipBy)
                        </Typography>
                    </Stack>

                    <Box sx={{ flex: 1 }} />

                    {lastUpdated && (
                        <Typography
                            sx={{
                                fontFamily: 'monospace',
                                fontSize: 9.5,
                                color: 'text.secondary',
                            }}
                        >
                            Updated {lastUpdated.toLocaleTimeString()}
                        </Typography>
                    )}
                </Stack>
            </Box>

            {/* ERROR */}
            {error && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 0.75,
                    }}
                >
                    {error}
                </Alert>
            )}

            {/* HEATMAP */}
            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    position: 'relative',
                }}
            >
                {loading &&
                    data.length === 0 ? (
                    <Box
                        sx={{
                            height: '100%',

                            display: 'grid',

                            placeItems:
                                'center',
                        }}
                    >
                        <CircularProgress
                            size={28}
                        />
                    </Box>
                ) : (
                    <ShipmentHeatmap
                        dates={dates}
                        rows={rows}
                    />
                )}
            </Box>
        </Box>
    )
}
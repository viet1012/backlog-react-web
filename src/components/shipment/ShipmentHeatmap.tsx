import {
    Box,
    Tooltip,
    Typography,
} from '@mui/material'

import type {
    ShipmentHeatmapRow,
} from '../../types/shipment'

interface ShipmentHeatmapProps {
    dates: string[]
    rows: ShipmentHeatmapRow[]
}

function formatHeaderDate(
    value: string,
): string {
    const date = new Date(
        `${value}T00:00:00`,
    )

    return new Intl.DateTimeFormat(
        'en-GB',
        {
            day: '2-digit',
            month: '2-digit',
        },
    ).format(date)
}

function normalizeRatio(
    value: number,
): number {
    if (!Number.isFinite(value)) {
        return 0
    }

    return Math.max(
        0,
        Math.min(value, 1),
    )
}

function ratioColor(
    ratio: number,
): string {
    const normalized =
        normalizeRatio(ratio)

    if (normalized >= 0.9) {
        return '#4caf72'
    }

    if (normalized >= 0.7) {
        return '#8caf58'
    }

    if (normalized >= 0.5) {
        return '#d3b447'
    }

    if (normalized >= 0.3) {
        return '#e69a38'
    }

    return '#d94b43'
}

export function ShipmentHeatmap({
    dates,
    rows,
}: ShipmentHeatmapProps) {
    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                overflow: 'auto',

                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
            }}
        >
            <Box
                sx={{
                    display: 'grid',

                    gridTemplateColumns: `
            160px
            repeat(${dates.length}, minmax(78px, 1fr))
          `,

                    minWidth:
                        160 + dates.length * 78,
                }}
            >
                {/* HEADER */}
                <HeatmapHeaderCell>
                    Customer
                </HeatmapHeaderCell>

                {dates.map((date) => (
                    <HeatmapHeaderCell
                        key={date}
                    >
                        {formatHeaderDate(date)}
                    </HeatmapHeaderCell>
                ))}

                {/* ROWS */}
                {rows.map((row) => (
                    <Box
                        key={row.key}
                        sx={{
                            display: 'contents',
                        }}
                    >
                        <Box
                            sx={{
                                minHeight: 42,
                                px: 1.25,

                                display: 'flex',
                                alignItems: 'center',

                                borderRight: '1px solid',
                                borderBottom: '1px solid',
                                borderColor: 'divider',

                                bgcolor:
                                    'background.paper',
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                }}
                            >
                                {row.cusId}

                                <Box
                                    component="span"
                                    sx={{
                                        ml: 0.75,
                                        fontWeight: 400,
                                        color:
                                            'text.secondary',
                                    }}
                                >
                                    / {row.shipBy}
                                </Box>
                            </Typography>
                        </Box>

                        {dates.map((date) => {
                            const cell =
                                row.cells[date]

                            return (
                                <HeatmapCell
                                    key={`${row.key}-${date}`}
                                    cell={cell}
                                />
                            )
                        })}
                    </Box>
                ))}
            </Box>
        </Box>
    )
}

function HeatmapHeaderCell({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <Box
            sx={{
                position: 'sticky',
                top: 0,
                zIndex: 2,

                minHeight: 38,

                px: 1,

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                borderRight: '1px solid',
                borderBottom: '1px solid',
                borderColor: 'divider',

                bgcolor: 'background.paper',
            }}
        >
            <Typography
                sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'text.secondary',
                }}
            >
                {children}
            </Typography>
        </Box>
    )
}

interface HeatmapCellProps {
    cell:
    | ShipmentHeatmapRow['cells'][string]
    | undefined
}

function HeatmapCell({
    cell,
}: HeatmapCellProps) {
    if (!cell) {
        return (
            <Box
                sx={(theme) => ({
                    minHeight: 42,

                    borderRight:
                        '1px solid',

                    borderBottom:
                        '1px solid',

                    borderColor:
                        theme.palette.divider,

                    background:
                        theme.palette.mode === 'dark'
                            ? 'repeating-linear-gradient(45deg, #101923, #101923 4px, #121e29 4px, #121e29 8px)'
                            : '#f7f9fc',
                })}
            />
        )
    }

    const percent =
        Math.round(
            normalizeRatio(
                cell.ratio,
            ) * 100,
        )

    return (
        <Tooltip
            arrow
            title={
                <>
                    <div>
                        PO Qty: {cell.poQty}
                    </div>

                    <div>
                        Final Qty: {cell.fnQty}
                    </div>

                    <div>
                        Fulfillment: {percent}%
                    </div>
                </>
            }
        >
            <Box
                sx={{
                    minHeight: 42,

                    p: 0.5,

                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',

                    borderRight: '1px solid',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Box
                    sx={{
                        width: '80%',
                        py: 0.45,

                        textAlign: 'center',

                        borderRadius: 1,

                        bgcolor:
                            ratioColor(
                                cell.ratio,
                            ),

                        color: '#0f172a',

                        fontSize: 11,
                        fontWeight: 800,
                    }}
                >
                    {percent}%
                </Box>
            </Box>
        </Tooltip>
    )
}
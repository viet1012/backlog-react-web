import {
    Box,
    Tooltip,
    Typography,
} from '@mui/material'

import type { ReactNode } from 'react'

import type {
    ShipmentHeatmapRow,
} from '../../types/shipment'
import { ShipByBadge } from '../common/shipment/ShipByBadge'


interface ShipmentHeatmapProps {
    dates: string[]
    rows: ShipmentHeatmapRow[]
}


// =========================================================
// DATE
// =========================================================

function parseDate(value: string): Date {
    return new Date(`${value}T00:00:00`)
}


function formatDay(value: string): string {
    return new Intl.DateTimeFormat(
        'en-GB',
        {
            day: '2-digit',
        },
    ).format(parseDate(value))
}


function formatMonth(value: string): string {
    return new Intl.DateTimeFormat(
        'en-GB',
        {
            month: 'short',
        },
    )
        .format(parseDate(value))
        .toUpperCase()
}


function formatWeekday(value: string): string {
    return new Intl.DateTimeFormat(
        'en-GB',
        {
            weekday: 'short',
        },
    )
        .format(parseDate(value))
        .toUpperCase()
}


function isWeekend(value: string): boolean {
    const day =
        parseDate(value).getDay()

    return day === 0 || day === 6
}


function getTodayString(): string {
    const now = new Date()

    const year =
        now.getFullYear()

    const month =
        String(now.getMonth() + 1)
            .padStart(2, '0')

    const day =
        String(now.getDate())
            .padStart(2, '0')

    return `${year}-${month}-${day}`
}


// =========================================================
// RATIO
// =========================================================

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

    if (normalized >= 1) {
        return '#48a868'
    }

    if (normalized >= 0.9) {
        return '#67ad7d'
    }

    if (normalized >= 0.7) {
        return '#a8b85c'
    }

    if (normalized >= 0.5) {
        return '#d8b34f'
    }

    if (normalized >= 0.3) {
        return '#dc8d45'
    }

    return '#cf5b55'
}


// =========================================================
// MAIN
// =========================================================

export function ShipmentHeatmap({
    dates,
    rows,
}: ShipmentHeatmapProps) {

    const today =
        getTodayString()

    return (
        <Box
            sx={(theme) => ({
                width: '100%',
                height: '100%',

                overflow: 'auto',

                border:
                    `1px solid ${theme.palette.divider}`,

                borderRadius: 2,

                bgcolor:
                    'background.paper',

                boxShadow:
                    theme.palette.mode === 'dark'
                        ? '0 8px 24px rgba(0,0,0,0.16)'
                        : '0 8px 24px rgba(15,23,42,0.05)',

                '&::-webkit-scrollbar': {
                    width: 9,
                    height: 9,
                },

                '&::-webkit-scrollbar-thumb': {
                    bgcolor:
                        theme.palette.mode === 'dark'
                            ? '#475569'
                            : '#cbd5e1',

                    borderRadius: 8,
                },

                '&::-webkit-scrollbar-track': {
                    bgcolor:
                        theme.palette.mode === 'dark'
                            ? '#0f172a'
                            : '#f8fafc',
                },
            })}
        >

            <Box
                sx={{
                    display: 'grid',

                    gridTemplateColumns: `
            190px
            repeat(
              ${dates.length},
              minmax(82px, 1fr)
            )
          `,

                    minWidth:
                        190 +
                        dates.length * 82,
                }}
            >

                {/* =================================================
            CUSTOMER HEADER
        ================================================= */}

                <CustomerHeaderCell />


                {/* =================================================
            DATE HEADERS
        ================================================= */}

                {dates.map((date) => (
                    <DateHeaderCell
                        key={date}
                        date={date}
                        today={date === today}
                    />
                ))}


                {/* =================================================
            ROWS
        ================================================= */}

                {rows.map((row) => (

                    <Box
                        key={row.key}
                        sx={{
                            display: 'contents',

                            '&:hover > *': {
                                bgcolor:
                                    'action.hover',
                            },
                        }}
                    >

                        <CustomerCell
                            cusId={row.cusId}
                            shipBy={row.shipBy}
                        />


                        {dates.map((date) => {

                            const cell =
                                row.cells[date]

                            return (
                                <HeatmapCell
                                    key={
                                        `${row.key}-${date}`
                                    }
                                    cell={cell}
                                    weekend={
                                        isWeekend(date)
                                    }
                                    today={
                                        date === today
                                    }
                                />
                            )
                        })}

                    </Box>

                ))}

            </Box>

        </Box>
    )
}


// =========================================================
// CUSTOMER HEADER
// =========================================================

function CustomerHeaderCell() {
    return (
        <Box
            sx={(theme) => ({
                position: 'sticky',

                top: 0,
                left: 0,

                zIndex: 5,

                minHeight: 52,

                px: 1.5,

                display: 'flex',
                alignItems: 'center',

                borderRight:
                    `1px solid ${theme.palette.divider}`,

                borderBottom:
                    `1px solid ${theme.palette.divider}`,

                bgcolor:
                    theme.palette.mode === 'dark'
                        ? '#172033'
                        : '#f3f6fa',
            })}
        >
            <Box>

                <Typography
                    sx={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: 0.4,
                    }}
                >
                    CUSTOMER
                </Typography>

                <Typography
                    sx={{
                        mt: 0.1,

                        fontSize: 9.5,
                        fontWeight: 500,

                        color:
                            'text.secondary',
                    }}
                >
                    SHIP BY
                </Typography>

            </Box>
        </Box>
    )
}


// =========================================================
// DATE HEADER
// =========================================================

interface DateHeaderCellProps {
    date: string
    today: boolean
}


function DateHeaderCell({
    date,
    today,
}: DateHeaderCellProps) {

    const weekend =
        isWeekend(date)

    return (
        <Box
            sx={(theme) => ({
                position: 'sticky',

                top: 0,

                zIndex: 3,

                minHeight: 52,

                display: 'flex',
                flexDirection: 'column',

                alignItems: 'center',
                justifyContent: 'center',

                borderRight:
                    `1px solid ${theme.palette.divider}`,

                borderBottom:
                    today
                        ? `2px solid ${theme.palette.primary.main}`
                        : `1px solid ${theme.palette.divider}`,

                bgcolor:
                    today
                        ? theme.palette.mode === 'dark'
                            ? 'rgba(59,130,246,0.15)'
                            : 'rgba(59,130,246,0.08)'
                        : weekend
                            ? theme.palette.mode === 'dark'
                                ? '#182235'
                                : '#f7f8fb'
                            : theme.palette.mode === 'dark'
                                ? '#172033'
                                : '#f3f6fa',
            })}
        >

            <Typography
                sx={{
                    fontSize: 11,
                    fontWeight: 800,

                    lineHeight: 1.1,

                    color:
                        today
                            ? 'primary.main'
                            : 'text.primary',
                }}
            >
                {formatDay(date)}
                {' '}
                {formatMonth(date)}
            </Typography>


            <Typography
                sx={{
                    mt: 0.35,

                    fontSize: 9,
                    fontWeight: 700,

                    lineHeight: 1,

                    letterSpacing: 0.5,

                    color:
                        today
                            ? 'primary.main'
                            : 'text.secondary',
                }}
            >
                {today
                    ? 'TODAY'
                    : formatWeekday(date)}
            </Typography>

        </Box>
    )
}


// =========================================================
// CUSTOMER CELL
// =========================================================

interface CustomerCellProps {
    cusId: string
    shipBy: string
}

function CustomerCell({
    cusId,
    shipBy,
}: CustomerCellProps) {
    return (
        <Box
            sx={(theme) => ({
                position: 'sticky',
                left: 0,
                zIndex: 2,

                minHeight: 54,

                px: 1.25,
                py: 0.5,

                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',

                borderRight:
                    `1px solid ${theme.palette.divider}`,

                borderBottom:
                    `1px solid ${theme.palette.divider}`,

                bgcolor:
                    theme.palette.background.paper,
            })}
        >
            <Typography
                noWrap
                title={cusId}
                sx={{
                    maxWidth: 165,
                    fontSize: 11.5,
                    fontWeight: 750,
                    lineHeight: 1.2,
                }}
            >
                {cusId}
            </Typography>

            <Box sx={{ mt: 0.4 }}>
                <ShipByBadge
                    shipBy={shipBy}
                />
            </Box>
        </Box>
    )
}
// =========================================================
// HEATMAP CELL
// =========================================================

interface HeatmapCellProps {
    cell:
    | ShipmentHeatmapRow['cells'][string]
    | undefined

    weekend: boolean

    today: boolean
}


function HeatmapCell({
    cell,
    weekend,
    today,
}: HeatmapCellProps) {

    if (!cell) {
        return (
            <Box
                sx={(theme) => ({
                    minHeight: 52,

                    borderRight:
                        `1px solid ${theme.palette.divider}`,

                    borderBottom:
                        `1px solid ${theme.palette.divider}`,

                    bgcolor:
                        today
                            ? theme.palette.mode === 'dark'
                                ? 'rgba(59,130,246,0.04)'
                                : 'rgba(59,130,246,0.025)'
                            : weekend
                                ? theme.palette.mode === 'dark'
                                    ? '#111b2a'
                                    : '#fafbfc'
                                : 'background.paper',

                    backgroundImage:
                        theme.palette.mode === 'dark'
                            ? 'repeating-linear-gradient(135deg, transparent, transparent 5px, rgba(255,255,255,0.015) 5px, rgba(255,255,255,0.015) 10px)'
                            : 'repeating-linear-gradient(135deg, transparent, transparent 5px, rgba(15,23,42,0.018) 5px, rgba(15,23,42,0.018) 10px)',
                })}
            />
        )
    }


    const ratio =
        normalizeRatio(cell.ratio)

    const percent =
        Math.round(
            ratio * 100,
        )


    return (
        <Tooltip
            arrow

            placement="top"

            title={
                <TooltipContent
                    poQty={cell.poQty}
                    fnQty={cell.fnQty}
                    percent={percent}
                />
            }
        >

            <Box
                sx={(theme) => ({
                    minHeight: 52,

                    p: 0.55,

                    display: 'flex',

                    alignItems: 'center',
                    justifyContent: 'center',

                    borderRight:
                        `1px solid ${theme.palette.divider}`,

                    borderBottom:
                        `1px solid ${theme.palette.divider}`,

                    bgcolor:
                        today
                            ? theme.palette.mode === 'dark'
                                ? 'rgba(59,130,246,0.04)'
                                : 'rgba(59,130,246,0.025)'
                            : weekend
                                ? theme.palette.mode === 'dark'
                                    ? '#111b2a'
                                    : '#fafbfc'
                                : 'background.paper',
                })}
            >

                <Box
                    sx={{
                        width: '100%',

                        minHeight: 40,

                        px: 0.5,
                        py: 0.4,

                        display: 'flex',
                        flexDirection: 'column',

                        alignItems: 'center',
                        justifyContent: 'center',

                        borderRadius: 1.25,

                        bgcolor:
                            ratioColor(
                                cell.ratio,
                            ),

                        color: '#102118',

                        cursor: 'default',

                        transition:
                            'transform 120ms ease, filter 120ms ease, box-shadow 120ms ease',

                        '&:hover': {
                            transform:
                                'translateY(-1px)',

                            filter:
                                'brightness(1.04)',

                            boxShadow:
                                '0 3px 8px rgba(15,23,42,0.18)',
                        },
                    }}
                >

                    <Typography
                        sx={{
                            fontSize: 12,
                            fontWeight: 900,

                            lineHeight: 1.1,

                            fontVariantNumeric:
                                'tabular-nums',
                        }}
                    >
                        {percent}%
                    </Typography>


                    <Typography
                        sx={{
                            mt: 0.2,

                            fontSize: 8.5,
                            fontWeight: 650,

                            lineHeight: 1,

                            opacity: 0.78,

                            fontVariantNumeric:
                                'tabular-nums',
                        }}
                    >
                        {cell.fnQty}
                        {' / '}
                        {cell.poQty}
                    </Typography>

                </Box>

            </Box>

        </Tooltip>
    )
}


// =========================================================
// TOOLTIP
// =========================================================

interface TooltipContentProps {
    poQty: number
    fnQty: number
    percent: number
}


function TooltipContent({
    poQty,
    fnQty,
    percent,
}: TooltipContentProps) {

    return (
        <Box
            sx={{
                minWidth: 130,
                py: 0.25,
            }}
        >

            <Typography
                sx={{
                    mb: 0.5,

                    fontSize: 11,
                    fontWeight: 800,
                }}
            >
                Fulfillment
            </Typography>


            <TooltipRow
                label="PO Qty"
                value={poQty}
            />

            <TooltipRow
                label="Final Qty"
                value={fnQty}
            />

            <TooltipRow
                label="Ratio"
                value={`${percent}%`}
                strong
            />

        </Box>
    )
}


interface TooltipRowProps {
    label: string
    value: ReactNode
    strong?: boolean
}


function TooltipRow({
    label,
    value,
    strong = false,
}: TooltipRowProps) {

    return (
        <Box
            sx={{
                display: 'flex',

                justifyContent:
                    'space-between',

                gap: 2,

                fontSize: 10,
            }}
        >

            <Box
                component="span"
                sx={{
                    opacity: 0.72,
                }}
            >
                {label}
            </Box>

            <Box
                component="span"
                sx={{
                    fontWeight:
                        strong ? 800 : 600,

                    fontVariantNumeric:
                        'tabular-nums',
                }}
            >
                {value}
            </Box>

        </Box>
    )
}
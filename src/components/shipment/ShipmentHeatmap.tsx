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
import { uiTokens } from '../../theme/uiTokens'


interface ShipmentHeatmapProps {
    dates: string[]
    rows: ShipmentHeatmapRow[]

    selectedRowKey?: string | null
    selectedCellKey?: string | null

    onRowClick?: (
        row: ShipmentHeatmapRow,
    ) => void

    onCellClick?: (
        row: ShipmentHeatmapRow,
        date: string,
    ) => void
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
    selectedRowKey,
    selectedCellKey,
    onRowClick,
    onCellClick,
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

                borderRadius: uiTokens.card.borderRadius,

                bgcolor:
                    'background.paper',

                boxShadow:
                    theme.palette.mode === 'dark'
                        ? '0 2px 8px rgba(0,0,0,0.16)'
                        : '0 2px 8px rgba(15,23,42,0.05)',

                '&::-webkit-scrollbar': {
                    width: 9,
                    height: 9,
                },

                '&::-webkit-scrollbar-thumb': {
                    bgcolor:
                        theme.palette.mode === 'dark'
                            ? '#475569'
                            : '#cbd5e1',

                    borderRadius: '4px',
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

                {rows.map((row) => {
                    const rowSelected =
                        selectedRowKey === row.key

                    return (
                        <Box
                            key={row.key}
                            sx={{
                                display: 'contents',
                            }}
                        >
                            <CustomerCell
                                cusId={row.cusId}
                                shipBy={row.shipBy}
                                selected={rowSelected}
                                onClick={() =>
                                    onRowClick?.(row)
                                }
                            />

                            {dates.map((date) => {
                                const cell =
                                    row.cells[date]

                                const cellKey =
                                    `${row.key}-${date}`

                                return (
                                    <HeatmapCell
                                        key={cellKey}
                                        cell={cell}
                                        weekend={isWeekend(date)}
                                        today={date === today}

                                        selected={
                                            selectedCellKey === cellKey
                                        }

                                        rowSelected={
                                            rowSelected
                                        }

                                        onClick={
                                            cell
                                                ? () =>
                                                    onCellClick?.(
                                                        row,
                                                        date,
                                                    )
                                                : undefined
                                        }
                                    />
                                )
                            })}
                        </Box>
                    )
                })}

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
                        fontSize: uiTokens.table.headerFontSize,
                        fontWeight: 800,
                        letterSpacing: 0.4,
                    }}
                >
                    CUSTOMER
                </Typography>

                <Typography
                    sx={{
                        mt: 0.1,

                        fontSize: uiTokens.sidebar.sectionFontSize,
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
                    fontSize: uiTokens.table.headerFontSize,
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

                    fontSize: uiTokens.sidebar.sectionFontSize,
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
    selected?: boolean
    onClick?: () => void
}

function CustomerCell({
    cusId,
    shipBy,
    selected = false,
    onClick,
}: CustomerCellProps) {
    return (
        <Box
            onClick={onClick}
            sx={(theme) => ({
                position: 'sticky',
                left: 0,
                zIndex: 2,

                minHeight: 38,

                px: 1.25,
                py: 0.5,

                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',

                cursor: 'pointer',

                borderRight:
                    `1px solid ${theme.palette.divider}`,

                borderBottom:
                    `1px solid ${theme.palette.divider}`,

                bgcolor:
                    theme.palette.background.paper,
                boxShadow: selected
                    ? `inset 2px 0 0 ${theme.palette.primary.main},
       inset 0 1px 0 ${theme.palette.primary.main},
       inset 0 -1px 0 ${theme.palette.primary.main}`
                    : 'none',
                '&:hover': {
                    bgcolor: 'action.hover',
                },
            })}
        >
            <Typography
                noWrap
                sx={{
                    fontSize: uiTokens.table.cellFontSize,
                    fontWeight: 750,
                }}
            >
                {cusId}
            </Typography>

            <Box sx={{ mt: 0.4 }}>
                <ShipByBadge shipBy={shipBy} />
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

    selected?: boolean
    rowSelected?: boolean

    onClick?: () => void
}

function HeatmapCell({
    cell,
    weekend,
    today,
    selected = false,
    rowSelected = false,
    onClick,
}: HeatmapCellProps) {

    if (!cell) {
        return (
            <Box
                sx={(theme) => ({
                    minHeight: 42,

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

                    // highlight row kể cả cell trống
                    boxShadow: rowSelected
                        ? `inset 0 1px 0 ${theme.palette.primary.main},
                       inset 0 -1px 0 ${theme.palette.primary.main}`
                        : 'none',
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
                onClick={onClick}
                sx={(theme) => ({
                    position: 'relative',
                    minHeight: 38,

                    p: 0.55,

                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',

                    cursor: onClick
                        ? 'pointer'
                        : 'default',

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

                    // CHỈ highlight OUTER CELL
                    boxShadow:
                        selected
                            ? `inset 0 0 0 2px ${theme.palette.primary.main}`
                            : rowSelected
                                ? `inset 0 0 0 1px ${theme.palette.primary.main}`
                                : 'none',

                    transition:
                        'transform 160ms ease, box-shadow 160ms ease',

                    '&:hover': {
                        zIndex: 1,
                        transform: 'scale(1.02)',
                        boxShadow: selected
                            ? `inset 0 0 0 2px ${theme.palette.primary.main}, 0 3px 10px ${theme.palette.action.selected}`
                            : rowSelected
                                ? `inset 0 0 0 1px ${theme.palette.primary.main}, 0 3px 10px ${theme.palette.action.selected}`
                                : `0 3px 10px ${theme.palette.action.selected}`,
                    },

                    '@media (prefers-reduced-motion: reduce)': {
                        transition: 'none',
                        '&:hover': {
                            transform: 'none',
                        },
                    },
                })}
            >

                <Box
                    sx={{
                        width: '100%',

                        minHeight: 32,

                        px: 0.5,
                        py: 0.4,

                        display: 'flex',
                        flexDirection: 'column',

                        alignItems: 'center',
                        justifyContent: 'center',

                        borderRadius: 0.25,

                        bgcolor:
                            ratioColor(
                                cell.ratio,
                            ),

                        color: '#102118',

                        cursor: 'default',

                        transition:
                            'transform 120ms ease, filter 120ms ease, box-shadow 120ms ease',

                        '&:hover': {
                            filter: 'brightness(1.04)',
                        },

                        '@media (prefers-reduced-motion: reduce)': {
                            transition: 'none',
                        },
                    }}
                >

                    <Typography
                        sx={{
                            fontSize: uiTokens.table.cellFontSize,
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

                            fontSize: uiTokens.sidebar.sectionFontSize,
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

                    fontSize: uiTokens.kpi.secondaryFontSize,
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

                fontSize: uiTokens.kpi.secondaryFontSize,
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

import { Box, CircularProgress, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { uiTokens } from '../../theme/uiTokens'
import type {
    OdbfSummaryItem,
    OdbfSummaryMetric,
} from '../../types/odbf'
import {
    buildOdbfMatrix,
    calculateOdbfRatio,
    formatOdbfDate,
    type OdbfDataRowType,
    type OdbfProductSummary,
} from '../../utils/odbfSummaryMatrix'

interface OdbfSummaryTableProps {
    title: string
    items: OdbfSummaryItem[]
    metric: OdbfSummaryMetric
    loading?: boolean
}

const PRODUCT_COLUMN_WIDTH = 110
const STATUS_COLUMN_WIDTH = 100
const DATE_COLUMN_WIDTH = 72

const STATUS_COLUMN_LEFT = PRODUCT_COLUMN_WIDTH

function getLocalDateKey(date = new Date()): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function formatMetricValue(
    value: number,
    metric: OdbfSummaryMetric,
): string {
    if (value === 0) {
        return '-'
    }

    return value.toLocaleString(
        undefined,
        metric === 'countPo'
            ? { maximumFractionDigits: 0 }
            : { maximumFractionDigits: 20 },
    )
}

function OdbfValueCell({
    children,
    currentDate = false,
    ratio = false,
}: {
    children: ReactNode
    currentDate?: boolean
    ratio?: boolean
}) {
    const empty = children === '-'

    return (
        <Box
            component="td"
            data-current-date={currentDate || undefined}
            sx={(theme) => ({
                width: DATE_COLUMN_WIDTH,
                minWidth: DATE_COLUMN_WIDTH,
                maxWidth: DATE_COLUMN_WIDTH,
                height: uiTokens.table.rowHeight,
                boxSizing: 'border-box',
                px: 0.75,
                textAlign: 'right',
                whiteSpace: 'nowrap',
                fontWeight: ratio ? 700 : 500,
                fontVariantNumeric: 'tabular-nums',
                color: empty ? 'text.disabled' : 'text.primary',
                bgcolor: currentDate
                    ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.13 : 0.075)
                    : ratio
                        ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.055 : 0.025)
                        : theme.palette.background.paper,
                borderRight: currentDate
                    ? `1px solid ${alpha(theme.palette.primary.main, 0.4)}`
                    : `1px solid ${theme.palette.divider}`,
                borderLeft: currentDate
                    ? `1px solid ${alpha(theme.palette.primary.main, 0.4)}`
                    : undefined,
                borderBottom: `1px solid ${theme.palette.divider}`,
            })}
        >
            {children}
        </Box>
    )
}

function StickyBodyCell({
    children,
    width,
    left,
    rowSpan,
    scope,
    strong = false,
    tinted = false,
}: {
    children: ReactNode
    width: number
    left: number
    rowSpan?: number
    scope: 'row' | 'rowgroup'
    strong?: boolean
    tinted?: boolean
}) {
    return (
        <Box
            component="th"
            scope={scope}
            rowSpan={rowSpan}
            sx={(theme) => ({
                position: 'sticky',
                left,
                zIndex: 3,
                width,
                minWidth: width,
                maxWidth: width,
                height: uiTokens.table.rowHeight,
                boxSizing: 'border-box',
                px: 0.75,
                textAlign: 'left',
                verticalAlign: rowSpan ? 'top' : 'middle',
                whiteSpace: 'nowrap',
                fontWeight: strong ? 700 : 500,
                color: strong ? 'text.primary' : 'text.secondary',
                bgcolor: theme.palette.background.paper,
                boxShadow: tinted
                    ? `inset 0 0 0 9999px ${alpha(
                        theme.palette.primary.main,
                        theme.palette.mode === 'dark' ? 0.055 : 0.025,
                    )}`
                    : undefined,
                borderRight: `1px solid ${theme.palette.divider}`,
                borderBottom: `1px solid ${theme.palette.divider}`,
            })}
        >
            {children}
        </Box>
    )
}

function OdbfDataRow({
    label,
    rowType,
    product,
    dates,
    metric,
    currentDateKey,
    productHeader,
    groupStart = false,
}: {
    label: string
    rowType: OdbfDataRowType | 'ratio'
    product: OdbfProductSummary
    dates: string[]
    metric: OdbfSummaryMetric
    currentDateKey: string
    productHeader?: ReactNode
    groupStart?: boolean
}) {
    return (
        <Box
            component="tr"
            sx={(theme) => ({
                ...(groupStart && {
                    '& > th, & > td': {
                        borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.18)}`,
                    },
                }),
                '&:hover > *:not([data-current-date="true"])': {
                    boxShadow: `inset 0 0 0 9999px ${alpha(
                        theme.palette.primary.main,
                        theme.palette.mode === 'dark' ? 0.075 : 0.04,
                    )}`,
                },
            })}
        >
            {productHeader}

            <StickyBodyCell
                width={STATUS_COLUMN_WIDTH}
                left={STATUS_COLUMN_LEFT}
                scope="row"
                strong={rowType === 'ratio'}
                tinted={rowType === 'ratio'}
            >
                {label}
            </StickyBodyCell>

            {dates.map((date) => {
                const value = product.values.get(date)
                const currentDate = date === currentDateKey

                if (!value) {
                    return (
                        <OdbfValueCell
                            key={date}
                            currentDate={currentDate}
                            ratio={rowType === 'ratio'}
                        >
                            -
                        </OdbfValueCell>
                    )
                }

                if (rowType === 'ratio') {
                    const ratio = calculateOdbfRatio(value.completed, value.progress)

                    return (
                        <OdbfValueCell key={date} currentDate={currentDate} ratio>
                            {ratio === null ? '-' : `${Math.round(ratio)}%`}
                        </OdbfValueCell>
                    )
                }

                return (
                    <OdbfValueCell key={date} currentDate={currentDate}>
                        {formatMetricValue(value[rowType], metric)}
                    </OdbfValueCell>
                )
            })}
        </Box>
    )
}

function OdbfProductRows({
    product,
    dates,
    metric,
    currentDateKey,
}: {
    product: OdbfProductSummary
    dates: string[]
    metric: OdbfSummaryMetric
    currentDateKey: string
}) {
    const productHeader = (
        <StickyBodyCell
            width={PRODUCT_COLUMN_WIDTH}
            left={0}
            rowSpan={3}
            scope="rowgroup"
            strong
        >
            {product.productGrp}
        </StickyBodyCell>
    )

    return (
        <>
            <OdbfDataRow
                label="Completed"
                rowType="completed"
                product={product}
                dates={dates}
                metric={metric}
                currentDateKey={currentDateKey}
                productHeader={productHeader}
                groupStart
            />
            <OdbfDataRow
                label="On Progress"
                rowType="progress"
                product={product}
                dates={dates}
                metric={metric}
                currentDateKey={currentDateKey}
            />
            <OdbfDataRow
                label="Ratio"
                rowType="ratio"
                product={product}
                dates={dates}
                metric={metric}
                currentDateKey={currentDateKey}
            />
        </>
    )
}

export function OdbfSummaryTable({
    title,
    items,
    metric,
    loading = false,
}: OdbfSummaryTableProps) {
    const matrix = useMemo(
        () => buildOdbfMatrix(items, metric),
        [items, metric],
    )
    const currentDateKey = getLocalDateKey()

    return (
        <Box component="section" aria-label={title} sx={{ minWidth: 0 }}>
            <Typography
                component="h2"
                sx={{
                    mb: 0.5,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 0.45,
                    color: 'text.secondary',
                }}
            >
                {title}
            </Typography>

            {loading && items.length === 0 ? (
                <TableState minHeight={160}>
                    <CircularProgress size={24} />
                </TableState>
            ) : matrix.products.length === 0 ? (
                <TableState minHeight={120}>
                    <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
                        No ODBF summary data
                    </Typography>
                </TableState>
            ) : (
                <Box
                    sx={(theme) => ({
                        width: '100%',
                        minWidth: 0,
                        overflowX: 'auto',
                        overflowY: 'visible',
                        bgcolor: alpha(
                            theme.palette.background.paper,
                            theme.palette.mode === 'dark' ? 0.94 : 0.9,
                        ),
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: uiTokens.card.borderRadius,
                        boxShadow: theme.palette.mode === 'dark'
                            ? '0 2px 8px rgba(0,0,0,0.12)'
                            : '0 2px 8px rgba(15,23,42,0.04)',
                    })}
                >
                    <Box
                        component="table"
                        sx={{
                            width: 'max-content',
                            minWidth: '100%',
                            borderCollapse: 'separate',
                            borderSpacing: 0,
                            tableLayout: 'fixed',
                            fontSize: uiTokens.table.auxiliaryFontSize,
                        }}
                    >
                        <Box component="thead">
                            <Box component="tr">
                                <HeaderCell width={PRODUCT_COLUMN_WIDTH} align="left" stickyLeft={0}>
                                    ProductGrp
                                </HeaderCell>
                                <HeaderCell
                                    width={STATUS_COLUMN_WIDTH}
                                    align="left"
                                    stickyLeft={STATUS_COLUMN_LEFT}
                                >
                                    Status2
                                </HeaderCell>
                                {matrix.dates.map((date) => (
                                    <HeaderCell
                                        key={date}
                                        width={DATE_COLUMN_WIDTH}
                                        align="center"
                                        currentDate={date === currentDateKey}
                                    >
                                        {formatOdbfDate(date)}
                                    </HeaderCell>
                                ))}
                            </Box>
                        </Box>

                        <Box component="tbody">
                            {matrix.products.map((product) => (
                                <OdbfProductRows
                                    key={product.productGrp}
                                    product={product}
                                    dates={matrix.dates}
                                    metric={metric}
                                    currentDateKey={currentDateKey}
                                />
                            ))}
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    )
}

function HeaderCell({
    children,
    width,
    align,
    stickyLeft,
    currentDate = false,
}: {
    children: ReactNode
    width: number
    align: 'left' | 'center'
    stickyLeft?: number
    currentDate?: boolean
}) {
    const sticky = stickyLeft !== undefined

    return (
        <Box
            component="th"
            scope="col"
            data-current-date={currentDate || undefined}
            sx={(theme) => ({
                position: 'sticky',
                top: 0,
                left: stickyLeft,
                zIndex: sticky ? 5 : 4,
                width,
                minWidth: width,
                maxWidth: width,
                height: uiTokens.table.headerHeight,
                boxSizing: 'border-box',
                px: 0.75,
                textAlign: align,
                whiteSpace: 'nowrap',
                fontWeight: currentDate ? 800 : 700,
                color: currentDate ? 'primary.main' : 'text.secondary',
                bgcolor: theme.palette.background.paper,
                boxShadow: currentDate
                    ? `inset 0 0 0 9999px ${alpha(
                        theme.palette.primary.main,
                        theme.palette.mode === 'dark' ? 0.2 : 0.11,
                    )}`
                    : undefined,
                borderRight: currentDate
                    ? `1px solid ${alpha(theme.palette.primary.main, 0.5)}`
                    : `1px solid ${theme.palette.divider}`,
                borderLeft: currentDate
                    ? `1px solid ${alpha(theme.palette.primary.main, 0.5)}`
                    : undefined,
                borderBottom: `1px solid ${theme.palette.divider}`,
            })}
        >
            {children}
        </Box>
    )
}

function TableState({
    children,
    minHeight,
}: {
    children: ReactNode
    minHeight: number
}) {
    return (
        <Box
            sx={(theme) => ({
                minHeight,
                display: 'grid',
                placeItems: 'center',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: uiTokens.card.borderRadius,
                bgcolor: theme.palette.background.paper,
            })}
        >
            {children}
        </Box>
    )
}

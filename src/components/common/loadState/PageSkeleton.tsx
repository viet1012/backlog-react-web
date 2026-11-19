import { Box, Skeleton, type SxProps, type Theme } from '@mui/material'

import { useI18n } from '../../../i18n/useI18n'
import { useDelayedFlag } from '../../../hooks/useDelayedFlag'
import { uiTokens } from '../../../theme/uiTokens'

/**
 * Skeleton shaped like the content it stands in for. Shown only for the
 * FIRST load of a view (refreshing over existing data only spins the header
 * ⟳ button), and only after LOADING_DELAY_MS: fast loads show nothing.
 *
 *   table    header + rows (DataGrid, ODBF matrix, sub-tables)
 *   heatmap  label column + cell grid (Shipment)
 *   charts   grid of chart cards (Cost, EVN)
 *   kpi      row of KPI cards
 *   map      large map + side list (Machine Monitor)
 *   block    one rounded block (lazy tabs, panels)
 */
export type PageSkeletonVariant = 'table' | 'heatmap' | 'charts' | 'kpi' | 'map' | 'block'

interface PageSkeletonProps {
  variant?: PageSkeletonVariant
  /** table / heatmap rows */
  rows?: number
  /** table / heatmap columns, chart / kpi cards per row */
  columns?: number
  /** chart / kpi card count */
  count?: number
  /** 0 = show at once (e.g. the view already waited elsewhere) */
  delay?: number
  minHeight?: number | string
  sx?: SxProps<Theme>
}

const pulse = { animationDuration: '1.4s' } as const

export function PageSkeleton({
  variant = 'block',
  rows,
  columns,
  count,
  delay,
  minHeight,
  sx,
}: PageSkeletonProps) {
  const { t } = useI18n()
  const visible = useDelayedFlag(true, delay)

  return (
    <Box
      role="status"
      aria-busy="true"
      aria-label={t.common.loading}
      sx={[
        {
          flex: 1,
          minWidth: 0,
          minHeight: minHeight ?? 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          // keeps its space while hidden: no layout jump when it appears
          visibility: visible ? 'visible' : 'hidden',
          '& .MuiSkeleton-root': pulse,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {renderVariant(variant, { rows, columns, count })}
    </Box>
  )
}

function renderVariant(
  variant: PageSkeletonVariant,
  { rows, columns, count }: { rows?: number, columns?: number, count?: number },
) {
  switch (variant) {
    case 'table':
      return <TableSkeleton rows={rows ?? 8} columns={columns ?? 6} />
    case 'heatmap':
      return <HeatmapSkeleton rows={rows ?? 10} columns={columns ?? 14} />
    case 'charts':
      return <ChartsSkeleton count={count ?? 6} columns={columns ?? 3} />
    case 'kpi':
      return <KpiSkeleton count={count ?? 4} />
    case 'map':
      return <MapSkeleton rows={rows ?? 6} />
    default:
      return <Skeleton variant="rounded" sx={{ flex: 1, minHeight: 120, borderRadius: uiTokens.card.borderRadius }} />
  }
}

// widths vary a little so rows do not look like a barcode
const cellWidth = (row: number, col: number) => `${62 + ((row * 7 + col * 13) % 30)}%`

function TableSkeleton({ rows, columns }: { rows: number, columns: number }) {
  const grid = {
    display: 'grid',
    gridTemplateColumns: `minmax(90px, 1.4fr) repeat(${Math.max(1, columns - 1)}, minmax(0, 1fr))`,
    gap: 1.5,
    alignItems: 'center',
    px: 1.25,
  } as const

  return (
    <Box
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: uiTokens.card.borderRadius,
        overflow: 'hidden',
      })}
    >
      <Box sx={{ ...grid, height: uiTokens.table.headerHeight + 4, bgcolor: 'action.hover' }}>
        {Array.from({ length: columns }, (_, c) => (
          <Skeleton key={c} variant="text" width="55%" sx={{ fontSize: 12 }} />
        ))}
      </Box>
      {Array.from({ length: rows }, (_, r) => (
        <Box
          key={r}
          sx={(theme) => ({ ...grid, height: uiTokens.table.rowHeight + 6, borderTop: `1px solid ${theme.palette.divider}` })}
        >
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} variant="text" width={cellWidth(r, c)} sx={{ fontSize: 12 }} />
          ))}
        </Box>
      ))}
    </Box>
  )
}

function HeatmapSkeleton({ rows, columns }: { rows: number, columns: number }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `minmax(120px, 180px) repeat(${columns}, minmax(0, 1fr))`,
        gap: '3px',
      }}
    >
      <Box />
      {Array.from({ length: columns }, (_, c) => (
        <Skeleton key={`h${c}`} variant="text" width="70%" sx={{ fontSize: 11, justifySelf: 'center' }} />
      ))}
      {Array.from({ length: rows }, (_, r) => (
        <Box key={r} sx={{ display: 'contents' }}>
          <Skeleton variant="text" width={cellWidth(r, 1)} sx={{ fontSize: 12 }} />
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} variant="rounded" height={26} sx={{ borderRadius: '4px', opacity: 0.55 + ((r + c) % 4) * 0.12 }} />
          ))}
        </Box>
      ))}
    </Box>
  )
}

function ChartsSkeleton({ count, columns }: { count: number, columns: number }) {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: `repeat(${columns}, minmax(0, 1fr))` },
        gridAutoRows: 'minmax(180px, 1fr)',
        gap: 1,
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <Box
          key={i}
          sx={(theme) => ({
            p: 1.25,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: uiTokens.card.borderRadius,
          })}
        >
          <Skeleton variant="text" width="40%" sx={{ fontSize: 14 }} />
          <Skeleton variant="rounded" sx={{ flex: 1, borderRadius: '8px' }} />
        </Box>
      ))}
    </Box>
  )
}

function KpiSkeleton({ count }: { count: number }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))`, gap: 1 }}>
      {Array.from({ length: count }, (_, i) => (
        <Box
          key={i}
          sx={(theme) => ({
            p: 1.25,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: uiTokens.card.borderRadius,
          })}
        >
          <Skeleton variant="text" width="50%" sx={{ fontSize: uiTokens.kpi.labelFontSize }} />
          <Skeleton variant="text" width="70%" sx={{ fontSize: uiTokens.kpi.valueFontSize + 6 }} />
        </Box>
      ))}
    </Box>
  )
}

function MapSkeleton({ rows }: { rows: number }) {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 400px)',
        gap: 1,
        '@media (max-width: 760px)': { gridTemplateColumns: 'minmax(0, 1fr)', gridTemplateRows: '60vh auto' },
      }}
    >
      <Skeleton variant="rounded" sx={{ height: '100%', minHeight: 240, borderRadius: uiTokens.card.borderRadius }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, p: 1 }}>
        <Skeleton variant="text" width="45%" sx={{ fontSize: 16 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.75 }}>
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} variant="rounded" height={48} />)}
        </Box>
        <Skeleton variant="rounded" height={uiTokens.control.height} sx={{ mt: 0.5 }} />
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} variant="rounded" height={46} sx={{ opacity: 1 - i * 0.12 }} />
        ))}
      </Box>
    </Box>
  )
}

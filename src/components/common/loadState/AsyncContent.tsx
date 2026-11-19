import type { ReactNode } from 'react'
import { Box, Button, type SxProps, type Theme } from '@mui/material'
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'

import { useI18n } from '../../../i18n/useI18n'
import { FactoryNoRowsOverlay } from '../FactoryNoRowsOverlay'
import { PageSkeleton, type PageSkeletonVariant } from './PageSkeleton'

/**
 * One place that decides loading / error / empty for a data view, so every
 * page behaves the same:
 *
 *   has data            → children (a refresh only spins the header ⟳)
 *   error, no data      → FactoryNoRowsOverlay tone="error" + Retry
 *   first load          → PageSkeleton (nothing for the first 300 ms)
 *   loaded, empty       → FactoryNoRowsOverlay + an action, always:
 *                         "Clear filters" when filters are on, else "Refresh"
 *
 * An error while old data is still shown is the page's call (usually an
 * inline Alert above the content) – AsyncContent keeps showing the data.
 */
interface AsyncContentProps {
  loading: boolean
  error?: string | null
  /** Something to show (old data counts) */
  hasData: boolean
  children: ReactNode

  skeleton?: PageSkeletonVariant
  /** Full custom skeleton instead of `skeleton` */
  skeletonNode?: ReactNode
  skeletonProps?: { rows?: number, columns?: number, count?: number }

  onRetry?: () => void
  /** Shown as the empty-state action when filters are active */
  onClearFilters?: () => void
  emptyTitle?: ReactNode
  emptyHint?: ReactNode | null
  /** Replaces the default empty-state action */
  emptyAction?: ReactNode

  /** compact: LED board + text only (cards, sub-tables) */
  variant?: 'scene' | 'compact'
  minHeight?: number | string
  sx?: SxProps<Theme>
}

export function AsyncContent({
  loading,
  error,
  hasData,
  children,
  skeleton = 'block',
  skeletonNode,
  skeletonProps,
  onRetry,
  onClearFilters,
  emptyTitle,
  emptyHint,
  emptyAction,
  variant = 'scene',
  minHeight,
  sx,
}: AsyncContentProps) {
  if (hasData) return <>{children}</>

  const frame = (node: ReactNode) => (
    <Box
      sx={[
        { flex: 1, minWidth: 0, minHeight: minHeight ?? 0, display: 'flex', flexDirection: 'column' },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {node}
    </Box>
  )

  if (error) {
    return frame(
      <FactoryNoRowsOverlay
        tone="error"
        variant={variant}
        detail={error}
        onRetry={onRetry}
        retrying={loading}
        minHeight={minHeight}
      />,
    )
  }

  if (loading) {
    return frame(skeletonNode ?? <PageSkeleton variant={skeleton} {...skeletonProps} minHeight={minHeight} />)
  }

  return frame(
    <FactoryNoRowsOverlay
      variant={variant}
      title={emptyTitle}
      hint={emptyHint}
      minHeight={minHeight}
      action={emptyAction ?? <EmptyStateAction onClearFilters={onClearFilters} onRefresh={onRetry} />}
    />,
  )
}

/**
 * Default empty-state button: "Clear filters" if the view is filtered,
 * otherwise "Refresh". Renders nothing when neither handler is given.
 */
export function EmptyStateAction({
  onClearFilters,
  onRefresh,
}: {
  onClearFilters?: () => void
  onRefresh?: () => void
}) {
  const { t } = useI18n()

  if (!onClearFilters && !onRefresh) return null

  const clear = Boolean(onClearFilters)

  return (
    <Button
      variant="outlined"
      size="small"
      onClick={clear ? onClearFilters : onRefresh}
      startIcon={clear ? <FilterAltOffOutlinedIcon /> : <RefreshRoundedIcon />}
      sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
    >
      {clear ? t.common.clearFilters : t.common.refresh}
    </Button>
  )
}

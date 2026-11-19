import type { ReactNode } from 'react'
import { Box, type SxProps, type Theme } from '@mui/material'

import { FactoryNoRowsOverlay } from '../FactoryNoRowsOverlay'
import { EmptyStateAction } from './EmptyStateAction'
import { FilteredEmptyState } from './FilteredEmptyState'
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
  /** Pass only while filters are active: empty then means "no match" + Clear filters */
  onClearFilters?: () => void
  /** Active filters in words, shown in the "no match" hint */
  filterSummary?: string
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
  filterSummary,
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

  // Trống vì bộ lọc (vd link cũ, dữ liệu không còn): nói rõ + Xóa bộ lọc
  if (onClearFilters && !emptyAction) {
    return frame(
      <FilteredEmptyState
        variant={variant}
        minHeight={minHeight}
        summary={filterSummary}
        title={emptyTitle}
        hint={emptyHint ?? undefined}
        onClearFilters={onClearFilters}
      />,
    )
  }

  return frame(
    <FactoryNoRowsOverlay
      variant={variant}
      title={emptyTitle}
      hint={emptyHint}
      minHeight={minHeight}
      action={emptyAction ?? <EmptyStateAction onRefresh={onRetry} />}
    />,
  )
}

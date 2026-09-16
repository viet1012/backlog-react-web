import { Box, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import type { BacklogStatusSummaryRow } from '../../../services/reportService'
import { formatNumber, getCell } from './backlogSummaryUtils'

interface BacklogSummaryCellProps {
  row: BacklogStatusSummaryRow
  date: string
  today: string
  statusKey: string
  selectedCell: {
    status: string
    date: string
  } | null
  onCellClick: (
    cell: {
      status: string
      date: string
    } | null,
  ) => void
}

export function BacklogSummaryCell({
  row,
  date,
  today,
  statusKey,
  selectedCell,
  onCellClick,
}: BacklogSummaryCellProps) {
  const cell = getCell(row, date)
  const poCount = cell?.poCount ?? 0
  const qty = cell?.qty ?? 0
  const isToday = date === today
  const isFinished = statusKey === 'FINISHED'
  const isZero = poCount === 0
  const isOverdue = !isFinished && poCount > 0 && date <= today
  const showTodayCellHighlight =
    isToday && !isFinished && !isZero && !isOverdue
  const selected =
    selectedCell?.status === row.status
    && selectedCell.date === date

  return (
    <Box
      onClick={(event) => {
        event.stopPropagation()

        const nextSelectedCell = selected
          ? null
          : { status: row.status, date }

        onCellClick(nextSelectedCell)
      }}
      sx={(theme) => ({
        position: 'relative',
        boxSizing: 'border-box',
        minWidth: 0,
        px: 1,
        py: 0.3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        bgcolor: isFinished
          ? alpha(
            theme.palette.grey[500],
            theme.palette.mode === 'dark' ? 0.10 : 0.07,
          )
          : isZero
            ? alpha(
              theme.palette.grey[500],
              theme.palette.mode === 'dark' ? 0.10 : 0.08,
            )
            : isOverdue
              ? alpha(
                theme.palette.error.main,
                theme.palette.mode === 'dark' ? 0.20 : 0.11,
              )
              : isToday
                ? alpha(
                  theme.palette.primary.main,
                  theme.palette.mode === 'dark' ? 0.13 : 0.075,
                )
                : 'transparent',
        borderLeft: showTodayCellHighlight
          ? `1px solid ${alpha(theme.palette.primary.main, 0.40)}`
          : undefined,
        borderRight: showTodayCellHighlight
          ? `1px solid ${alpha(theme.palette.primary.main, 0.40)}`
          : `1px solid ${theme.palette.divider}`,
        boxShadow: selected
          ? `inset 0 0 0 2px ${alpha(
            theme.palette.primary.main,
            0.65,
          )}`
          : undefined,

        '&:hover': {
          bgcolor: isFinished || isZero
            ? alpha(
              theme.palette.grey[500],
              theme.palette.mode === 'dark' ? 0.14 : 0.11,
            )
            : isOverdue
              ? alpha(
                theme.palette.error.main,
                theme.palette.mode === 'dark' ? 0.26 : 0.15,
              )
              : alpha(
                theme.palette.primary.main,
                theme.palette.mode === 'dark' ? 0.055 : 0.035,
              ),
          boxShadow: selected
            ? `inset 0 0 0 2px ${alpha(
              theme.palette.primary.main,
              0.8,
            )}`
            : undefined,
        },
      })}
    >
      <Typography
        sx={(theme) => ({
          fontSize: 12.5,
          fontWeight: isOverdue ? 800 : 700,
          lineHeight: 1.2,
          color: isFinished || isZero
            ? theme.palette.text.disabled
            : isOverdue
              ? theme.palette.error.main
              : theme.palette.text.primary,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        })}
      >
        {formatNumber(poCount)}{' '}PO
      </Typography>

      <Typography
        sx={(theme) => ({
          mt: 0.05,
          fontSize: 10.75,
          fontWeight: 600,
          lineHeight: 1.2,
          color: isFinished || isZero
            ? theme.palette.text.disabled
            : isOverdue
              ? alpha(
                theme.palette.error.main,
                theme.palette.mode === 'dark' ? 0.76 : 0.72,
              )
              : alpha(
                theme.palette.text.primary,
                theme.palette.mode === 'dark' ? 0.62 : 0.58,
              ),
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        })}
      >
        {formatNumber(qty)}{' '}Pcs
      </Typography>
    </Box>
  )
}

import { Box, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import type { BacklogStatusSummaryRow as SummaryRow } from '../../../services/reportService'
import { normalizeBacklogStatus } from '../backlogStatus'
import { BacklogSummaryCell } from './BacklogSummaryCell'
import { getSummaryGridTemplate } from './backlogSummaryStyles'
import { getStatusColor } from './backlogSummaryUtils'

interface BacklogSummaryRowProps {
  row: SummaryRow
  dates: string[]
  today: string
  selectedKey: string
  loading: boolean
  selectedCell: {
    status: string
    date: string
  } | null
  onStatusClick: (status: string) => void
  onCellClick: (
    cell: {
      status: string
      date: string
    } | null,
  ) => void
}

export function BacklogSummaryRow({
  row,
  dates,
  today,
  selectedKey,
  loading,
  selectedCell,
  onStatusClick,
  onCellClick,
}: BacklogSummaryRowProps) {
  const statusKey = normalizeBacklogStatus(row.status)
  const active = selectedKey === statusKey
  const color = getStatusColor(row.status)

  return (
    <Box
      sx={(theme) => ({
        display: 'grid',
        gridTemplateColumns: getSummaryGridTemplate(dates.length),
        minHeight: 41,
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: active
          ? alpha(
            theme.palette.primary.main,
            theme.palette.mode === 'dark' ? 0.18 : 0.10,
          )
          : 'transparent',
        boxShadow: active
          ? `inset 0 0 0 1px ${alpha(
            theme.palette.primary.main,
            theme.palette.mode === 'dark' ? 0.45 : 0.28,
          )}`
          : 'none',
        transition: 'background-color 160ms ease, box-shadow 160ms ease',
      })}
    >
      <Box
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!loading) {
            onStatusClick(row.status)
          }
        }}
        onKeyDown={(event) => {
          if (
            !loading
            && (event.key === 'Enter' || event.key === ' ')
          ) {
            event.preventDefault()
            onStatusClick(row.status)
          }
        }}
        sx={(theme) => {
          const isDark = theme.palette.mode === 'dark'
          const baseBackground = isDark ? '#161c2c' : '#f7f9fc'
          const edgeShadow = `2px 0 5px ${alpha(
            theme.palette.common.black,
            isDark ? 0.2 : 0.07,
          )}`

          return {
            position: 'sticky',
            left: 0,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            px: 2,
            cursor: loading ? 'default' : 'pointer',
            userSelect: 'none',
            backgroundColor: baseBackground,
            backgroundImage: isDark
              ? `linear-gradient(${alpha(
                theme.palette.common.white,
                0.025,
              )}, ${alpha(
                theme.palette.common.white,
                0.025,
              )})`
              : undefined,
            boxShadow: active
              ? `inset 0 0 0 9999px ${alpha(
                theme.palette.primary.main,
                isDark ? 0.22 : 0.14,
              )}, ${edgeShadow}`
              : edgeShadow,
            transition: 'box-shadow 160ms ease',
            borderRight: `1px solid ${theme.palette.divider}`,
            '&::before': {
              content: '""',
              position: 'sticky',
              top: 0,
              bottom: 0,
              left: 0,
              width: active ? 4 : 3,
              bgcolor: active ? theme.palette.primary.main : color,
            },
            '&:hover': loading
              ? undefined
              : {
                boxShadow: `inset 0 0 0 9999px ${alpha(
                  active ? theme.palette.primary.main : color,
                  active
                    ? isDark ? 0.25 : 0.16
                    : isDark ? 0.12 : 0.07,
                )}, ${edgeShadow}`,
              },
            '&:focus-visible': {
              outline: `2px solid ${alpha(
                active ? theme.palette.primary.main : color,
                0.55,
              )}`,
              outlineOffset: -2,
            },
          }
        }}
      >
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 700,
            color: active ? 'primary.main' : 'text.primary',
            whiteSpace: 'nowrap',
          }}
        >
          {row.status}
        </Typography>
      </Box>

      {dates.map((date) => (
        <BacklogSummaryCell
          key={date}
          row={row}
          date={date}
          today={today}
          statusKey={statusKey}
          selectedCell={selectedCell}
          onCellClick={onCellClick}
        />
      ))}
    </Box>
  )
}

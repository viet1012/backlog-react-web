import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import dayjs from 'dayjs'
import { useState } from 'react'
import type { CostDetailDailyRow } from '../../types/costMonitoring'
import { TABULAR_NUMS } from './costChartConfig'
import {
  formatNum,
  formatSigned,
  formatSignedPct,
  sortDaily,
  type DailySortKey,
  type SortDir,
} from './costDetailUtils'
import { useI18n } from '../../i18n/useI18n'

interface CostDetailDailyTableProps {
  rows: CostDetailDailyRow[]
  abnormalDays: Set<string>
  selectedDate: string | null
  onSelectDate: (date: string | null) => void
}

const cellSx = { ...TABULAR_NUMS, fontSize: 12.5, py: 0.5, px: 1, whiteSpace: 'nowrap' } as const

export function CostDetailDailyTable({
  rows,
  abnormalDays,
  selectedDate,
  onSelectDate,
}: CostDetailDailyTableProps) {
  const { t } = useI18n()
  const theme = useTheme()
  const labels = t.costDetail.daily

  const [sortKey, setSortKey] = useState<DailySortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const columns: { key: DailySortKey; label: string }[] = [
    { key: 'date', label: labels.date },
    { key: 'daily', label: labels.amount },
    { key: 'cumulative', label: labels.cumulative },
    { key: 'ratioPct', label: labels.ratio },
    { key: 'fluct', label: labels.fluct },
    { key: 'diff', label: labels.diff },
  ]

  function toggleSort(key: DailySortKey) {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      // cột số: mặc định lớn trước để thấy ngày chi nhiều
      setSortDir(key === 'date' ? 'asc' : 'desc')
    }
  }

  if (rows.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ fontSize: 12.5, py: 2, textAlign: 'center' }}>
        {labels.empty}
      </Typography>
    )
  }

  const sorted = sortDaily(rows, sortKey, sortDir)

  return (
    <TableContainer sx={{ maxHeight: 320, border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell
                key={c.key}
                align={c.key === 'date' ? 'left' : 'right'}
                sortDirection={sortKey === c.key ? sortDir : false}
                sx={{ ...cellSx, fontWeight: 700 }}
              >
                <TableSortLabel
                  active={sortKey === c.key}
                  direction={sortKey === c.key ? sortDir : 'asc'}
                  onClick={() => toggleSort(c.key)}
                >
                  {c.label}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {sorted.map((r) => {
            const abnormal = abnormalDays.has(r.date)
            const selected = r.date === selectedDate
            const over = r.diff != null && r.diff > 0

            return (
              <TableRow
                key={r.date}
                hover
                selected={selected}
                onClick={() => onSelectDate(selected ? null : r.date)}
                sx={{
                  cursor: 'pointer',
                  ...(abnormal && !selected && {
                    bgcolor: alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.16 : 0.1),
                  }),
                }}
              >
                <TableCell sx={cellSx}>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    {dayjs(r.date).format('DD/MM (ddd)')}
                    {abnormal && (
                      <Tooltip title={labels.abnormal} arrow>
                        <WarningAmberRoundedIcon sx={{ fontSize: 15, color: 'warning.main' }} />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>

                <TableCell align="right" sx={{ ...cellSx, fontWeight: abnormal ? 700 : 400 }}>
                  {formatNum(r.daily)}
                </TableCell>
                <TableCell align="right" sx={cellSx}>{formatNum(r.cumulative)}</TableCell>
                <TableCell align="right" sx={cellSx}>
                  <Tooltip title={labels.ratioHint} arrow placement="top">
                    <span>{formatSignedPct(r.ratioPct)}</span>
                  </Tooltip>
                </TableCell>
                <TableCell align="right" sx={cellSx}>{formatNum(r.fluct)}</TableCell>
                <TableCell
                  align="right"
                  sx={{ ...cellSx, color: over ? 'error.main' : 'text.primary', fontWeight: over ? 700 : 400 }}
                >
                  {formatSigned(r.diff)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

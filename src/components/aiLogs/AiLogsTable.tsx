import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import type {
  AiLogListQuery,
  AiLogSortField,
  AiLogSummary,
} from '../../types/assistantLogs'
import { useI18n } from '../../i18n/useI18n'
import {
  AI_LOGS_PAGE_SIZES,
  hasDetail,
  SLOW_DANGER_SEC,
  SLOW_WARN_SEC,
  TABULAR_NUMS,
  durationLevel,
  formatDateTime,
  formatSec,
} from './aiLogsUtils'

interface AiLogsTableProps {
  rows: AiLogSummary[]
  total: number
  loading: boolean
  query: AiLogListQuery
  onQueryChange: (next: AiLogListQuery) => void
  selectedRid: string | null
  onSelect: (rid: string) => void
}

const cellSx = { ...TABULAR_NUMS, fontSize: 12.5, py: 0.75, px: 1 } as const
const headSx = { ...cellSx, fontWeight: 700, whiteSpace: 'nowrap', bgcolor: 'background.paper' } as const

export function AiLogsTable({
  rows,
  total,
  loading,
  query,
  onQueryChange,
  selectedRid,
  onSelect,
}: AiLogsTableProps) {
  const { t } = useI18n()
  const labels = t.aiLogs.table

  // BE chỉ sort được timestamp / totalMs
  function sortHeader(field: AiLogSortField, label: string, align: 'left' | 'right' = 'left') {
    const active = query.sort === field

    return (
      <TableCell sx={headSx} align={align} sortDirection={active ? query.order : false}>
        <TableSortLabel
          active={active}
          direction={active ? query.order : 'desc'}
          onClick={() =>
            onQueryChange({
              ...query,
              sort: field,
              // cột mới → giảm dần trước (mới nhất / chậm nhất lên đầu)
              order: active && query.order === 'desc' ? 'asc' : 'desc',
              page: 0,
            })
          }
        >
          {label}
        </TableSortLabel>
      </TableCell>
    )
  }

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 260,
        display: 'flex',
        flexDirection: 'column',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1.5,
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      <TableContainer
        sx={{
          flex: 1,
          minHeight: 0,
          opacity: loading ? 0.6 : 1,
          transition: 'opacity 120ms',
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {sortHeader('timestamp', labels.time)}
              <TableCell sx={headSx}>{labels.user}</TableCell>
              <TableCell sx={headSx}>{labels.question}</TableCell>
              <TableCell sx={headSx}>{labels.result}</TableCell>
              {sortHeader('totalMs', labels.duration, 'right')}
              <TableCell sx={headSx} align="right">{labels.llmCalls}</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ ...cellSx, py: 4, color: 'text.secondary' }}>
                  {loading ? '…' : labels.empty}
                </TableCell>
              </TableRow>
            ) : rows.map((row, index) => {
              const level = durationLevel(row.totalMs)
              const clickable = hasDetail(row)

              return (
                <TableRow
                  key={clickable ? row.rid : `${query.page}-${index}`}
                  hover={clickable}
                  selected={clickable && row.rid === selectedRid}
                  onClick={clickable ? () => onSelect(row.rid) : undefined}
                  title={clickable ? undefined : labels.noDetail}
                  sx={{ cursor: clickable ? 'pointer' : 'default' }}
                >
                  <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }}>
                    {formatDateTime(row.timestamp)}
                  </TableCell>

                  <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }}>
                    {row.userId ?? '–'}
                  </TableCell>

                  <TableCell sx={{ ...cellSx, minWidth: 240, maxWidth: 520 }}>
                    <Typography
                      title={row.question ?? undefined}
                      sx={{
                        fontSize: 12.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                      }}
                    >
                      {row.question || '–'}
                    </Typography>
                    {row.screenKey && (
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }} noWrap>
                        {row.screenKey}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }}>
                    <Tooltip title={row.errorCode ?? ''} disableHoverListener={!row.errorCode}>
                      <Chip
                        size="small"
                        label={row.ok ? labels.ok : row.errorCode ?? labels.error}
                        sx={(theme) => {
                          const color = row.ok ? theme.palette.success.main : theme.palette.error.main
                          // theme MuiChip ép nền trắng → tự set màu
                          return {
                            height: 22,
                            fontSize: 11.5,
                            fontWeight: 700,
                            color,
                            bgcolor: alpha(color, 0.12),
                            border: `1px solid ${alpha(color, 0.35)}`,
                          }
                        }}
                      />
                    </Tooltip>
                  </TableCell>

                  <TableCell align="right" sx={{ ...cellSx, whiteSpace: 'nowrap' }}>
                    <Box
                      component="span"
                      sx={(theme) => {
                        if (!level) return {}
                        const color = theme.palette[level].main
                        return {
                          display: 'inline-block',
                          minWidth: 52,
                          px: 0.75,
                          py: 0.125,
                          borderRadius: 1,
                          fontWeight: 700,
                          textAlign: 'right',
                          color: theme.palette.mode === 'dark' ? theme.palette[level].light : theme.palette[level].dark,
                          bgcolor: alpha(color, 0.14),
                        }
                      }}
                    >
                      {formatSec(row.totalMs)}
                    </Box>
                  </TableCell>

                  <TableCell align="right" sx={{ ...cellSx, whiteSpace: 'nowrap' }}>
                    {row.llmCallCount}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
          pl: 1.5,
          borderTop: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Typography sx={{ ...TABULAR_NUMS, fontSize: 12, color: 'text.secondary' }}>
          {labels.count(total)}
        </Typography>

        <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
          {labels.legend(SLOW_WARN_SEC, SLOW_DANGER_SEC)}
        </Typography>

        <TablePagination
          component="div"
          count={total}
          page={total === 0 ? 0 : query.page}
          rowsPerPage={query.size}
          rowsPerPageOptions={AI_LOGS_PAGE_SIZES}
          labelRowsPerPage={labels.rowsPerPage}
          onPageChange={(_, page) => onQueryChange({ ...query, page })}
          onRowsPerPageChange={(event) =>
            onQueryChange({ ...query, size: Number(event.target.value), page: 0 })
          }
          sx={{ ml: 'auto', '& .MuiTablePagination-toolbar': { minHeight: 40 } }}
        />
      </Box>
    </Box>
  )
}

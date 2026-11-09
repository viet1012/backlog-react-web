import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material'
import dayjs from 'dayjs'
import { useState } from 'react'
import { COST_TX_DEFAULT_PAGE_SIZE, useCostDetailTransactions } from '../../hooks/useCostMonitoring'
import { exportCostTransactionsExcel, toApiMonth } from '../../services/costMonitoringService'
import type {
  CostDetailTarget,
  CostDetailTransaction,
  CostDetailTransactionPage,
  CostSimuWeek,
} from '../../types/costMonitoring'
import { TABULAR_NUMS } from './costChartConfig'
import { formatNum } from './costDetailUtils'
import { useI18n } from '../../i18n/useI18n'

interface CostDetailTransactionTableProps {
  // "2026.11"
  month: string | null
  target: CostDetailTarget
  simuWeek: CostSimuWeek
  // trang đầu (cả kỳ) đi kèm response detail
  initial: CostDetailTransactionPage
  // "YYYY-MM-DD"; null = cả kỳ
  filterDate: string | null
  onClearFilter: () => void
  // tên file export, không đuôi
  exportName: string
}

type OptionalColumn = 'category' | 'costCenter' | 'machine'

// BE cho tối đa 200 dòng / trang
const ROWS_PER_PAGE_OPTIONS = [25, COST_TX_DEFAULT_PAGE_SIZE, 100]
const cellSx = { ...TABULAR_NUMS, fontSize: 12.5, py: 0.5, px: 1 } as const
const headSx = { ...cellSx, fontWeight: 700, whiteSpace: 'nowrap' } as const

function costCenterText(tx: CostDetailTransaction) {
  return tx.costCenterName ?? tx.costCenter
}

export function CostDetailTransactionTable({
  month,
  target,
  simuWeek,
  initial,
  filterDate,
  onClearFilter,
  exportName,
}: CostDetailTransactionTableProps) {
  const { t } = useI18n()
  const labels = t.costDetail.tx

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(COST_TX_DEFAULT_PAGE_SIZE)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // đổi bộ lọc ngày / dữ liệu gốc (refresh, đổi khung) → về trang đầu
  const [prevFilter, setPrevFilter] = useState(filterDate)
  const [prevInitial, setPrevInitial] = useState(initial)
  if (prevFilter !== filterDate || prevInitial !== initial) {
    setPrevFilter(filterDate)
    setPrevInitial(initial)
    setPage(0)
  }

  const { data, loading, error } = useCostDetailTransactions(
    month,
    target,
    simuWeek,
    { date: filterDate, page, size: rowsPerPage },
    initial,
  )

  const items = data?.items ?? []
  const total = data?.totalElements ?? 0

  // cột phụ: ẩn khi cả trang không có giá trị
  const optional: { key: OptionalColumn; label: string; value: (tx: CostDetailTransaction) => string | null }[] = [
    { key: 'category', label: labels.category, value: (tx) => tx.category },
    { key: 'costCenter', label: labels.costCenter, value: costCenterText },
    { key: 'machine', label: labels.machine, value: (tx) => tx.machine },
  ]
  const optionalColumns = optional.filter((c) => items.some((tx) => c.value(tx)))
  const colCount = 6 + optionalColumns.length

  async function handleExport() {
    if (!month) return

    setExporting(true)
    setExportError(null)

    try {
      await exportCostTransactionsExcel(
        toApiMonth(month),
        target,
        simuWeek,
        filterDate,
        {
          date: labels.date,
          code: labels.code,
          name: labels.name,
          category: labels.category,
          qty: labels.qty,
          qtyUnit: labels.qtyUnit,
          unitPrice: labels.unitPrice,
          amount: labels.amountUsd,
          amountK: labels.amount,
          costCenter: labels.costCenter,
          machine: labels.machine,
        },
        `${exportName}${filterDate ? `_${filterDate}` : ''}.csv`,
      )
    } catch (err) {
      setExportError(err instanceof Error ? err.message : labels.exportFailed)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Stack sx={{ gap: 0.75 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', ...TABULAR_NUMS }}>
          {labels.count(total)}
          {data?.totalAmountK != null && ` · ${formatNum(data.totalAmountK, 2)} K$`}
        </Typography>

        {filterDate && (
          // theme MuiChip.root ép nền trắng → tự set màu, tránh chữ trắng trên nền trắng
          <Chip
            size="small"
            label={labels.filteredBy(dayjs(filterDate).format('DD/MM'))}
            onDelete={onClearFilter}
            sx={{
              bgcolor: 'primary.main',
              borderColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': { bgcolor: 'primary.dark' },
              '& .MuiChip-deleteIcon': {
                color: 'primary.contrastText',
                opacity: 0.8,
                '&:hover': { color: 'primary.contrastText', opacity: 1 },
              },
            }}
          />
        )}

        {loading && <CircularProgress size={14} />}

        <Button
          size="small"
          variant="outlined"
          startIcon={exporting ? <CircularProgress size={14} /> : <FileDownloadOutlinedIcon />}
          disabled={total === 0 || exporting}
          onClick={() => void handleExport()}
          sx={{ ml: 'auto', textTransform: 'none' }}
        >
          {labels.exportExcel}
        </Button>
      </Stack>

      {/* Act MTD gồm cả phân bổ chung → tổng giao dịch trực tiếp nhỏ hơn Act */}
      {!filterDate && data?.allocationK != null && data.allocationK !== 0 && (
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary', ...TABULAR_NUMS }}>
          {labels.allocation(formatNum(data.allocationK, 2))}
        </Typography>
      )}

      {(error || exportError) && (
        <Alert severity="error" sx={{ py: 0 }}>{error ?? exportError}</Alert>
      )}

      <TableContainer
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          opacity: loading ? 0.6 : 1,
          transition: 'opacity 120ms',
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={headSx}>{labels.date}</TableCell>
              <TableCell sx={headSx}>{labels.code}</TableCell>
              <TableCell sx={headSx}>{labels.name}</TableCell>
              {optionalColumns.map((c) => (
                <TableCell key={c.key} sx={headSx}>{c.label}</TableCell>
              ))}
              <TableCell align="right" sx={headSx}>{labels.qty}</TableCell>
              <TableCell align="right" sx={headSx}>{labels.unitPrice}</TableCell>
              <TableCell align="right" sx={headSx}>{labels.amount}</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} align="center" sx={{ ...cellSx, py: 2, color: 'text.secondary' }}>
                  {loading ? '…' : labels.empty}
                </TableCell>
              </TableRow>
            ) : items.map((tx, index) => (
              // BE không có id → khóa theo vị trí trong trang
              <TableRow key={`${page}-${index}`} hover>
                <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }}>
                  {tx.date ? dayjs(tx.date).format('DD/MM/YYYY') : '–'}
                </TableCell>
                <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }}>{tx.code ?? '–'}</TableCell>
                <TableCell sx={{ ...cellSx, wordBreak: 'break-word', minWidth: 160 }}>{tx.name ?? '–'}</TableCell>
                {optionalColumns.map((c) => (
                  <TableCell key={c.key} sx={{ ...cellSx, wordBreak: 'break-word' }}>
                    {c.value(tx) ?? '–'}
                  </TableCell>
                ))}
                <TableCell align="right" sx={{ ...cellSx, whiteSpace: 'nowrap' }}>
                  {tx.qty == null ? '–' : `${formatNum(tx.qty, tx.qty % 1 === 0 ? 0 : 2)}${tx.qtyUnit ? ` ${tx.qtyUnit}` : ''}`}
                </TableCell>
                <TableCell align="right" sx={{ ...cellSx, whiteSpace: 'nowrap' }}>
                  {formatNum(tx.unitPrice, 2)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    ...cellSx,
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                    color: tx.amountK != null && tx.amountK < 0 ? 'error.main' : 'text.primary',
                  }}
                >
                  {formatNum(tx.amountK, 3)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {total > ROWS_PER_PAGE_OPTIONS[0] && (
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          labelRowsPerPage={labels.rowsPerPage}
          onPageChange={(_, next) => setPage(next)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value))
            setPage(0)
          }}
          sx={{ '& .MuiTablePagination-toolbar': { minHeight: 36 } }}
        />
      )}
    </Stack>
  )
}

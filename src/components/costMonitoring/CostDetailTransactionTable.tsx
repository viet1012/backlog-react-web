import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded'
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded'
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputBase,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import {
  COST_TX_DEFAULT_PAGE_SIZE,
  useCostTransactionFacets,
  useCostTransactionsPage,
} from '../../hooks/useCostMonitoring'
import { usePerm } from '../auth/useAuth'
import { ACTION, PERM } from '../../routes/appPages'
import {
  exportCostTransactionsXlsx,
  type CostTxFacetColumn,
  type CostTxServerQuery,
  type CostTxSortField,
} from '../../services/costMonitoringService'
import type {
  CostDetailTarget,
  CostDetailTransaction,
  CostDetailTransactionPage,
} from '../../types/costMonitoring'
import { TABULAR_NUMS } from './costChartConfig'
import { CostTxColumnFilter, type FilterOption } from './CostTxColumnFilter'
import { formatNum } from './costDetailUtils'
import { useI18n } from '../../i18n/useI18n'
import { notifyExport } from '../common/notify'
import { statusTextColor } from '../../theme/statusTones'

interface CostDetailTransactionTableProps {
  target: CostDetailTarget
  // trang đầu (cả kỳ) đi kèm response detail; from / to = kỳ của Actual
  initial: CostDetailTransactionPage
  // "YYYY-MM-DD" (bấm cột chart); null = cả kỳ
  filterDate: string | null
  onClearFilter: () => void
  // tên file export, không đuôi
  exportName: string
  // tiêu đề nằm cùng dòng toolbar (tiết kiệm chiều cao)
  title?: string
  // true → giãn hết chiều cao cha (cha phải là flex column), bảng tự cuộn bên trong
  fill?: boolean
}

type OptionalColumn = 'category' | 'costCenter' | 'machine'
type ColumnFilters = Partial<Record<CostTxFacetColumn, string[]>>
// cột số sắp xếp được (cột Ngày lọc bằng dropdown)
type SortColumn = Exclude<CostTxSortField, 'date'>
type SortState = { field: SortColumn; dir: 'asc' | 'desc' } | null

// BE cho tối đa 200 dòng / trang
const ROWS_PER_PAGE_OPTIONS = [25, COST_TX_DEFAULT_PAGE_SIZE, 100, 200]
// gõ xong mới gọi BE (không gửi mỗi phím)
const SEARCH_DEBOUNCE_MS = 300
const cellSx = { ...TABULAR_NUMS, fontSize: 12.5, py: 0.375, px: 1 } as const
const headSx = { ...cellSx, py: 0.5, fontWeight: 700, whiteSpace: 'nowrap', bgcolor: 'background.paper' } as const

function costCenterText(tx: CostDetailTransaction) {
  return tx.costCenterName ?? tx.costCenter
}

const headButtonSx = {
  all: 'unset',
  boxSizing: 'border-box',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 0.25,
  px: 1,
  py: 0.5,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 12.5,
  fontWeight: 700,
  whiteSpace: 'nowrap',
  '&:hover': { bgcolor: 'action.hover' },
  '&:hover .head-icon': { opacity: 1 },
  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
} as const

// Tiêu đề có dropdown lọc: ▾ (chưa lọc) / phễu xanh (đang lọc)
function FilterHead({ label, ariaLabel, active, onOpen }: {
  label: ReactNode
  ariaLabel: string
  active: boolean
  onOpen: (event: MouseEvent<HTMLElement>) => void
}) {
  return (
    <TableCell sx={{ ...headSx, p: 0 }}>
      <Box
        component="button"
        type="button"
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        onClick={onOpen}
        sx={{ ...headButtonSx, color: active ? 'primary.main' : 'text.primary' }}
      >
        {label}
        {active ? (
          <FilterAltRoundedIcon sx={{ fontSize: 15, ml: 0.25 }} />
        ) : (
          <ArrowDropDownRoundedIcon className="head-icon" sx={{ fontSize: 20, opacity: 0.55, ml: -0.25 }} />
        )}
      </Box>
    </TableCell>
  )
}

// Tiêu đề cột số: bấm → giảm dần → tăng dần → bỏ sắp xếp
function SortHead({ label, tooltip, dir, onToggle }: {
  label: string
  tooltip: string
  dir: 'asc' | 'desc' | null
  onToggle: () => void
}) {
  const Icon = dir === 'asc' ? ArrowUpwardRoundedIcon : dir === 'desc' ? ArrowDownwardRoundedIcon : UnfoldMoreRoundedIcon

  return (
    <TableCell
      align="right"
      sx={{ ...headSx, p: 0 }}
      aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'}
    >
      <Tooltip title={tooltip} arrow disableInteractive>
        <Box
          component="button"
          type="button"
          onClick={onToggle}
          sx={{ ...headButtonSx, justifyContent: 'flex-end', color: dir ? 'primary.main' : 'text.primary' }}
        >
          <Icon className="head-icon" sx={{ fontSize: dir ? 14 : 15, opacity: dir ? 1 : 0.4 }} />
          {label}
        </Box>
      </Tooltip>
    </TableCell>
  )
}

// Bảng giao dịch 1 khung. Tìm / lọc cột / sắp xếp / phân trang đều do BE xử lý
// (/detail/transactions, /facets, /export) – mỗi thao tác 1 request, không tải toàn bộ về trình duyệt.
export function CostDetailTransactionTable({
  target,
  initial,
  filterDate,
  onClearFilter,
  exportName,
  title,
  fill = false,
}: CostDetailTransactionTableProps) {
  const { t } = useI18n()
  const labels = t.costDetail.tx

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(COST_TX_DEFAULT_PAGE_SIZE)
  const [exporting, setExporting] = useState(false)
  const canExport = usePerm(PERM.COST_MONITORING, ACTION.EXPORT)

  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  useEffect(() => {
    const timer = window.setTimeout(() => setQ(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [search])

  // lọc cột kiểu Excel (Ngày / Category / Cost center / Máy)
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({})
  const [openFilter, setOpenFilter] = useState<{ key: CostTxFacetColumn; anchor: HTMLElement } | null>(null)
  const activeFilterCount = Object.keys(columnFilters).length

  const [sort, setSort] = useState<SortState>(null)

  function toggleSort(field: SortColumn) {
    setSort((prev) => {
      if (prev?.field !== field) return { field, dir: 'desc' }
      return prev.dir === 'desc' ? { field, dir: 'asc' } : null
    })
  }

  // đổi bộ lọc ngày (chart) / dữ liệu gốc / từ khóa / lọc cột / sắp xếp → về trang đầu
  const resetKey = JSON.stringify([filterDate, q, columnFilters, sort])
  const [prevResetKey, setPrevResetKey] = useState(resetKey)
  const [prevInitial, setPrevInitial] = useState(initial)
  if (prevResetKey !== resetKey || prevInitial !== initial) {
    setPrevResetKey(resetKey)
    setPrevInitial(initial)
    setPage(0)
  }

  // Kỳ: bấm cột chart → đúng ngày đó; không thì cả kỳ của Actual (from / to của /detail)
  const from = filterDate ?? initial.from
  const to = filterDate ?? initial.to

  const query = useMemo<CostTxServerQuery | null>(
    () => (from && to ? { from, to, q, sort, filters: columnFilters } : null),
    [from, to, q, sort, columnFilters],
  )

  const hasConditions = q !== '' || activeFilterCount > 0
  // trang đầu mặc định → dùng luôn initial của /detail, không gọi API
  const isDefault = !hasConditions && sort === null && filterDate === null
    && page === 0 && rowsPerPage === COST_TX_DEFAULT_PAGE_SIZE

  const { data, loading, error, retry } = useCostTransactionsPage(target, isDefault ? null : query, page, rowsPerPage, initial)

  const facets = useCostTransactionFacets(
    target,
    query ?? { from: '', to: '', q: '', sort: null, filters: {} },
    query ? openFilter?.key ?? null : null,
  )

  const items = data?.items ?? []
  const total = data?.totalElements ?? 0
  const totalAmountK = data?.totalAmountK ?? null
  // phân bổ chung chỉ có nghĩa với cả kỳ, không lọc
  const allocationK = !filterDate && !hasConditions ? initial.allocationK : null

  const pageCount = Math.max(1, Math.ceil(total / rowsPerPage))
  const from1 = total === 0 ? 0 : page * rowsPerPage + 1
  const toN = Math.min(total, (page + 1) * rowsPerPage)

  // cột phụ: ẩn khi cả trang không có giá trị (đang lọc cột đó thì luôn hiện để mở lại dropdown)
  const optional: { key: OptionalColumn; label: string; value: (tx: CostDetailTransaction) => string | null }[] = [
    { key: 'category', label: labels.category, value: (tx) => tx.category },
    { key: 'costCenter', label: labels.costCenter, value: costCenterText },
    { key: 'machine', label: labels.machine, value: (tx) => tx.machine },
  ]
  const optionalColumns = optional.filter((c) => columnFilters[c.key] || items.some((tx) => c.value(tx)))
  const colCount = 6 + optionalColumns.length

  const filterOptions: FilterOption[] = useMemo(
    () => (facets.data?.values ?? []).map((v) => ({ value: v.value, count: v.count })),
    [facets.data],
  )

  async function handleExport() {
    if (!query) return

    setExporting(true)

    try {
      // .xlsx do BE tạo theo đúng bộ lọc / thứ tự đang xem; toast tiến trình / lỗi dùng chung
      await notifyExport((onProgress) =>
        exportCostTransactionsXlsx(target, query, `${exportName}.xlsx`, onProgress))
    } finally {
      setExporting(false)
    }
  }

  return (
    <Stack sx={{ gap: 0.5, ...(fill && { flex: 1, minHeight: 0 }) }}>
      {/* Toolbar 1 dòng: tiêu đề · tổng · lọc ngày · tìm · phân trang · xuất */}
      <Stack
        direction="row"
        sx={{ alignItems: 'center', columnGap: 1, rowGap: 0.5, flexWrap: 'wrap', flexShrink: 0, minHeight: 32 }}
      >
        {title && (
          <Typography sx={{ fontSize: 12.5, fontWeight: 800, whiteSpace: 'nowrap' }}>{title}</Typography>
        )}

        <Typography sx={{ ...TABULAR_NUMS, fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>
          {labels.count(total)}
          {totalAmountK != null && ` · ${formatNum(totalAmountK, 2)} K$`}
        </Typography>

        {/* Act MTD gồm cả phân bổ chung → tổng giao dịch trực tiếp nhỏ hơn Act */}
        {allocationK != null && allocationK !== 0 && (
          <Tooltip title={labels.allocation(formatNum(allocationK, 2))} arrow>
            <InfoOutlinedIcon sx={{ fontSize: 15, color: 'text.disabled', cursor: 'help' }} />
          </Tooltip>
        )}

        {filterDate && (
          // theme MuiChip.root ép nền trắng → tự set màu, tránh chữ trắng trên nền trắng
          <Chip
            size="small"
            label={labels.filteredBy(dayjs(filterDate).format('DD/MM'))}
            onDelete={onClearFilter}
            sx={{
              height: 22,
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

        {activeFilterCount > 0 && (
          <Chip
            size="small"
            color="primary"
            variant="outlined"
            icon={<FilterAltRoundedIcon sx={{ fontSize: 15 }} />}
            label={labels.filter.active(activeFilterCount)}
            onDelete={() => setColumnFilters({})}
            sx={{ height: 22, fontSize: 11.5, fontWeight: 700 }}
          />
        )}

        {loading && <CircularProgress size={14} />}

        {/* ô tìm */}
        <Box
          sx={(theme) => ({
            ml: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            height: 30,
            width: { xs: '100%', sm: 260 },
            px: 1,
            borderRadius: 1,
            border: 1,
            borderColor: q ? 'primary.main' : 'divider',
            bgcolor: q ? alpha(theme.palette.primary.main, 0.04) : 'background.paper',
            transition: 'border-color 120ms',
            '&:focus-within': { borderColor: 'primary.main', boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}` },
          })}
        >
          <SearchRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <InputBase
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                // Enter → tìm ngay, không chờ debounce
                setQ(search.trim())
              }
              if (event.key === 'Escape' && search) {
                // Esc lần 1 xóa ô tìm, không thoát chế độ focus
                event.preventDefault()
                setSearch('')
                setQ('')
              }
            }}
            placeholder={labels.searchPlaceholder}
            // data-shortcut: phím "/" nhảy vào ô này khi đang xem chi tiết
            inputProps={{ 'aria-label': labels.searchPlaceholder, maxLength: 200, 'data-shortcut': 'search', title: t.shortcuts.searchTitle }}
            sx={{ flex: 1, fontSize: 12.5 }}
          />
          {search && (
            <IconButton
              size="small"
              aria-label={labels.searchClear}
              onClick={() => {
                setSearch('')
                setQ('')
              }}
              sx={{ p: 0.25 }}
            >
              <CloseRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>

        {/* phân trang gọn: số dòng · 1–50 / 10.168 · ‹ › */}
        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.25 }}>
          <Tooltip title={labels.rowsPerPage} arrow>
            <Select
              size="small"
              variant="standard"
              disableUnderline
              value={rowsPerPage}
              onChange={(event) => {
                setRowsPerPage(Number(event.target.value))
                setPage(0)
              }}
              sx={{ fontSize: 12, '& .MuiSelect-select': { py: 0.25, pl: 0.5 } }}
            >
              {ROWS_PER_PAGE_OPTIONS.map((size) => (
                <MenuItem key={size} value={size} sx={{ fontSize: 12.5 }}>{size}</MenuItem>
              ))}
            </Select>
          </Tooltip>
          <Typography sx={{ ...TABULAR_NUMS, fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap', mx: 0.5 }}>
            {`${from1.toLocaleString('en-US')}–${toN.toLocaleString('en-US')} / ${total.toLocaleString('en-US')}`}
          </Typography>
          <IconButton size="small" disabled={page === 0} onClick={() => setPage((p) => p - 1)} sx={{ p: 0.25 }}>
            <ChevronLeftRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" disabled={page + 1 >= pageCount} onClick={() => setPage((p) => p + 1)} sx={{ p: 0.25 }}>
            <ChevronRightRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Xuất Excel giao dịch cần COST_MONITORING X */}
        {canExport && (
          <Tooltip title={labels.exportExcel} arrow>
            <span>
              <IconButton
                size="small"
                aria-label={labels.exportExcel}
                disabled={total === 0 || exporting || !query}
                onClick={() => void handleExport()}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 0.5 }}
              >
                {exporting ? <CircularProgress size={16} /> : <FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Stack>

      {/* lỗi xuất file đã báo qua toast (notifyExport) */}
      {error && (
        <Alert
          severity="error"
          sx={{ py: 0, flexShrink: 0 }}
          action={<Button color="inherit" size="small" onClick={retry}>{t.common.retry}</Button>}
        >
          {error}
        </Alert>
      )}

      <TableContainer
        // CostDetailFocusView: mũi tên trong bảng để cuộn, không đổi khung
        data-cost-tx-table=""
        sx={{
          position: 'relative',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          // cuộn trong bảng, header dính trên; fill → giãn hết phần còn lại
          // (màn nhỏ cột xếp dọc, không có chiều cao cố định → vẫn giới hạn)
          ...(fill ? { flex: 1, minHeight: 160, maxHeight: { xs: 420, md: 'none' } } : { maxHeight: 360 }),
          opacity: loading ? 0.6 : 1,
          transition: 'opacity 120ms',
        }}
      >
        {loading && (
          <LinearProgress sx={{ position: 'sticky', top: 0, zIndex: 3, height: 2 }} />
        )}

        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <FilterHead
                label={labels.date}
                ariaLabel={labels.filter.title(labels.date)}
                active={Boolean(columnFilters.date)}
                onOpen={(event) => setOpenFilter({ key: 'date', anchor: event.currentTarget })}
              />
              <TableCell sx={headSx}>{labels.code}</TableCell>
              <TableCell sx={headSx}>{labels.name}</TableCell>
              {optionalColumns.map((c) => (
                <FilterHead
                  key={c.key}
                  label={c.label}
                  ariaLabel={labels.filter.title(c.label)}
                  active={Boolean(columnFilters[c.key])}
                  onOpen={(event) => setOpenFilter({ key: c.key, anchor: event.currentTarget })}
                />
              ))}
              {([
                ['qty', labels.qty],
                ['unitPrice', labels.unitPrice],
                ['amountK', labels.amount],
              ] as [SortColumn, string][]).map(([field, label]) => {
                const dir = sort?.field === field ? sort.dir : null
                return (
                  <SortHead
                    key={field}
                    label={label}
                    dir={dir}
                    tooltip={dir === 'desc' ? labels.sort.asc : dir === 'asc' ? labels.sort.none : labels.sort.desc}
                    onToggle={() => toggleSort(field)}
                  />
                )
              })}
            </TableRow>
          </TableHead>

          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} align="center" sx={{ ...cellSx, py: 2, color: 'text.secondary' }}>
                  {loading ? '…' : hasConditions ? labels.searchEmpty : labels.empty}
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
                  sx={(theme) => ({
                    ...cellSx,
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                    color: tx.amountK != null && tx.amountK < 0 ? statusTextColor(theme, 'error') : 'text.primary',
                  })}
                >
                  {formatNum(tx.amountK, 3)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {openFilter && (
        <CostTxColumnFilter
          // options về sau (đang tải) → popover tự đồng bộ nháp
          key={openFilter.key}
          anchorEl={openFilter.anchor}
          label={openFilter.key === 'date' ? labels.date : optional.find((c) => c.key === openFilter.key)?.label ?? ''}
          formatValue={openFilter.key === 'date' ? (value) => dayjs(value).format('DD/MM/YYYY (ddd)') : undefined}
          options={filterOptions}
          selected={columnFilters[openFilter.key] ? new Set(columnFilters[openFilter.key]) : null}
          loading={facets.loading}
          error={facets.error}
          truncatedTotal={facets.data?.truncated ? facets.data.total : null}
          onClose={() => setOpenFilter(null)}
          onApply={(selected) => {
            const key = openFilter.key
            setColumnFilters((prev) => {
              const next = { ...prev }
              if (selected) next[key] = [...selected]
              else delete next[key]
              return next
            })
            setOpenFilter(null)
          }}
        />
      )}
    </Stack>
  )
}

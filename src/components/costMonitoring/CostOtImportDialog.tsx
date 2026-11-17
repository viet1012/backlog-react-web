import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Skeleton,
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
import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { useCachedQuery } from '../../hooks/useCachedQuery'
import { useI18n } from '../../i18n/useI18n'
import {
  getOtStatus,
  importOt,
  importOtFromShare,
  toApiMonth,
} from '../../services/costMonitoringService'
import {
  OT_SUB_DIVS,
  type CostOtImportResult,
  type CostOtImportSummary,
  type OtSubDiv,
} from '../../types/costMonitoring'
import { clearQueryCache } from '../../utils/queryCache'
import { AppButton } from '../common/AppButton'
import { TABULAR_NUMS } from './costChartConfig'
import { formatNum } from './costDetailUtils'

const MAX_FILE_BYTES = 20 * 1024 * 1024
const ACCEPT_EXTENSIONS = ['.xlsx', '.xlsm']

const cellSx = { ...TABULAR_NUMS, fontSize: 12.5, py: 0.5, px: 1 } as const
const headSx = { ...cellSx, fontWeight: 700, whiteSpace: 'nowrap' } as const

type OtSource =
  | { kind: 'file'; file: File }
  | { kind: 'share' }

interface CostOtImportDialogProps {
  open: boolean
  // tháng đang xem, dạng "2026.11"
  month: string | null
  onClose: () => void
  // nạp thật thành công (dryRun = false)
  onImported: (result: CostOtImportResult) => void
}

function formatDate(value: string | null, pattern = 'DD/MM/YYYY') {
  if (!value) return '–'
  const d = dayjs(value)
  return d.isValid() ? d.format(pattern) : value
}

function hasAcceptedExtension(name: string) {
  const lower = name.toLowerCase()
  return ACCEPT_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

function sumK(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v != null)
  return nums.length === 0 ? null : nums.reduce((a, b) => a + b, 0)
}

function minDate(a: string | null, b: string | null) {
  if (!a) return b
  if (!b) return a
  return a < b ? a : b
}

function maxDate(a: string | null, b: string | null) {
  if (!a) return b
  if (!b) return a
  return a > b ? a : b
}

interface PreviewRow {
  key: string
  month: string
  label: string
  sheet: string
  days: number | null
  firstDate: string | null
  lastDate: string | null
  totalK: number | null
  // dòng gộp Guide = PG + MG
  subtotal?: boolean
}

// theo tháng tăng dần, trong tháng PR → MO → PG → MG; có cả PG & MG thì thêm dòng Guide = PG + MG
function buildPreviewRows(summaries: CostOtImportSummary[], guideLabel: string): PreviewRow[] {
  const months = [...new Set(summaries.map((s) => s.month))].sort()

  return months.flatMap((month) => {
    const inMonth = summaries
      .filter((s) => s.month === month)
      .sort((a, b) => OT_SUB_DIVS.indexOf(a.subDiv) - OT_SUB_DIVS.indexOf(b.subDiv))

    const rows: PreviewRow[] = inMonth.map((s) => ({
      key: `${month}|${s.subDiv}|${s.sheet}`,
      month,
      label: s.subDiv,
      sheet: s.sheet,
      days: s.days,
      firstDate: s.firstDate,
      lastDate: s.lastDate,
      totalK: s.totalK,
    }))

    const guide = inMonth.filter((s) => s.subDiv === 'PG' || s.subDiv === 'MG')
    if (guide.some((s) => s.subDiv === 'PG') && guide.some((s) => s.subDiv === 'MG')) {
      rows.push({
        key: `${month}|Guide`,
        month,
        label: guideLabel,
        sheet: '',
        days: Math.max(...guide.map((s) => s.days)),
        firstDate: guide.map((s) => s.firstDate).reduce<string | null>(minDate, null),
        lastDate: guide.map((s) => s.lastDate).reduce<string | null>(maxDate, null),
        totalK: sumK(guide.map((s) => s.totalK)),
        subtotal: true,
      })
    }

    return rows
  })
}

function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 0.75 }}>
      <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 800 }}>{children}</Typography>
      {action}
    </Stack>
  )
}

// Mỗi lần mở dialog dựng lại nội dung (key) → không còn file / xem trước của lần trước
export function CostOtImportDialog(props: CostOtImportDialogProps) {
  const [session, setSession] = useState(0)
  const [prevOpen, setPrevOpen] = useState(props.open)
  if (prevOpen !== props.open) {
    setPrevOpen(props.open)
    if (props.open) setSession((s) => s + 1)
  }

  return <OtImportDialogBody key={session} {...props} />
}

function OtImportDialogBody({ open, month, onClose, onImported }: CostOtImportDialogProps) {
  const { t } = useI18n()
  const labels = t.costOt

  const apiMonth = month ? toApiMonth(month) : null

  // ---------- trạng thái đã nạp (mỗi lần mở đều tải lại, vẫn hiện ngay số cũ nếu có) ----------
  const statusQuery = useCachedQuery(
    open && apiMonth ? `cost:ot-status:${apiMonth}` : null,
    (signal) => getOtStatus(apiMonth!, signal),
    { freshMs: 0, fallbackError: () => labels.status.loadFailed },
  )
  const status = statusQuery.stale ? null : statusQuery.data

  // ---------- nguồn + xem trước ----------
  const [source, setSource] = useState<OtSource | null>(null)
  const [allMonths, setAllMonths] = useState(false)
  const [preview, setPreview] = useState<CostOtImportResult | null>(null)
  const [busy, setBusy] = useState<'preview' | 'commit' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [warningsOpen, setWarningsOpen] = useState(true)

  const fileInput = useRef<HTMLInputElement>(null)
  // chặn 2 request cùng lúc (kể cả bấm 2 lần trước khi kịp render lại)
  const inFlight = useRef(false)
  const controller = useRef<AbortController | null>(null)

  useEffect(() => () => controller.current?.abort(), [])

  async function run(src: OtSource, all: boolean, dryRun: boolean) {
    if (inFlight.current) return
    inFlight.current = true

    const ctrl = new AbortController()
    controller.current = ctrl

    setBusy(dryRun ? 'preview' : 'commit')
    setError(null)
    if (dryRun) setPreview(null)

    // không có tháng đang xem → BE nạp mọi tháng trong file
    const opts = { month: all ? undefined : apiMonth ?? undefined, dryRun }

    try {
      const result = src.kind === 'file'
        ? await importOt(src.file, opts, ctrl.signal)
        : await importOtFromShare(opts, ctrl.signal)

      if (ctrl.signal.aborted) return

      if (dryRun) {
        setPreview(result)
        setWarningsOpen(result.warnings.length <= 5)
      } else {
        // trạng thái đã đổi → lần mở sau tải lại, không hiện số cũ
        clearQueryCache('cost:ot-status:')
        onImported(result)
      }
    } catch (err) {
      if (ctrl.signal.aborted) return
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      inFlight.current = false
      if (!ctrl.signal.aborted) setBusy(null)
    }
  }

  function pickFile(file: File | undefined) {
    if (!file || busy) return

    if (!hasAcceptedExtension(file.name)) {
      setError(labels.errors.badExtension)
      return
    }

    if (file.size > MAX_FILE_BYTES) {
      setError(labels.errors.tooLarge((file.size / 1024 / 1024).toFixed(1)))
      return
    }

    const next: OtSource = { kind: 'file', file }
    setSource(next)
    void run(next, allMonths, true)
  }

  function pickShare() {
    const next: OtSource = { kind: 'share' }
    setSource(next)
    void run(next, allMonths, true)
  }

  function toggleAllMonths(checked: boolean) {
    setAllMonths(checked)
    // xác nhận phải dùng đúng tham số đã xem trước → xem trước lại
    if (source) void run(source, checked, true)
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    setDragOver(false)
    pickFile(event.dataTransfer.files[0])
  }

  const canConfirm = Boolean(source && preview && preview.summaries.length > 0 && !busy)
  const shareEnabled = status?.shareImportEnabled === true

  const previewRows = preview ? buildPreviewRows(preview.summaries, labels.preview.guideTotal) : []

  // ---------- phần trạng thái ----------
  let statusBody: ReactNode
  if (!apiMonth) {
    statusBody = null
  } else if (!status && statusQuery.loading) {
    statusBody = <Skeleton variant="rounded" height={150} />
  } else if (!status) {
    statusBody = <Alert severity="error">{statusQuery.error ?? labels.status.loadFailed}</Alert>
  } else {
    statusBody = (
      <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={headSx}>{labels.status.subDiv}</TableCell>
              <TableCell sx={headSx}>{labels.status.lastDate}</TableCell>
              <TableCell sx={headSx} align="right">{labels.status.days}</TableCell>
              <TableCell sx={headSx} align="right">{labels.status.total}</TableCell>
              <TableCell sx={headSx}>{labels.status.loadedAt}</TableCell>
              <TableCell sx={headSx}>{labels.status.source}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {OT_SUB_DIVS.map((subDiv: OtSubDiv) => {
              const row = status.rows.find((r) => r.subDiv === subDiv)
              const loaded = row?.lastDate != null

              return (
                <TableRow key={subDiv}>
                  <TableCell sx={{ ...cellSx, fontWeight: 700 }}>{subDiv}</TableCell>
                  {loaded ? (
                    <>
                      <TableCell sx={cellSx}>{formatDate(row.lastDate)}</TableCell>
                      <TableCell sx={cellSx} align="right">{row.days}</TableCell>
                      <TableCell sx={cellSx} align="right">{formatNum(row.totalK, 2)}</TableCell>
                      <TableCell sx={cellSx}>{formatDate(row.loadedAt, 'DD/MM/YYYY HH:mm')}</TableCell>
                      <TableCell sx={{ ...cellSx, maxWidth: 220 }}>
                        <Tooltip title={row.source ?? ''}>
                          <Typography noWrap sx={{ fontSize: 12.5 }}>{row.source ?? '–'}</Typography>
                        </Tooltip>
                      </TableCell>
                    </>
                  ) : (
                    <TableCell sx={{ ...cellSx, color: 'text.secondary', fontStyle: 'italic' }} colSpan={5}>
                      {labels.status.notLoaded}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  // ---------- vùng chọn file ----------
  const selectedFile = source?.kind === 'file' ? source.file : null

  const dropZone = (
    <Box
      role="button"
      tabIndex={busy ? -1 : 0}
      aria-disabled={Boolean(busy)}
      onClick={() => !busy && fileInput.current?.click()}
      onKeyDown={(event) => {
        if (!busy && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          fileInput.current?.click()
        }
      }}
      onDragOver={(event) => {
        event.preventDefault()
        if (!busy) setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      sx={(theme) => ({
        px: 2,
        py: 2.5,
        border: '1.5px dashed',
        borderColor: dragOver ? 'primary.main' : 'divider',
        borderRadius: 1.5,
        bgcolor: dragOver ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
        cursor: busy ? 'default' : 'pointer',
        opacity: busy ? 0.6 : 1,
        textAlign: 'center',
        transition: 'border-color 120ms, background-color 120ms',
        '&:hover': busy ? undefined : { borderColor: 'primary.main' },
        '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
      })}
    >
      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT_EXTENSIONS.join(',')}
        hidden
        onChange={(event) => {
          pickFile(event.target.files?.[0])
          // chọn lại đúng file cũ vẫn kích hoạt onChange
          event.target.value = ''
        }}
      />

      {selectedFile ? (
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <DescriptionOutlinedIcon fontSize="small" color="primary" />
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, minWidth: 0 }} noWrap>
            {selectedFile.name}
          </Typography>
          <Typography sx={{ ...TABULAR_NUMS, fontSize: 12, color: 'text.secondary', flexShrink: 0 }}>
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'primary.main', flexShrink: 0 }}>
            · {labels.drop.change}
          </Typography>
        </Stack>
      ) : (
        <Stack sx={{ alignItems: 'center', gap: 0.5 }}>
          <UploadFileOutlinedIcon color="action" />
          <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{labels.drop.title}</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{labels.drop.hint}</Typography>
        </Stack>
      )}
    </Box>
  )

  // ---------- xem trước ----------
  let previewBody: ReactNode = null
  if (busy) {
    previewBody = (
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25, py: 2, justifyContent: 'center' }}>
        <CircularProgress size={18} />
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          {busy === 'preview' ? labels.previewing : labels.importing}
        </Typography>
      </Stack>
    )
  } else if (preview) {
    previewBody = (
      <>
        <SectionTitle>{labels.preview.title}</SectionTitle>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.75 }} noWrap>
          {labels.preview.source(preview.source)}
        </Typography>

        {previewRows.length === 0 ? (
          <Alert severity="info">{labels.preview.empty}</Alert>
        ) : (
          <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headSx}>{labels.preview.month}</TableCell>
                  <TableCell sx={headSx}>{labels.preview.subDiv}</TableCell>
                  <TableCell sx={headSx}>{labels.preview.sheet}</TableCell>
                  <TableCell sx={headSx} align="right">{labels.preview.days}</TableCell>
                  <TableCell sx={headSx}>{labels.preview.range}</TableCell>
                  <TableCell sx={headSx} align="right">{labels.preview.total}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {previewRows.map((row) => {
                  const sx = row.subtotal
                    ? { ...cellSx, fontWeight: 700, bgcolor: 'action.hover' }
                    : cellSx

                  return (
                    <TableRow key={row.key}>
                      <TableCell sx={sx}>{row.month}</TableCell>
                      <TableCell sx={{ ...sx, fontWeight: 700 }}>{row.label}</TableCell>
                      <TableCell sx={sx}>{row.sheet || '–'}</TableCell>
                      <TableCell sx={sx} align="right">{row.days ?? '–'}</TableCell>
                      <TableCell sx={{ ...sx, whiteSpace: 'nowrap' }}>
                        {`${formatDate(row.firstDate, 'DD/MM')} – ${formatDate(row.lastDate, 'DD/MM')}`}
                      </TableCell>
                      <TableCell sx={sx} align="right">{formatNum(row.totalK, 2)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {preview.warnings.length > 0 && (
          <Alert
            severity="warning"
            sx={{ mt: 1, '& .MuiAlert-message': { width: '100%' } }}
            action={
              <Button
                size="small"
                color="inherit"
                onClick={() => setWarningsOpen((v) => !v)}
                endIcon={warningsOpen ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                sx={{ textTransform: 'none' }}
              >
                {warningsOpen ? labels.warningsHide : labels.warningsShow}
              </Button>
            }
          >
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
              {labels.warnings(preview.warnings.length)}
            </Typography>
            <Collapse in={warningsOpen}>
              <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5, fontSize: 12.5, maxHeight: 160, overflowY: 'auto' }}>
                {preview.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </Box>
            </Collapse>
          </Alert>
        )}
      </>
    )
  }

  return (
    <Dialog
      open={open}
      // đang gọi API thì không đóng (tránh bỏ dở lúc đang ghi)
      onClose={busy ? undefined : onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ fontSize: 16, fontWeight: 800 }}>
        {labels.title(month ?? '–')}
      </DialogTitle>

      <DialogContent dividers>
        <Stack sx={{ gap: 2 }}>
          {apiMonth && (
            <Box>
              <SectionTitle>{labels.status.title(month ?? '')}</SectionTitle>
              {statusBody}
            </Box>
          )}

          <Box>
            <SectionTitle
              action={shareEnabled && (
                <AppButton
                  appearance="action"
                  icon={<CloudDownloadOutlinedIcon fontSize="small" />}
                  loading={busy === 'preview' && source?.kind === 'share'}
                  disabled={Boolean(busy)}
                  onClick={pickShare}
                >
                  {labels.fromShare}
                </AppButton>
              )}
            >
              {labels.sourceTitle}
            </SectionTitle>

            {dropZone}

            {source?.kind === 'share' && (
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>
                {labels.shareSelected}
              </Typography>
            )}

            <FormControlLabel
              sx={{ mt: 0.5 }}
              control={
                <Checkbox
                  size="small"
                  checked={allMonths || !apiMonth}
                  disabled={Boolean(busy) || !apiMonth}
                  onChange={(event) => toggleAllMonths(event.target.checked)}
                />
              }
              label={
                <Typography sx={{ fontSize: 13 }}>
                  {labels.allMonths}
                  {apiMonth && !allMonths && (
                    <Box component="span" sx={{ color: 'text.secondary' }}>
                      {` · ${labels.onlyMonth(month ?? '')}`}
                    </Box>
                  )}
                </Typography>
              }
            />
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          {previewBody && <Box>{previewBody}</Box>}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <AppButton disabled={Boolean(busy)} onClick={onClose}>
          {labels.cancel}
        </AppButton>
        <AppButton
          appearance="success"
          loading={busy === 'commit'}
          disabled={!canConfirm}
          onClick={() => source && void run(source, allMonths, false)}
        >
          {labels.confirm}
        </AppButton>
      </DialogActions>
    </Dialog>
  )
}

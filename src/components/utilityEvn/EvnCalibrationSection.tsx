import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined'
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import dayjs from 'dayjs'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { recomputeLossCalibration } from '../../services/utilityEvnService'
import {
  LOSS_CALIBRATION_SCOPES,
  type CalibrationWindow,
  type LossCalibrationResult,
  type LossCalibrationScope,
} from '../../types/utilityEvn'
import { EVN_DASH } from '../../utils/utilityEvnCompare'
import { AppButton } from '../common/AppButton'
import { EvnSection } from './EvnSection'
import { TABULAR_NUMS } from './evnCompareUi'

const cellSx = { ...TABULAR_NUMS, fontSize: 12.5, py: 0.5, px: 1 } as const
const headSx = { ...cellSx, fontWeight: 700, whiteSpace: 'nowrap', bgcolor: 'background.paper' } as const
const tableBoxSx = { border: 1, borderColor: 'divider', borderRadius: 1.5, maxHeight: 320 } as const

type ScopeRun =
  | { status: 'pending' }
  | { status: 'running' }
  | { status: 'done'; result: LossCalibrationResult }
  | { status: 'failed'; error: string }

type ScopeRuns = Partial<Record<LossCalibrationScope, ScopeRun>>

function formatDay(value: string | null | undefined) {
  if (!value) return EVN_DASH
  const d = dayjs(value)
  return d.isValid() ? d.format('DD/MM/YYYY') : value
}

// until / windowTo là exclusive → ngày cuối = trước 1 ngày
function formatLastDay(value: string | null | undefined) {
  if (!value) return EVN_DASH
  const d = dayjs(value)
  return d.isValid() ? d.subtract(1, 'day').format('DD/MM/YYYY') : value
}

function fmt(value: number | null, digits = 1) {
  if (value === null) return EVN_DASH
  return value.toLocaleString('en-US', { maximumFractionDigits: digits })
}

function Tile({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <Box sx={{ px: 1.25, py: 0.75, border: 1, borderColor: 'divider', borderRadius: 1.5, minWidth: 0 }}>
      <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }} noWrap>
        {label}
      </Typography>
      <Typography sx={{ ...TABULAR_NUMS, fontSize: 18, fontWeight: 800, lineHeight: 1.3 }} noWrap>
        {value}
        {unit && (
          <Box component="span" sx={{ ml: 0.5, fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
            {unit}
          </Box>
        )}
      </Typography>
    </Box>
  )
}

function Foldable({ title, show, hide, children }: { title: string; show: string; hide: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <Box>
      <Button
        size="small"
        color="inherit"
        onClick={() => setOpen((v) => !v)}
        endIcon={open ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
        sx={{ textTransform: 'none', fontWeight: 700, px: 0.5 }}
        aria-expanded={open}
      >
        {title}
        <Box component="span" sx={{ ml: 0.75, fontWeight: 400, color: 'text.secondary' }}>
          · {open ? hide : show}
        </Box>
      </Button>
      <Collapse in={open} unmountOnExit>
        <Box sx={{ pt: 0.5 }}>{children}</Box>
      </Collapse>
    </Box>
  )
}

function ScopeCard({ scope, run }: { scope: LossCalibrationScope; run: ScopeRun }) {
  const { t } = useI18n()
  const labels = t.utilityEvnImport.calibration
  const common = t.utilityEvnImport

  let body: ReactNode
  if (run.status === 'pending') {
    body = <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{labels.pending}</Typography>
  } else if (run.status === 'running') {
    body = (
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} />
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{labels.running(scope)}</Typography>
      </Stack>
    )
  } else if (run.status === 'failed') {
    body = <Alert severity="error">{run.error}</Alert>
  } else {
    const r = run.result
    body = (
      <Stack sx={{ gap: 1 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 1 }}>
          <Tile label={labels.card.lossPerHour} value={fmt(r.lossKwhPerHour, 1)} unit="kWh/h" />
          <Tile label={labels.card.lossPerDay} value={fmt(r.lossKwhPerDay, 0)} unit="kWh" />
          <Tile label={labels.card.lossPct} value={r.lossPctOfAvgLoad === null ? EVN_DASH : `${fmt(r.lossPctOfAvgLoad, 2)}%`} />
          <Tile label={labels.card.sampleDays} value={fmt(r.sampleDays, 0)} />
          <Tile label={labels.card.effectiveFrom} value={formatDay(r.effectiveFrom)} />
        </Box>

        <Typography sx={{ ...TABULAR_NUMS, fontSize: 12, color: 'text.secondary' }}>
          {labels.card.meta(r.id, formatDay(r.windowFrom), formatLastDay(r.windowTo), r.evnDaysNotUsed)}
        </Typography>

        {r.warnings.length > 0 && (
          <Alert severity="warning" variant="filled" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
            <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: 13 }}>
              {r.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </Box>
          </Alert>
        )}

        <Foldable title={labels.excluded.title(r.excluded.length)} show={common.warningsShow} hide={common.warningsHide}>
          {r.excluded.length === 0 ? (
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', px: 0.5 }}>{EVN_DASH}</Typography>
          ) : (
            <TableContainer sx={tableBoxSx}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headSx}>{labels.excluded.day}</TableCell>
                    <TableCell sx={headSx}>{labels.excluded.reason}</TableCell>
                    <TableCell sx={headSx} align="right">{labels.excluded.coverage}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {r.excluded.map((e) => (
                    <TableRow key={e.day}>
                      <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }}>{formatDay(e.day)}</TableCell>
                      <TableCell sx={cellSx}>{labels.excluded.reasons[e.reason] ?? e.reason}</TableCell>
                      <TableCell sx={cellSx} align="right">
                        {e.coveragePct === null ? EVN_DASH : `${fmt(e.coveragePct, 1)}%`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Foldable>

        <Foldable title={labels.samples.title(r.samples.length)} show={common.warningsShow} hide={common.warningsHide}>
          {r.samples.length === 0 ? (
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', px: 0.5 }}>{EVN_DASH}</Typography>
          ) : (
            <TableContainer sx={tableBoxSx}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headSx}>{labels.samples.day}</TableCell>
                    <TableCell sx={headSx} align="right">{labels.samples.evn}</TableCell>
                    <TableCell sx={headSx} align="right">{labels.samples.grid}</TableCell>
                    <TableCell sx={headSx} align="right">{labels.samples.load}</TableCell>
                    <TableCell sx={headSx} align="right">{labels.samples.diff}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {r.samples.map((s) => (
                    <TableRow key={s.day}>
                      <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }}>{formatDay(s.day)}</TableCell>
                      <TableCell sx={cellSx} align="right">{fmt(s.evnTotalKwh, 0)}</TableCell>
                      <TableCell sx={cellSx} align="right">{fmt(s.measuredGridKwh, 0)}</TableCell>
                      <TableCell sx={cellSx} align="right">{fmt(s.measuredLoadKwh, 0)}</TableCell>
                      <TableCell
                        sx={{ ...cellSx, color: s.diffKwhPerHour < 0 ? 'warning.main' : undefined }}
                        align="right"
                      >
                        {fmt(s.diffKwhPerHour, 1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Foldable>
      </Stack>
    )
  }

  return (
    <Box
      sx={{
        p: 1.25,
        border: 1,
        borderColor: run.status === 'failed' ? 'error.main' : 'divider',
        borderRadius: 1.5,
        minWidth: 0,
      }}
    >
      <Typography sx={{ fontSize: 14, fontWeight: 800, mb: 0.75 }}>{scope}</Typography>
      {body}
    </Box>
  )
}

interface EvnCalibrationSectionProps {
  calibration: CalibrationWindow
  // inserted + updated > 0 của lần import thật
  dataChanged: boolean
  createdBy: string | null
  // phần import đang gọi API → khóa nút
  locked: boolean
  onBusyChange: (busy: boolean) => void
  // ít nhất 1 scope tính thành công → màn So sánh tải lại
  onCalibrated?: () => void
}

// Bước B: chỉ hiện sau import thật (dryRun = false). Parent dựng lại (key) sau mỗi lần import
// → nút mở lại; trong cùng 1 lần import chỉ tính 1 lần để không tạo dòng hiệu chỉnh trùng.
export function EvnCalibrationSection({
  calibration,
  dataChanged,
  createdBy,
  locked,
  onBusyChange,
  onCalibrated,
}: EvnCalibrationSectionProps) {
  const { t } = useI18n()
  const labels = t.utilityEvnImport.calibration

  const [runs, setRuns] = useState<ScopeRuns>({})
  const [running, setRunning] = useState(false)
  // đã có scope tính thành công → khóa đến lần import sau
  const [stored, setStored] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const inFlight = useRef(false)
  const controller = useRef<AbortController | null>(null)

  useEffect(() => () => controller.current?.abort(), [])

  const { available, days, until } = calibration
  const canRun = available && days !== null && until !== null && !locked && !running && !stored

  async function run() {
    if (!canRun || inFlight.current) return
    inFlight.current = true

    const ctrl = new AbortController()
    controller.current = ctrl

    setRunning(true)
    onBusyChange(true)
    setRuns(Object.fromEntries(LOSS_CALIBRATION_SCOPES.map((s) => [s, { status: 'pending' }])))

    let anyStored = false

    try {
      // tuần tự: FAC_AB rồi FAC_C; scope đầu lỗi vẫn chạy scope sau
      for (const scope of LOSS_CALIBRATION_SCOPES) {
        setRuns((prev) => ({ ...prev, [scope]: { status: 'running' } }))

        try {
          const result = await recomputeLossCalibration(
            { scope, days: days!, until: until!, createdBy: createdBy ?? undefined },
            ctrl.signal,
          )
          if (ctrl.signal.aborted) return

          anyStored = true
          setRuns((prev) => ({ ...prev, [scope]: { status: 'done', result } }))
        } catch (err) {
          if (ctrl.signal.aborted) return
          const error = err instanceof Error ? err.message : String(err)
          setRuns((prev) => ({ ...prev, [scope]: { status: 'failed', error } }))
        }
      }
    } finally {
      inFlight.current = false
      if (!ctrl.signal.aborted) {
        setRunning(false)
        onBusyChange(false)
        if (anyStored) {
          setStored(true)
          onCalibrated?.()
        }
      }
    }
  }

  function confirm() {
    setConfirmOpen(false)
    void run()
  }

  const windowText = available && days !== null
    ? labels.window(formatDay(calibration.from), formatLastDay(until), days, formatDay(calibration.lastEvnDay))
    : null

  const scopesShown = LOSS_CALIBRATION_SCOPES.filter((s) => runs[s])

  return (
    <EvnSection title={labels.title}>
      {!available ? (
        <Alert severity="info">{labels.unavailable}</Alert>
      ) : (
        <Stack sx={{ gap: 1.25 }}>
          {windowText && (
            <Typography sx={{ ...TABULAR_NUMS, fontSize: 13, fontWeight: 700 }}>{windowText}</Typography>
          )}

          {!dataChanged && <Alert severity="info">{labels.unchanged}</Alert>}

          <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <AppButton
              appearance="action"
              icon={<CalculateOutlinedIcon fontSize="small" />}
              loading={running}
              disabled={!canRun}
              onClick={() => setConfirmOpen(true)}
            >
              {labels.button}
            </AppButton>

            {stored && !running && (
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{labels.done}</Typography>
            )}
          </Stack>

          {scopesShown.length > 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.25 }}>
              {scopesShown.map((scope) => (
                <ScopeCard key={scope} scope={scope} run={runs[scope]!} />
              ))}
            </Box>
          )}
        </Stack>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 800 }}>{labels.confirm.title}</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ fontSize: 14 }}>{labels.confirm.body}</Typography>
          {windowText && (
            <Typography sx={{ ...TABULAR_NUMS, fontSize: 12.5, color: 'text.secondary', mt: 1 }}>
              {windowText}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <AppButton onClick={() => setConfirmOpen(false)}>{labels.confirm.cancel}</AppButton>
          <AppButton appearance="success" disabled={!canRun} onClick={confirm}>
            {labels.confirm.ok}
          </AppButton>
        </DialogActions>
      </Dialog>
    </EvnSection>
  )
}

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import StopRoundedIcon from '@mui/icons-material/StopRounded'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import ClearAllRoundedIcon from '@mui/icons-material/ClearAllRounded'
import PlaylistAddRoundedIcon from '@mui/icons-material/PlaylistAddRounded'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { SIMU_WEEK_OPTIONS } from '../costMonitoring/costChartConfig'
import { MascotMarkdown } from '../mascot/MascotMarkdown'
import {
  MAX_PER_MINUTE,
  parseSuiteFile,
  useAiTestSuite,
  type AiTestProgress,
} from '../../hooks/useAiTestSuite'
import type { AiTestCase, AiTestRun, AiTestVerdict } from '../../types/aiTestSuite'
import { uiTokens } from '../../theme/uiTokens'
import type { Messages } from '../../i18n/i18nContext'
import { useI18n } from '../../i18n/useI18n'
import { AiTestCaseDialog } from './AiTestCaseDialog'
import { TABULAR_NUMS, formatDateTime, formatSec } from './aiLogsUtils'
import { drawerLabel, groupCases, isOverLimit } from './aiTestUtils'

const cellSx = { ...TABULAR_NUMS, fontSize: 12.5, py: 0.75, px: 1, verticalAlign: 'top' } as const
const headSx = { ...cellSx, fontWeight: 700, whiteSpace: 'nowrap', bgcolor: 'background.paper' } as const
const COLS = 6

type Labels = Messages['aiLogs']['tests']

// =========================================================
// Đếm ngược thời gian đợi (giãn nhịp / 429 / 503)
// =========================================================

function useSecondsLeft(until: number | null) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (until == null) return
    const timer = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(timer)
  }, [until])

  return until == null ? 0 : Math.max(0, Math.ceil((until - now) / 1000))
}

function waitText(progress: AiTestProgress, seconds: number, labels: Labels) {
  if (!progress.wait) return null
  return labels.wait[progress.wait.reason](seconds)
}

// =========================================================
// Ô kết quả: chưa chạy / đang chạy / chờ / OK / lỗi + thời gian
// =========================================================

function RunningStatus({ progress, labels }: { progress: AiTestProgress; labels: Labels }) {
  const seconds = useSecondsLeft(progress.wait?.until ?? null)
  const waiting = waitText(progress, seconds, labels)

  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75 }}>
      <CircularProgress size={14} color={waiting ? 'warning' : 'primary'} />
      <Typography sx={{ ...TABULAR_NUMS, fontSize: 12, color: waiting ? 'warning.main' : 'text.primary' }}>
        {waiting ?? labels.status.running}
        {progress.attempt > 0 && ` · ${labels.retry(progress.attempt)}`}
      </Typography>
    </Stack>
  )
}

function RunStatus({
  testCase,
  run,
  state,
  progress,
  labels,
}: {
  testCase: AiTestCase
  run: AiTestRun | undefined
  state: 'running' | 'queued' | null
  progress: AiTestProgress | null
  labels: Labels
}) {
  if (state === 'running' && progress) {
    return <RunningStatus progress={progress} labels={labels} />
  }
  if (state === 'queued') {
    return <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{labels.status.queued}</Typography>
  }
  if (!run) {
    return <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>{labels.status.notRun}</Typography>
  }

  const over = isOverLimit(testCase, run)

  return (
    <Stack sx={{ gap: 0.5, alignItems: 'flex-start' }}>
      <Tooltip title={run.errorMessage ?? ''} disableHoverListener={!run.errorMessage}>
        <Chip
          size="small"
          label={run.ok ? labels.status.ok : run.errorCode ?? labels.status.error}
          color={run.ok ? 'success' : 'error'}
          variant="outlined"
          sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
        />
      </Tooltip>
      <Typography
        sx={{
          ...TABULAR_NUMS,
          fontSize: 12,
          fontWeight: over ? 800 : 500,
          color: over ? 'error.main' : 'text.secondary',
        }}
      >
        {`${formatSec(run.ms, 1)} s`}
        {over && testCase.maxSec != null && ` · ${labels.overLimit(testCase.maxSec)}`}
      </Typography>
    </Stack>
  )
}

// =========================================================
// Dòng mở rộng: câu trả lời, tool đã gọi, ghi chú
// =========================================================

function RunDetail({
  run,
  labels,
  onNote,
}: {
  run: AiTestRun
  labels: Labels
  onNote: (note: string) => void
}) {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2, py: 1.5, px: 1 }}>
      <Box sx={{ flex: 2, minWidth: 0 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>
          {`${labels.answer} · ${labels.ranAt} ${formatDateTime(run.at)}`}
        </Typography>
        <Box
          sx={{
            p: 1.25,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.default',
            fontSize: 13,
            maxHeight: 420,
            overflowY: 'auto',
          }}
        >
          {run.answer ? (
            <MascotMarkdown>{run.answer}</MascotMarkdown>
          ) : (
            <Typography sx={{ fontSize: 12.5, color: 'error.main' }}>
              {`${run.errorCode ?? ''} ${run.errorMessage ?? ''}`.trim() || labels.status.error}
            </Typography>
          )}
        </Box>
      </Box>

      <Stack sx={{ flex: 1, minWidth: 220, gap: 1.5 }}>
        <Box>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>
            {labels.sources}
          </Typography>
          {run.sources.length === 0 ? (
            <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>{labels.noSources}</Typography>
          ) : (
            <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap' }}>
              {run.sources.map((s) => (
                <Chip
                  key={`${s.tool}|${s.div ?? ''}|${s.cost ?? ''}|${s.month ?? ''}`}
                  size="small"
                  label={[s.tool, s.div, s.cost, s.month].filter(Boolean).join(' · ')}
                  sx={{ height: 20, fontSize: 11 }}
                />
              ))}
            </Stack>
          )}
        </Box>

        <TextField
          size="small"
          label={labels.note}
          placeholder={labels.notePlaceholder}
          value={run.note}
          onChange={(e) => onNote(e.target.value)}
          multiline
          minRows={3}
        />
      </Stack>
    </Stack>
  )
}

// =========================================================
// Thanh tiến độ + lý do đang đợi
// =========================================================

function RunProgress({ progress, labels }: { progress: AiTestProgress; labels: Labels }) {
  const seconds = useSecondsLeft(progress.wait?.until ?? null)
  const waiting = waitText(progress, seconds, labels)

  return (
    <Box sx={{ flexShrink: 0 }}>
      <LinearProgress
        variant="determinate"
        color={waiting ? 'warning' : 'primary'}
        value={(progress.done / Math.max(progress.total, 1)) * 100}
      />
      <Typography sx={{ ...TABULAR_NUMS, fontSize: 11.5, color: 'text.secondary', mt: 0.5 }}>
        {labels.progress(progress.done + 1, progress.total)}
        {waiting && ` · ${waiting}`}
      </Typography>
    </Box>
  )
}

// =========================================================
// PANEL
// =========================================================

export function AiTestSuitePanel() {
  const { t } = useI18n()
  const labels = t.aiLogs.tests
  const suite = useAiTestSuite()
  const { cases, runs, progress } = suite

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [dialog, setDialog] = useState<{ open: boolean; initial: AiTestCase | null }>({ open: false, initial: null })
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [message, setMessage] = useState<{ severity: 'success' | 'error'; text: string } | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const grouped = useMemo(() => groupCases(cases), [cases])
  const groupNames = useMemo(() => grouped.map((g) => g.group).filter(Boolean), [grouped])

  const summary = useMemo(() => {
    const ran = cases.map((c) => runs[c.id]).filter((r): r is AiTestRun => r != null)
    const timed = ran.filter((r) => r.ok)
    return {
      total: cases.length,
      ran: ran.length,
      pass: ran.filter((r) => r.verdict === 'pass').length,
      fail: ran.filter((r) => r.verdict === 'fail').length,
      unrated: ran.filter((r) => r.verdict == null).length,
      errors: ran.filter((r) => !r.ok).length,
      slow: cases.filter((c) => isOverLimit(c, runs[c.id])).length,
      avgMs: timed.length ? timed.reduce((s, r) => s + r.ms, 0) / timed.length : null,
    }
  }, [cases, runs])

  // chưa chạy / lỗi / Không đạt / vượt thời gian
  const retryIds = cases
    .filter((c) => {
      const r = runs[c.id]
      return !r || !r.ok || r.verdict === 'fail' || isOverLimit(c, r)
    })
    .map((c) => c.id)

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function rowState(id: string): 'running' | 'queued' | null {
    if (progress?.currentId === id) return 'running'
    if (progress?.queued.includes(id)) return 'queued'
    return null
  }

  async function handleImport(file: File) {
    try {
      const next = parseSuiteFile(await file.text())
      suite.importState(next)
      setMessage({ severity: 'success', text: labels.imported(next.cases.length) })
    } catch (err) {
      setMessage({ severity: 'error', text: `${labels.importFailed}: ${err instanceof Error ? err.message : String(err)}` })
    }
  }

  function closeMenuThen(action: () => void) {
    setMenuAnchor(null)
    action()
  }

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: uiTokens.page.gap }}>
      {/* thanh công cụ – pt chừa chỗ cho label nổi của ô outlined (wrapper overflow: auto cắt mất) */}
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap', flexShrink: 0, pt: 1 }}>
        <TextField
          size="small"
          type="month"
          label={labels.month}
          value={suite.config.month}
          onChange={(e) => suite.setConfig({ ...suite.config, month: e.target.value })}
          disabled={suite.running}
          sx={{ width: 160 }}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          select
          size="small"
          label={labels.simuWeek}
          value={suite.config.simuWeek}
          onChange={(e) => suite.setConfig({ ...suite.config, simuWeek: e.target.value })}
          disabled={suite.running}
          sx={{ width: 170 }}
        >
          {SIMU_WEEK_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>

        <Tooltip title={labels.perMinuteHelp(MAX_PER_MINUTE)}>
          <TextField
            size="small"
            type="number"
            label={labels.perMinute}
            value={suite.config.perMinute}
            onChange={(e) => suite.setConfig({ ...suite.config, perMinute: Number(e.target.value) })}
            disabled={suite.running}
            sx={{ width: 120 }}
            slotProps={{ htmlInput: { min: 1, max: MAX_PER_MINUTE, step: 1 } }}
          />
        </Tooltip>

        {suite.running ? (
          <Button
            size="small"
            variant="contained"
            color="error"
            startIcon={<StopRoundedIcon />}
            onClick={suite.stop}
            sx={{ textTransform: 'none' }}
          >
            {labels.stop}
          </Button>
        ) : (
          <>
            <Button
              size="small"
              variant="contained"
              startIcon={<PlayArrowRoundedIcon />}
              disabled={cases.length === 0}
              onClick={() => void suite.run(cases.map((c) => c.id))}
              sx={{ textTransform: 'none' }}
            >
              {labels.runAll(cases.length)}
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ReplayRoundedIcon />}
              disabled={retryIds.length === 0}
              onClick={() => void suite.run(retryIds)}
              sx={{ textTransform: 'none' }}
            >
              {labels.runRetry(retryIds.length)}
            </Button>
          </>
        )}

        <Box sx={{ flex: 1 }} />

        <Button
          size="small"
          variant="outlined"
          startIcon={<AddRoundedIcon />}
          onClick={() => setDialog({ open: true, initial: null })}
          sx={{ textTransform: 'none' }}
        >
          {labels.add}
        </Button>

        <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label={labels.more}>
          <MoreVertRoundedIcon fontSize="small" />
        </IconButton>

        <Menu anchorEl={menuAnchor} open={menuAnchor !== null} onClose={() => setMenuAnchor(null)}>
          <MenuItem onClick={() => closeMenuThen(() => fileInput.current?.click())} disabled={suite.running}>
            <ListItemIcon><FileUploadOutlinedIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{labels.import}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => closeMenuThen(() => suite.exportSuite(false))}>
            <ListItemIcon><FileDownloadOutlinedIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{labels.export}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => closeMenuThen(() => suite.exportSuite(true))}>
            <ListItemIcon><FileDownloadOutlinedIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{labels.exportWithRuns}</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => closeMenuThen(() => {
              const added = suite.mergeDefaults()
              setMessage({ severity: 'success', text: labels.mergedDefaults(added) })
            })}
          >
            <ListItemIcon><PlaylistAddRoundedIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{labels.mergeDefaults}</ListItemText>
          </MenuItem>
          <MenuItem
            disabled={suite.running}
            onClick={() => closeMenuThen(() => {
              if (window.confirm(labels.clearRunsConfirm)) suite.clearRuns()
            })}
          >
            <ListItemIcon><ClearAllRoundedIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{labels.clearRuns}</ListItemText>
          </MenuItem>
          <MenuItem
            disabled={suite.running}
            onClick={() => closeMenuThen(() => {
              if (window.confirm(labels.resetConfirm)) suite.resetToDefaults()
            })}
          >
            <ListItemIcon><RestartAltRoundedIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{labels.resetDefaults}</ListItemText>
          </MenuItem>
        </Menu>

        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void handleImport(file)
          }}
        />
      </Stack>

      {/* tổng hợp */}
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>
        <Chip size="small" label={labels.summary.ran(summary.ran, summary.total)} />
        <Chip size="small" color="success" variant="outlined" label={labels.summary.pass(summary.pass)} />
        <Chip size="small" color="error" variant="outlined" label={labels.summary.fail(summary.fail)} />
        <Chip size="small" variant="outlined" label={labels.summary.unrated(summary.unrated)} />
        {summary.errors > 0 && <Chip size="small" color="error" label={labels.summary.errors(summary.errors)} />}
        {summary.slow > 0 && <Chip size="small" color="warning" label={labels.summary.slow(summary.slow)} />}
        <Typography sx={{ ...TABULAR_NUMS, fontSize: 12, color: 'text.secondary', ml: 0.5 }}>
          {`${labels.summary.avg}: ${formatSec(summary.avgMs, 1)} s`}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{labels.storageNote}</Typography>
      </Stack>

      {progress && <RunProgress progress={progress} labels={labels} />}

      {/* bảng */}
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
        <TableContainer sx={{ flex: 1, minHeight: 0 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...headSx, width: 36 }} />
                <TableCell sx={{ ...headSx, width: '28%' }}>{labels.table.question}</TableCell>
                <TableCell sx={headSx}>{labels.table.expected}</TableCell>
                <TableCell sx={{ ...headSx, width: 140 }}>{labels.table.result}</TableCell>
                <TableCell sx={{ ...headSx, width: 96 }}>{labels.table.verdict}</TableCell>
                <TableCell sx={{ ...headSx, width: 112 }} align="right">{labels.table.actions}</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {cases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLS} align="center" sx={{ ...cellSx, py: 4, color: 'text.secondary' }}>
                    {labels.table.empty}
                  </TableCell>
                </TableRow>
              ) : grouped.map(({ group, items }) => (
                <Fragment key={group || '__none'}>
                  {group && (
                    <TableRow>
                      <TableCell
                        colSpan={COLS}
                        sx={(theme) => ({
                          ...cellSx,
                          fontWeight: 800,
                          bgcolor: alpha(theme.palette.primary.main, 0.06),
                        })}
                      >
                        {group}
                      </TableCell>
                    </TableRow>
                  )}

                  {items.map((testCase) => {
                    const run = runs[testCase.id]
                    const state = rowState(testCase.id)
                    const open = expanded.has(testCase.id) && run != null
                    const drawer = drawerLabel(testCase.drawer)
                    const index = cases.indexOf(testCase) + 1

                    return (
                      <Fragment key={testCase.id}>
                        <TableRow
                          hover
                          onClick={() => run && toggleExpanded(testCase.id)}
                          sx={(theme) => ({
                            cursor: run ? 'pointer' : 'default',
                            '& > td': { borderBottom: open ? 0 : undefined },
                            ...(run?.verdict === 'fail' && { bgcolor: alpha(theme.palette.error.main, 0.04) }),
                          })}
                        >
                          <TableCell sx={{ ...cellSx, color: 'text.secondary' }}>
                            <Stack direction="row" sx={{ alignItems: 'center' }}>
                              {run ? (
                                open
                                  ? <KeyboardArrowDownRoundedIcon sx={{ fontSize: 16 }} />
                                  : <KeyboardArrowRightRoundedIcon sx={{ fontSize: 16 }} />
                              ) : <Box sx={{ width: 16 }} />}
                              {index}
                            </Stack>
                          </TableCell>

                          <TableCell sx={cellSx}>
                            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{testCase.question}</Typography>
                            <Stack direction="row" sx={{ gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                              {drawer && (
                                <Chip
                                  size="small"
                                  color="info"
                                  variant="outlined"
                                  label={labels.table.drawerChip(drawer)}
                                  sx={{ height: 18, fontSize: 10.5 }}
                                />
                              )}
                              {testCase.maxSec != null && (
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  label={labels.table.maxSecChip(testCase.maxSec)}
                                  sx={{ height: 18, fontSize: 10.5 }}
                                />
                              )}
                            </Stack>
                          </TableCell>

                          <TableCell sx={{ ...cellSx, color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                            {testCase.expected || '–'}
                          </TableCell>

                          <TableCell sx={cellSx}>
                            <RunStatus
                              testCase={testCase}
                              run={run}
                              state={state}
                              progress={progress}
                              labels={labels}
                            />
                          </TableCell>

                          <TableCell sx={cellSx} onClick={(e) => e.stopPropagation()}>
                            <ToggleButtonGroup
                              size="small"
                              exclusive
                              disabled={!run}
                              value={run?.verdict ?? null}
                              onChange={(_, v: AiTestVerdict | null) => suite.setVerdict(testCase.id, v)}
                            >
                              <ToggleButton value="pass" color="success" sx={{ p: 0.25 }} aria-label={labels.pass}>
                                <Tooltip title={labels.pass}><CheckRoundedIcon sx={{ fontSize: 18 }} /></Tooltip>
                              </ToggleButton>
                              <ToggleButton value="fail" color="error" sx={{ p: 0.25 }} aria-label={labels.fail}>
                                <Tooltip title={labels.fail}><CloseRoundedIcon sx={{ fontSize: 18 }} /></Tooltip>
                              </ToggleButton>
                            </ToggleButtonGroup>
                          </TableCell>

                          <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }} align="right" onClick={(e) => e.stopPropagation()}>
                            <Tooltip title={labels.run}>
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={suite.running}
                                  onClick={() => void suite.run([testCase.id])}
                                >
                                  <PlayArrowRoundedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title={labels.edit}>
                              <IconButton size="small" onClick={() => setDialog({ open: true, initial: testCase })}>
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={labels.delete}>
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={state !== null}
                                  onClick={() => {
                                    if (window.confirm(labels.deleteConfirm(testCase.question))) {
                                      suite.deleteCase(testCase.id)
                                    }
                                  }}
                                >
                                  <DeleteOutlineRoundedIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>

                        {run && (
                          <TableRow>
                            <TableCell colSpan={COLS} sx={{ p: 0, borderBottom: open ? undefined : 0 }}>
                              <Collapse in={open} unmountOnExit>
                                <RunDetail
                                  run={run}
                                  labels={labels}
                                  onNote={(note) => suite.setNote(testCase.id, note)}
                                />
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    )
                  })}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <AiTestCaseDialog
        open={dialog.open}
        initial={dialog.initial}
        groups={groupNames}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        onSave={(testCase) => {
          suite.saveCase(testCase)
          setDialog((d) => ({ ...d, open: false }))
        }}
      />

      <Snackbar
        open={message !== null}
        autoHideDuration={5000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={message?.severity ?? 'success'} onClose={() => setMessage(null)}>
          {message?.text ?? ''}
        </Alert>
      </Snackbar>
    </Box>
  )
}

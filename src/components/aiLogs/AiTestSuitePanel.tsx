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
  Divider,
  IconButton,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha, keyframes } from '@mui/material/styles'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import ClearAllRoundedIcon from '@mui/icons-material/ClearAllRounded'
import PlaylistAddRoundedIcon from '@mui/icons-material/PlaylistAddRounded'
import { Fragment, memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { SIMU_WEEK_OPTIONS } from '../costMonitoring/costChartConfig'
import { MascotMarkdown } from '../mascot/MascotMarkdown'
import { ASSISTANT_SCREENS, getScreenNameByKey } from '../mascot/mascotMessages'
import {
  MAX_PER_MINUTE,
  parseSuiteFile,
  useAiTestSuite,
  type AiTestProgress,
} from '../../hooks/useAiTestSuite'
import {
  DEFAULT_TEST_SCREEN_KEY,
  type AiTestCase,
  type AiTestRun,
  type AiTestVerdict,
} from '../../types/aiTestSuite'
import { uiTokens } from '../../theme/uiTokens'
import { loadPreference, savePreference } from '../../utils/uiPreferences'
import type { Messages } from '../../i18n/i18nContext'
import { useI18n } from '../../i18n/useI18n'
import { AiTestCaseDialog } from './AiTestCaseDialog'
import { TABULAR_NUMS, formatDateTime, formatSec } from './aiLogsUtils'
import { BUILTIN_SUITES, CUSTOM_SUITE_ID, suiteOf } from './aiTestSuiteRegistry'
import { drawerLabel, groupCases, isCostScreen, isOverLimit } from './aiTestUtils'

const cellSx = { ...TABULAR_NUMS, fontSize: 12.5, py: 0.75, px: 1, verticalAlign: 'top' } as const
const headSx = { ...cellSx, fontWeight: 700, whiteSpace: 'nowrap', bgcolor: 'background.paper' } as const
const COLS = 6

type Labels = Messages['aiLogs']['tests']

// tab màn hình đang chọn – nhớ qua các lần mở trang
const PREF_SCREEN_TAB = 'ai-logs:tests:screen'

function loadScreenTab(): string | null {
  const stored = loadPreference(PREF_SCREEN_TAB)
  return typeof stored === 'string' ? stored : null
}

// bộ test đang chọn của từng màn hình – { [screenKey]: suiteId | 'all' }
const PREF_SUITE_TAB = 'ai-logs:tests:suite'
const ALL_SUITES = 'all'

function loadSuiteTabs(): Record<string, string> {
  const stored = loadPreference(PREF_SUITE_TAB)
  return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored as Record<string, string> : {}
}

// =========================================================
// Hàng tab dạng pill (màn hình / bộ test) – nhẹ hơn tab chính của trang
// =========================================================

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
  70% { box-shadow: 0 0 0 5px transparent; opacity: 0.6; }
  100% { box-shadow: 0 0 0 0 transparent; opacity: 1; }
`

interface PillTabItem {
  value: string
  label: string
  total: number
  pass: number
  fail: number
}

function countStats(list: AiTestCase[], runs: Record<string, AiTestRun>) {
  return {
    total: list.length,
    pass: list.filter((c) => runs[c.id]?.verdict === 'pass').length,
    fail: list.filter((c) => runs[c.id]?.verdict === 'fail').length,
  }
}

function PillTabs({
  items,
  value,
  runningValue,
  ariaLabel,
  size = 'md',
  onChange,
}: {
  items: PillTabItem[]
  value: string
  runningValue: string | null
  ariaLabel: string
  // sm: hàng tab bộ test, nằm dưới hàng tab màn hình
  size?: 'md' | 'sm'
  onChange: (value: string) => void
}) {
  const { t } = useI18n()
  const sm = size === 'sm'

  return (
    <Tabs
      value={value}
      onChange={(_, v: string) => onChange(v)}
      variant="scrollable"
      scrollButtons="auto"
      aria-label={ariaLabel}
      sx={{
        flexShrink: 0,
        minHeight: sm ? 28 : 32,
        '& .MuiTabs-indicator': { display: 'none' },
        // MUI v9: container của tab là .MuiTabs-list (không còn .MuiTabs-flexContainer)
        '& .MuiTabs-list': { gap: sm ? 0.5 : 0.75, alignItems: 'center', height: sm ? 28 : 32 },
        '& .MuiTabs-scrollButtons': { width: 28 },
      }}
    >
      {items.map(({ value: itemValue, label, total, pass, fail }) => (
        <Tab
          key={itemValue}
          value={itemValue}
          // tên tab + ý nghĩa con số cho trình đọc màn hình (tooltip chỉ hiện khi hover)
          aria-label={`${label} – ${t.aiLogs.screenTabs.countTooltip(total, pass, fail)}`}
          label={(
            <Tooltip describeChild title={t.aiLogs.screenTabs.countTooltip(total, pass, fail)}>
              <Stack direction="row" component="span" sx={{ alignItems: 'center', gap: 0.75 }}>
                {runningValue === itemValue && (
                  <Box
                    component="span"
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      bgcolor: 'warning.main',
                      color: 'warning.main',
                      animation: `${pulse} 1.4s ease-out infinite`,
                    }}
                  />
                )}
                <span>{label}</span>
                <Box
                  component="span"
                  sx={(theme) => ({
                    ...TABULAR_NUMS,
                    minWidth: 18,
                    px: 0.625,
                    borderRadius: 999,
                    fontSize: 10.5,
                    fontWeight: 700,
                    lineHeight: '16px',
                    textAlign: 'center',
                    bgcolor: alpha(theme.palette.text.primary, 0.08),
                    color: 'text.secondary',
                  })}
                >
                  {total}
                </Box>
              </Stack>
            </Tooltip>
          )}
          sx={(theme) => ({
            // đồng bộ với tab màn hình ở tab Logs (AiLogsPage)
            minHeight: sm ? 22 : 26,
            minWidth: 0,
            py: sm ? 0 : 0.25,
            px: sm ? 1 : 1.25,
            borderRadius: 999,
            border: 1,
            borderColor: 'divider',
            // bộ test: viền nét đứt để phân biệt cấp với tab màn hình
            borderStyle: sm ? 'dashed' : 'solid',
            textTransform: 'none',
            fontSize: sm ? 12 : 12.5,
            fontWeight: 600,
            color: 'text.secondary',
            transition: 'background-color 120ms, border-color 120ms',
            '&:hover': { bgcolor: 'action.hover' },
            '&.Mui-selected': {
              borderStyle: 'solid',
              color: 'primary.main',
              borderColor: alpha(theme.palette.primary.main, 0.45),
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            },
            '&.Mui-focusVisible': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: 1,
            },
          })}
        />
      ))}
    </Tabs>
  )
}

// =========================================================
// Màn hình chưa có câu test
// =========================================================

function EmptyScreen({ name, onAdd }: { name: string; onAdd: () => void }) {
  const { t } = useI18n()
  return (
    <Stack sx={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 6, px: 2, textAlign: 'center' }}>
      <PlaylistAddRoundedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
      <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>
        {t.aiLogs.screenTabs.emptyScreen(name)}
      </Typography>
      <Button
        size="small"
        variant="contained"
        startIcon={<AddRoundedIcon />}
        onClick={onAdd}
        sx={{ textTransform: 'none' }}
      >
        {t.aiLogs.screenTabs.addFirstCase}
      </Button>
    </Stack>
  )
}

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
      <Chip
        size="small"
        label={run.ok ? labels.status.ok : run.errorCode ?? labels.status.error}
        color={run.ok ? 'success' : 'error'}
        variant="outlined"
        title={run.errorMessage ?? undefined}
        sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
      />
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
// 1 dòng câu test – memo: lúc đang chạy / chấm điểm chỉ dòng liên quan vẽ lại
// (bộ test vài trăm câu → vẽ lại cả bảng mỗi lần tiến độ đổi làm trang giật)
// Không dùng MUI Tooltip trong dòng (5 tooltip × vài trăm dòng rất nặng) → title gốc của trình duyệt
// =========================================================

interface CaseRowActions {
  toggle: (id: string) => void
  run: (id: string) => void
  edit: (testCase: AiTestCase) => void
  remove: (testCase: AiTestCase) => void
  verdict: (id: string, verdict: AiTestVerdict | null) => void
  note: (id: string, note: string) => void
}

const CaseRow = memo(function CaseRow({
  testCase,
  index,
  run,
  state,
  progress,
  open: openProp,
  running,
  labels,
  actions,
}: {
  testCase: AiTestCase
  index: number
  run: AiTestRun | undefined
  state: 'running' | 'queued' | null
  progress: AiTestProgress | null
  open: boolean
  running: boolean
  labels: Labels
  actions: CaseRowActions
}) {
  const open = openProp && run != null
  const drawer = drawerLabel(testCase.drawer)

  return (
    <>
      <TableRow
        hover
        onClick={() => run && actions.toggle(testCase.id)}
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
          {(drawer || testCase.maxSec != null) && (
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
          )}
        </TableCell>

        <TableCell sx={{ ...cellSx, color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
          {testCase.expected || '–'}
        </TableCell>

        <TableCell sx={cellSx}>
          <RunStatus testCase={testCase} run={run} state={state} progress={progress} labels={labels} />
        </TableCell>

        <TableCell sx={cellSx} onClick={(e) => e.stopPropagation()}>
          <ToggleButtonGroup
            size="small"
            exclusive
            disabled={!run}
            value={run?.verdict ?? null}
            onChange={(_, v: AiTestVerdict | null) => actions.verdict(testCase.id, v)}
          >
            <ToggleButton value="pass" color="success" sx={{ p: 0.25 }} aria-label={labels.pass} title={labels.pass}>
              <CheckRoundedIcon sx={{ fontSize: 18 }} />
            </ToggleButton>
            <ToggleButton value="fail" color="error" sx={{ p: 0.25 }} aria-label={labels.fail} title={labels.fail}>
              <CloseRoundedIcon sx={{ fontSize: 18 }} />
            </ToggleButton>
          </ToggleButtonGroup>
        </TableCell>

        <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }} align="right" onClick={(e) => e.stopPropagation()}>
          <IconButton
            size="small"
            disabled={running}
            onClick={() => actions.run(testCase.id)}
            aria-label={labels.run}
            title={labels.run}
          >
            <PlayArrowRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => actions.edit(testCase)} aria-label={labels.edit} title={labels.edit}>
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            disabled={state !== null}
            onClick={() => actions.remove(testCase)}
            aria-label={labels.delete}
            title={labels.delete}
          >
            <DeleteOutlineRoundedIcon fontSize="small" />
          </IconButton>
        </TableCell>
      </TableRow>

      {/* chi tiết chỉ dựng khi mở (trước đây mỗi câu đã chạy luôn có 1 dòng Collapse ẩn) */}
      {open && run && (
        <TableRow>
          <TableCell colSpan={COLS} sx={{ p: 0 }}>
            <RunDetail run={run} labels={labels} onNote={(note) => actions.note(testCase.id, note)} />
          </TableCell>
        </TableRow>
      )}
    </>
  )
})

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
  // câu từ file JSON mới (src/data/aiTestSuites) được tự nạp lúc mở tab → báo 1 lần
  const [message, setMessage] = useState<{ severity: 'success' | 'error'; text: string } | null>(() => (
    suite.autoAdded > 0 ? { severity: 'success', text: labels.suites.autoAdded(suite.autoAdded) } : null
  ))
  const fileInput = useRef<HTMLInputElement>(null)

  // ---- tab theo màn hình: màn hình đã khai báo + screenKey lạ có trong bộ test ----
  const screenStats = useMemo<PillTabItem[]>(() => {
    const keys = [...new Set([...ASSISTANT_SCREENS.map((s) => s.screenKey), ...cases.map((c) => c.screenKey)])]
    return keys.map((key) => ({
      value: key,
      label: getScreenNameByKey(key, t),
      ...countStats(cases.filter((c) => c.screenKey === key), runs),
    }))
  }, [cases, runs, t])

  const [storedScreen, setStoredScreen] = useState(loadScreenTab)
  // tab đã lưu không còn (màn hình bị gỡ / xóa hết câu của screenKey lạ) → tab đầu tiên (suy ra khi render)
  const screenKey = screenStats.find((s) => s.value === storedScreen)?.value
    ?? screenStats[0]?.value
    ?? DEFAULT_TEST_SCREEN_KEY
  const costScreen = isCostScreen(screenKey)

  function selectScreen(key: string) {
    setStoredScreen(key)
    savePreference(PREF_SCREEN_TAB, key)
  }

  // màn hình của câu đang chạy → chấm nhấp nháy trên tab
  const runningScreenKey = progress?.currentId
    ? cases.find((c) => c.id === progress.currentId)?.screenKey ?? null
    : null

  const allScreenCases = useMemo(() => cases.filter((c) => c.screenKey === screenKey), [cases, screenKey])

  // ---- tab bộ test trong màn hình: mỗi file JSON (src/data/aiTestSuites/<screenKey>) + "Tự thêm" ----
  const suiteStats = useMemo<PillTabItem[]>(() => {
    const bySuite = new Map<string, AiTestCase[]>()
    for (const c of allScreenCases) {
      const id = suiteOf(c)
      const list = bySuite.get(id)
      if (list) list.push(c)
      else bySuite.set(id, [c])
    }
    const items: PillTabItem[] = BUILTIN_SUITES
      .filter((s) => bySuite.has(s.id))
      .map((s) => ({ value: s.id, label: s.title ?? labels.suites.core, ...countStats(bySuite.get(s.id) ?? [], runs) }))
    const custom = bySuite.get(CUSTOM_SUITE_ID)
    if (custom) items.push({ value: CUSTOM_SUITE_ID, label: labels.suites.custom, ...countStats(custom, runs) })
    // chỉ 1 bộ thì không cần hàng tab con
    if (items.length < 2) return []
    return [{ value: ALL_SUITES, label: labels.suites.all, ...countStats(allScreenCases, runs) }, ...items]
  }, [allScreenCases, runs, labels])

  const [storedSuites, setStoredSuites] = useState(loadSuiteTabs)
  // bộ đã lưu không còn (file JSON bị gỡ / xóa hết câu) → "Tất cả"
  const suiteKey = suiteStats.find((s) => s.value === storedSuites[screenKey])?.value ?? ALL_SUITES

  function selectSuite(id: string) {
    const next = { ...storedSuites, [screenKey]: id }
    setStoredSuites(next)
    savePreference(PREF_SUITE_TAB, next)
  }

  // bộ của câu đang chạy (cùng màn hình) → chấm nhấp nháy trên tab bộ test
  const runningCase = progress?.currentId ? cases.find((c) => c.id === progress.currentId) : undefined
  const runningSuite = runningCase && runningCase.screenKey === screenKey ? suiteOf(runningCase) : null

  // câu đang hiển thị = màn hình + bộ test đang chọn; Chạy / Chạy lại / tổng hợp đều theo danh sách này
  const screenCases = useMemo(
    () => (suiteKey === ALL_SUITES ? allScreenCases : allScreenCases.filter((c) => suiteOf(c) === suiteKey)),
    [allScreenCases, suiteKey],
  )
  const grouped = useMemo(() => groupCases(screenCases), [screenCases])
  // số thứ tự trong danh sách đang xem (tránh indexOf từng dòng – O(n²))
  const indexById = useMemo(() => new Map(screenCases.map((c, i) => [c.id, i + 1])), [screenCases])

  // handler ổn định cho CaseRow (memo) – đọc bản suite mới nhất qua ref
  const suiteRef = useRef(suite)
  useLayoutEffect(() => {
    suiteRef.current = suite
  })
  const rowActions = useMemo<CaseRowActions>(() => ({
    toggle: (id) => setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    }),
    run: (id) => void suiteRef.current.run([id]),
    edit: (testCase) => setDialog({ open: true, initial: testCase }),
    remove: (testCase) => {
      if (window.confirm(labels.deleteConfirm(testCase.question))) suiteRef.current.deleteCase(testCase.id)
    },
    verdict: (id, verdict) => suiteRef.current.setVerdict(id, verdict),
    note: (id, note) => suiteRef.current.setNote(id, note),
  }), [labels])
  // gợi ý ô "Nhóm" trong dialog theo màn hình đang chọn ở dialog
  const groupsByScreen = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const c of cases) {
      if (!c.group) continue
      const list = (map[c.screenKey] ??= [])
      if (!list.includes(c.group)) list.push(c.group)
    }
    return map
  }, [cases])

  const summary = useMemo(() => {
    const ran = screenCases.map((c) => runs[c.id]).filter((r): r is AiTestRun => r != null)
    const timed = ran.filter((r) => r.ok)
    return {
      total: screenCases.length,
      ran: ran.length,
      pass: ran.filter((r) => r.verdict === 'pass').length,
      fail: ran.filter((r) => r.verdict === 'fail').length,
      unrated: ran.filter((r) => r.verdict == null).length,
      errors: ran.filter((r) => !r.ok).length,
      slow: screenCases.filter((c) => isOverLimit(c, runs[c.id])).length,
      avgMs: timed.length ? timed.reduce((s, r) => s + r.ms, 0) / timed.length : null,
    }
  }, [screenCases, runs])

  // chưa chạy / lỗi / Không đạt / vượt thời gian – chỉ trong màn hình đang chọn
  const retryIds = screenCases
    .filter((c) => {
      const r = runs[c.id]
      return !r || !r.ok || r.verdict === 'fail' || isOverLimit(c, r)
    })
    .map((c) => c.id)

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
      <PillTabs
        items={screenStats}
        value={screenKey}
        runningValue={runningScreenKey}
        ariaLabel={t.aiLogs.screenTabs.ariaLabel}
        onChange={selectScreen}
      />

      {suiteStats.length > 0 && (
        <PillTabs
          size="sm"
          items={suiteStats}
          value={suiteKey}
          runningValue={runningSuite}
          ariaLabel={labels.suites.ariaLabel}
          onChange={selectSuite}
        />
      )}

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

        {/* simuWeek chỉ có ở Cost Monitoring */}
        {costScreen && (
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
        )}

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
              disabled={screenCases.length === 0}
              onClick={() => void suite.run(screenCases.map((c) => c.id))}
              sx={{ textTransform: 'none' }}
            >
              {labels.runAll(screenCases.length)}
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
        {screenCases.length === 0 ? (
          <EmptyScreen
            name={getScreenNameByKey(screenKey, t)}
            onAdd={() => setDialog({ open: true, initial: null })}
          />
        ) : (
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
                {grouped.map(({ group, items }) => (
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
                          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                            <span>{group}</span>
                            <Typography component="span" sx={{ ...TABULAR_NUMS, fontSize: 11.5, fontWeight: 600, color: 'text.secondary' }}>
                              {`(${items.length})`}
                            </Typography>
                            <Box sx={{ flex: 1 }} />
                            <Tooltip title={labels.runGroup(items.length)}>
                              <span>
                                <Button
                                  size="small"
                                  startIcon={<PlayArrowRoundedIcon sx={{ fontSize: 16 }} />}
                                  disabled={suite.running}
                                  onClick={() => void suite.run(items.map((c) => c.id))}
                                  aria-label={`${labels.runGroup(items.length)} – ${group}`}
                                  sx={{ textTransform: 'none', fontSize: 12, py: 0, minHeight: 24 }}
                                >
                                  {labels.run}
                                </Button>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )}

                    {items.map((testCase) => (
                      <CaseRow
                        key={testCase.id}
                        testCase={testCase}
                        index={indexById.get(testCase.id) ?? 0}
                        run={runs[testCase.id]}
                        state={rowState(testCase.id)}
                        // chỉ dòng đang chạy nhận progress → các dòng khác không vẽ lại khi tiến độ đổi
                        progress={progress?.currentId === testCase.id ? progress : null}
                        open={expanded.has(testCase.id)}
                        running={suite.running}
                        labels={labels}
                        actions={rowActions}
                      />
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <AiTestCaseDialog
        open={dialog.open}
        initial={dialog.initial}
        defaultScreenKey={screenKey}
        // thêm câu khi đang ở 1 bộ dựng sẵn → câu thuộc bộ đó; "Tất cả" / "Tự thêm" → Tự thêm
        defaultSuite={suiteKey === ALL_SUITES || suiteKey === CUSTOM_SUITE_ID ? undefined : suiteKey}
        groupsByScreen={groupsByScreen}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        onSave={(testCase) => {
          suite.saveCase(testCase)
          setDialog((d) => ({ ...d, open: false }))
          // lưu sang màn hình khác → chuyển tab để thấy ngay câu vừa lưu
          if (testCase.screenKey !== screenKey) selectScreen(testCase.screenKey)
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

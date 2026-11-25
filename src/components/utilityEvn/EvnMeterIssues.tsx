import { useEffect, useRef, useState } from 'react'
import { Box, IconButton, Skeleton, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined'
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined'
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { useI18n } from '../../i18n/useI18n'
import { appScrollbarSx } from '../../theme/scrollbarStyle'
import { uiTokens } from '../../theme/uiTokens'
import type { UtilityMeterIssue } from '../../types/utilityEvn'
import { copyTable } from '../../utils/clipboard'
import { loadPreference, savePreference } from '../../utils/uiPreferences'
import { EVN_DASH, evnScopeLabel, formatAmount, formatDateRanges } from '../../utils/utilityEvnCompare'
import { EvnMeterHoursChart } from './EvnMeterHoursChart'
import { EvnSection } from './EvnSection'
import {
  EVN_PARTIAL_COLOR,
  TABULAR_NUMS,
  evnMeterMetricValue,
  formatEvnMeterMetric,
  type EvnMeterChartMetric,
} from './evnCompareUi'

type IssuesView = 'table' | 'chart'

const ISSUES_VIEW_PREF_KEY = 'utility-evn:issues-view'
const ISSUES_METRIC_PREF_KEY = 'utility-evn:issues-metric'
const ISSUES_GROUP_PREF_KEY = 'utility-evn:issues-group-fac'

interface FacGroup {
  fac: string | null
  issues: UtilityMeterIssue[]
  total: number
}

// Nhóm đồng hồ có số liệu (> 0) theo xưởng: FAC_A, FAC_B, FAC_C…, không rõ xưởng cuối cùng
function groupByFac(issues: UtilityMeterIssue[], metric: EvnMeterChartMetric): FacGroup[] {
  const groups = new Map<string | null, FacGroup>()

  for (const issue of issues) {
    const value = evnMeterMetricValue(issue, metric)
    if (value === null || value <= 0) continue
    const group = groups.get(issue.fac) ?? { fac: issue.fac, issues: [], total: 0 }
    group.issues.push(issue)
    group.total += value
    groups.set(issue.fac, group)
  }

  return [...groups.values()].sort((a, b) => {
    if (a.fac === null) return 1
    if (b.fac === null) return -1
    return a.fac.localeCompare(b.fac)
  })
}

// làm tròn lên số "đẹp" (1 / 2 / 2.5 / 5 × 10^n) cho cuối trục X dùng chung
function niceCeil(value: number): number {
  if (value <= 0) return 1
  const pow = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 2.5, 5, 10].find((s) => s * pow >= value) ?? 10
  return step * pow
}
const METRICS: readonly EvnMeterChartMetric[] = ['hours', 'mwh', 'kusd']

// mặc định Bảng như trước; Biểu đồ chỉ khi người dùng đã chọn
function loadIssuesView(): IssuesView {
  return loadPreference(ISSUES_VIEW_PREF_KEY) === 'chart' ? 'chart' : 'table'
}

function loadIssuesMetric(): EvnMeterChartMetric {
  const stored = loadPreference(ISSUES_METRIC_PREF_KEY)
  return METRICS.includes(stored as EvnMeterChartMetric) ? (stored as EvnMeterChartMetric) : 'hours'
}

const toggleSx = {
  '& .MuiToggleButton-root': { height: 26, px: 1, gap: 0.5, textTransform: 'none', fontSize: 12, fontWeight: 700 },
} as const

interface EvnMeterIssuesProps {
  // đã lọc theo scope đang xem
  issues: UtilityMeterIssue[]
  estimatedMissingMwh: number | null
  loading: boolean
}

type Align = 'left' | 'center' | 'right'

// MWh / K$ ước tính: 3 chữ số thập phân, null → dash (không hiện 0)
function formatEstimate(value: number | null): string {
  if (value === null) return EVN_DASH
  return value.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
}

// Bản sao chép: số thuần (không dấu phân cách nghìn, không đơn vị) để Excel
// nhận là số; trống thay cho dash để cột vẫn cộng được
function copyNumber(value: number | null, digits: number): string {
  return value === null ? '' : value.toFixed(digits)
}

export function EvnMeterIssues({ issues, estimatedMissingMwh, loading }: EvnMeterIssuesProps) {
  const { t } = useI18n()
  const labels = t.utilityEvn.issues
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const resetTimer = useRef<number | undefined>(undefined)
  const [view, setView] = useState<IssuesView>(loadIssuesView)
  const [metric, setMetric] = useState<EvnMeterChartMetric>(loadIssuesMetric)
  const [grouped, setGrouped] = useState(() => loadPreference(ISSUES_GROUP_PREF_KEY) === true)

  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  function changeView(next: IssuesView | null) {
    if (!next) return
    setView(next)
    savePreference(ISSUES_VIEW_PREF_KEY, next)
  }

  function changeMetric(next: EvnMeterChartMetric | null) {
    if (!next) return
    setMetric(next)
    savePreference(ISSUES_METRIC_PREF_KEY, next)
  }

  function toggleGrouped() {
    setGrouped((prev) => {
      savePreference(ISSUES_GROUP_PREF_KEY, !prev)
      return !prev
    })
  }

  const facGroups = view === 'chart' && grouped ? groupByFac(issues, metric) : []
  const groupDomainMax = niceCeil(
    Math.max(0, ...facGroups.flatMap((g) => g.issues.map((i) => evnMeterMetricValue(i, metric) ?? 0))),
  )

  const metricLabel: Record<EvnMeterChartMetric, string> = {
    hours: labels.metricHours,
    mwh: labels.metricMwh,
    kusd: labels.metricKusd,
  }

  const columns: { key: string; label: string; width?: number; align: Align; hint?: string }[] = [
    { key: 'meter', label: labels.meter, width: 220, align: 'left' },
    { key: 'fac', label: labels.fac, width: 80, align: 'center' },
    { key: 'severity', label: labels.severity, width: 90, align: 'center' },
    { key: 'hours', label: labels.missingHours, width: 110, align: 'right' },
    { key: 'mwh', label: labels.estimatedMissingMwh, width: 150, align: 'right', hint: labels.estimatedMissingHint },
    { key: 'kusd', label: labels.estimatedMissingKusd, width: 140, align: 'right', hint: labels.estimatedMissingHint },
    { key: 'dates', label: labels.dates, align: 'left' },
  ]

  // cộng các giá trị khác null; toàn null → null (hiện dash)
  function sumOf(pick: (issue: UtilityMeterIssue) => number | null): number | null {
    let total: number | null = null
    for (const issue of issues) {
      const value = pick(issue)
      if (value !== null) total = (total ?? 0) + value
    }
    return total
  }
  const totalMwh = sumOf((i) => i.estimatedMissingMwh)
  const totalKusd = sumOf((i) => i.estimatedMissingKusd)

  function severityLabel(severity: string | null) {
    if (!severity) return EVN_DASH
    return (labels.severityLabels as Record<string, string | undefined>)[severity] ?? severity
  }

  async function handleCopy() {
    const header = columns.map((col) => col.label)
    const body = issues.map((issue) => [
      issue.meter,
      evnScopeLabel(issue.fac),
      severityLabel(issue.severity),
      copyNumber(issue.missingHours === null ? null : Math.round(issue.missingHours * 10) / 10, 1),
      copyNumber(issue.estimatedMissingMwh, 3),
      copyNumber(issue.estimatedMissingKusd, 3),
      issue.dates.length > 0 ? formatDateRanges(issue.dates) : '',
    ])
    const footer = [[labels.total, '', '', '', copyNumber(totalMwh, 3), copyNumber(totalKusd, 3), '']]

    const ok = await copyTable(header, body, footer)
    setCopyState(ok ? 'copied' : 'failed')
    window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setCopyState('idle'), 1500)
  }

  const copyTooltip = copyState === 'copied' ? labels.copied : copyState === 'failed' ? labels.copyFailed : labels.copy

  return (
    <EvnSection
      title={labels.title}
      extra={
        <>
          {issues.length > 0 && (
            <ToggleButtonGroup
              exclusive
              size="small"
              value={view}
              onChange={(_, next: IssuesView | null) => changeView(next)}
              aria-label={labels.viewAria}
              sx={toggleSx}
            >
              <ToggleButton value="table">
                <TableRowsOutlinedIcon sx={{ fontSize: 15 }} />
                {labels.viewTable}
              </ToggleButton>
              <ToggleButton value="chart">
                <InsertChartOutlinedIcon sx={{ fontSize: 15 }} />
                {labels.viewChart}
              </ToggleButton>
            </ToggleButtonGroup>
          )}
          {issues.length > 0 && view === 'chart' && (
            <ToggleButtonGroup
              exclusive
              size="small"
              value={metric}
              onChange={(_, next: EvnMeterChartMetric | null) => changeMetric(next)}
              aria-label={labels.metricAria}
              sx={toggleSx}
            >
              {METRICS.map((m) => (
                <ToggleButton key={m} value={m}>{metricLabel[m]}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          )}
          {issues.length > 0 && view === 'chart' && (
            <Box sx={toggleSx}>
              <ToggleButton
                value="group"
                size="small"
                selected={grouped}
                onChange={toggleGrouped}
                aria-pressed={grouped}
              >
                <WorkspacesOutlinedIcon sx={{ fontSize: 15 }} />
                {labels.groupByFac}
              </ToggleButton>
            </Box>
          )}
          {issues.length > 0 && (
            <Tooltip title={copyTooltip} arrow>
              <IconButton
                size="small"
                onClick={() => void handleCopy()}
                aria-label={labels.copy}
                sx={{ order: 1, ml: 'auto', p: 0.5, color: copyState === 'copied' ? 'success.main' : 'text.secondary' }}
              >
                {copyState === 'copied'
                  ? <CheckRoundedIcon sx={{ fontSize: 16 }} />
                  : <ContentCopyRoundedIcon sx={{ fontSize: 16 }} />}
              </IconButton>
            </Tooltip>
          )}
          {issues.length > 0 && (
            <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, color: EVN_PARTIAL_COLOR }}>
              <WarningAmberRoundedIcon sx={{ fontSize: 16 }} />
              <Typography sx={{ ...TABULAR_NUMS, fontSize: 12, fontWeight: 700 }}>{issues.length}</Typography>
            </Stack>
          )}
          {estimatedMissingMwh !== null && estimatedMissingMwh > 0 && (
            <Typography sx={{ ...TABULAR_NUMS, fontSize: 12, color: 'text.secondary' }}>
              {labels.estimatedMissing(formatAmount(estimatedMissingMwh, 'MWh'))}
            </Typography>
          )}
        </>
      }
    >
      {loading && issues.length === 0 ? (
        <Stack spacing={0.5}>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} variant="rounded" height={24} />
          ))}
        </Stack>
      ) : issues.length === 0 ? (
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', py: 0.5 }}>{labels.none}</Typography>
      ) : view === 'chart' ? (
        // cùng chiều cao tối đa với bảng; nhiều đồng hồ → cuộn trong khung
        <Box sx={{ maxHeight: grouped ? 420 : 320, overflowY: 'auto', overflowX: 'hidden', ...appScrollbarSx }}>
          {grouped ? (
            facGroups.length === 0 ? (
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary', py: 0.5 }}>
                {metric === 'hours' ? labels.none : labels.noEstimate}
              </Typography>
            ) : (
              <Stack spacing={1}>
                {facGroups.map((group) => (
                  <Box key={group.fac ?? '__none__'}>
                    {/* tiêu đề nhóm: tên xưởng + số đồng hồ + tổng của số liệu đang xem */}
                    <Stack
                      direction="row"
                      sx={(theme) => ({
                        alignItems: 'baseline',
                        gap: 1,
                        px: 0.75,
                        py: 0.25,
                        mb: 0.5,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.text.primary, 0.04),
                        borderLeft: `3px solid ${theme.palette.divider}`,
                      })}
                    >
                      <Typography sx={{ fontSize: 12.5, fontWeight: 800 }}>{evnScopeLabel(group.fac)}</Typography>
                      <Typography sx={{ ...TABULAR_NUMS, fontSize: 11.5, color: 'text.secondary' }}>
                        {labels.groupSummary(
                          group.issues.length,
                          formatEvnMeterMetric(group.total, metric, t.utilityEvn.table.hours),
                        )}
                      </Typography>
                    </Stack>
                    <EvnMeterHoursChart
                      issues={group.issues}
                      loading={loading}
                      metric={metric}
                      limit={Infinity}
                      domainMax={groupDomainMax}
                    />
                  </Box>
                ))}
              </Stack>
            )
          ) : (
            <EvnMeterHoursChart
              issues={issues}
              loading={loading}
              metric={metric}
              limit={Infinity}
              showFac
              emptyLabel={metric === 'hours' ? labels.none : labels.noEstimate}
            />
          )}
        </Box>
      ) : (
        <Box
          sx={(theme) => ({
            maxHeight: 320,
            overflow: 'auto',
            ...appScrollbarSx,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: uiTokens.card.borderRadius,
          })}
        >
          <Box
            component="table"
            sx={{
              width: '100%',
              // màn hình hẹp → cuộn ngang trong khung bảng thay vì bóp cột
              minWidth: 960,
              borderCollapse: 'separate',
              borderSpacing: 0,
              fontSize: uiTokens.table.auxiliaryFontSize,
            }}
          >
            <Box component="thead">
              <Box component="tr">
                {columns.map((col) => (
                  <Box
                    key={col.key}
                    component="th"
                    scope="col"
                    sx={(theme) => ({
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                      width: col.width,
                      height: uiTokens.table.headerHeight,
                      px: 0.75,
                      textAlign: col.align,
                      whiteSpace: 'nowrap',
                      fontWeight: 700,
                      color: 'text.secondary',
                      bgcolor: theme.palette.background.paper,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    })}
                  >
                    {col.hint ? (
                      <Stack
                        direction="row"
                        sx={{ alignItems: 'center', gap: 0.25, justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start' }}
                      >
                        <span>{col.label}</span>
                        <Tooltip title={col.hint} arrow>
                          <InfoOutlinedIcon
                            tabIndex={0}
                            aria-label={col.hint}
                            sx={{ fontSize: 14, color: 'text.disabled', cursor: 'help' }}
                          />
                        </Tooltip>
                      </Stack>
                    ) : (
                      col.label
                    )}
                  </Box>
                ))}
              </Box>
            </Box>

            <Box component="tbody">
              {issues.map((issue) => {
                const major = issue.severity === 'MAJOR'

                return (
                  <Box
                    component="tr"
                    key={issue.meter}
                    sx={(theme) => ({
                      '& > td': {
                        height: uiTokens.table.rowHeight,
                        px: 0.75,
                        py: 0.25,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                      '&:hover > td': {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      },
                    })}
                  >
                    <Box component="td" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{issue.meter}</Box>
                    <Box component="td" sx={{ textAlign: 'center', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {evnScopeLabel(issue.fac)}
                    </Box>
                    <Box component="td" sx={{ textAlign: 'center' }}>
                      <Box
                        component="span"
                        sx={(theme) => {
                          const color = major ? theme.palette.error.main : theme.palette.warning.main
                          return {
                            display: 'inline-block',
                            px: 0.75,
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            lineHeight: '18px',
                            color: issue.severity ? color : 'text.disabled',
                            bgcolor: issue.severity ? alpha(color, 0.12) : undefined,
                          }
                        }}
                      >
                        {severityLabel(issue.severity)}
                      </Box>
                    </Box>
                    <Box
                      component="td"
                      sx={{ ...TABULAR_NUMS, textAlign: 'right', fontWeight: 700, color: major ? 'error.main' : EVN_PARTIAL_COLOR }}
                    >
                      {issue.missingHours === null ? EVN_DASH : t.utilityEvn.table.hours(Math.round(issue.missingHours * 10) / 10)}
                    </Box>
                    <Box component="td" sx={{ ...TABULAR_NUMS, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {formatEstimate(issue.estimatedMissingMwh)}
                    </Box>
                    <Box component="td" sx={{ ...TABULAR_NUMS, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {formatEstimate(issue.estimatedMissingKusd)}
                    </Box>
                    <Box component="td" sx={{ ...TABULAR_NUMS, color: 'text.secondary' }}>
                      {formatDateRanges(issue.dates)}
                    </Box>
                  </Box>
                )
              })}
            </Box>

            <Box component="tfoot">
              <Box
                component="tr"
                sx={(theme) => ({
                  '& > td': {
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 1,
                    height: uiTokens.table.rowHeight,
                    px: 0.75,
                    py: 0.25,
                    fontWeight: 700,
                    bgcolor: theme.palette.background.paper,
                    borderTop: `1px solid ${theme.palette.divider}`,
                  },
                })}
              >
                <Box component="td" colSpan={4}>{labels.total}</Box>
                <Box component="td" sx={{ ...TABULAR_NUMS, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {formatEstimate(totalMwh)}
                </Box>
                <Box component="td" sx={{ ...TABULAR_NUMS, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {formatEstimate(totalKusd)}
                </Box>
                <Box component="td" />
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </EvnSection>
  )
}

import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined'
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined'
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined'
import {
  Alert,
  Box,
  Divider,
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import type { PaletteMode } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FactoryNoRowsOverlay } from '../components/common/FactoryNoRowsOverlay'
import { HeaderAction, HeaderActionBar, HeaderActionDivider } from '../components/common/headerActions'
import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import { UpdatedStatus } from '../components/common/UpdatedStatus'
import { EvnChartBoard } from '../components/utilityEvn/EvnChartBoard'
import { EvnCompareChart } from '../components/utilityEvn/EvnCompareChart'
import { EvnCompareKpi } from '../components/utilityEvn/EvnCompareKpi'
import { EvnCompareNotes } from '../components/utilityEvn/EvnCompareNotes'
import { EvnCompareTable } from '../components/utilityEvn/EvnCompareTable'
import { EvnImportPanel } from '../components/utilityEvn/EvnImportPanel'
import { EvnMeterIssues } from '../components/utilityEvn/EvnMeterIssues'
import { EvnOverviewBoard } from '../components/utilityEvn/EvnOverviewBoard'
import { useUtilityEvnCompare } from '../hooks/useUtilityEvnCompare'
import { useI18n } from '../i18n/useI18n'
import { uiTokens } from '../theme/uiTokens'
import { UTILITY_SCOPE_CODES, type UtilityScopeCode } from '../types/utilityEvn'
import { loadPreference, savePreference } from '../utils/uiPreferences'
import { buildEvnCompareWorkbook } from '../utils/utilityEvnExcel'
import { downloadBlob } from '../utils/xlsxWriter'
import {
  EVN_SCOPE_LABEL,
  EVN_UNITS,
  buildEvnCompareCsv,
  evnMetricOf,
  buildEvnCompareRows,
  collectMeterIssues,
  downloadCsv,
  evnNoteText,
  evnWeekdayLabel,
  formatDataUntil,
  formatDayMonth,
  resolveBillPeriod,
  summarizeEvnCompare,
  summarizeEvnScopes,
  buildEvnOverview,
  buildEvnOverviewCsv,
  buildEvnOverviewRows,
  type EvnUnit,
} from '../utils/utilityEvnCompare'

interface UtilityEvnComparePageProps {
  mode: PaletteMode
  onToggleMode: () => void
}

const SCOPE_PREF_KEY = 'utility-evn:scope'
const UNIT_PREF_KEY = 'utility-evn:unit'
const VIEW_PREF_KEY = 'utility-evn:view'

// table / chart: 1 phạm vi theo tab; overview: cả 3 phạm vi trên 1 màn
type EvnViewMode = 'table' | 'chart' | 'overview'

const VIEW_MODES: readonly EvnViewMode[] = ['overview', 'table', 'chart']

// Tab con của màn: ?tab=import mở thẳng tab Import Excel
type EvnSectionTab = 'compare' | 'import'

const sectionTabsSx = {
  minHeight: 32,
  '& .MuiTabs-list': { height: 32 },
  '& .MuiTab-root': {
    minHeight: 32,
    minWidth: 0,
    px: 1.25,
    py: 0,
    gap: 0.5,
    textTransform: 'none',
    fontSize: 13,
    fontWeight: 800,
  },
} as const

function loadView(): EvnViewMode {
  const stored = loadPreference(VIEW_PREF_KEY)
  return VIEW_MODES.find((v) => v === stored) ?? 'overview'
}

function loadScope(): UtilityScopeCode {
  const stored = loadPreference(SCOPE_PREF_KEY)
  return UTILITY_SCOPE_CODES.find((code) => code === stored) ?? 'KVH'
}

function loadUnit(): EvnUnit {
  const stored = loadPreference(UNIT_PREF_KEY)
  return EVN_UNITS.find((unit) => unit === stored) ?? 'MWh'
}

export function UtilityEvnComparePage({ mode, onToggleMode }: UtilityEvnComparePageProps) {
  const { t } = useI18n()
  const labels = t.utilityEvn

  // YYYY-MM; mặc định tháng hiện tại
  const [month, setMonth] = useState(() => dayjs().format('YYYY-MM'))
  const [scope, setScope] = useState<UtilityScopeCode>(loadScope)
  const [unit, setUnit] = useState<EvnUnit>(loadUnit)
  const [view, setView] = useState<EvnViewMode>(loadView)

  const [searchParams, setSearchParams] = useSearchParams()
  const section: EvnSectionTab = searchParams.get('tab') === 'import' ? 'import' : 'compare'

  // mở tab Import 1 lần thì giữ nguyên (ẩn đi) → đổi qua lại không mất file / kết quả,
  // không hủy request đang ghi DB
  const [importMounted, setImportMounted] = useState(section === 'import')
  if (section === 'import' && !importMounted) setImportMounted(true)

  function changeSection(next: EvnSectionTab) {
    setSearchParams(next === 'import' ? { tab: 'import' } : {}, { replace: true })
  }

  const { data, loading, error, lastUpdated, refresh } = useUtilityEvnCompare(month)

  // MWh/kWh → số điện năng (mwh); kUSD → số tiền (kusd)
  const rows = useMemo(() => buildEvnCompareRows(data, scope, evnMetricOf(unit)), [data, scope, unit])
  const summary = useMemo(() => summarizeEvnCompare(rows), [rows])

  // thẻ đối chiếu chéo: đang xem điện năng thì kèm tiền, đang xem tiền thì kèm MWh
  const crossUnit: EvnUnit = unit === 'kUSD' ? 'MWh' : 'kUSD'
  const crossSummary = useMemo(
    () => summarizeEvnCompare(buildEvnCompareRows(data, scope, evnMetricOf(crossUnit))),
    [data, scope, crossUnit],
  )
  // chỉ tính khi đang ở chế độ Biểu đồ (so sánh 3 phạm vi)
  const scopeTotals = useMemo(
    () => (view === 'chart' ? summarizeEvnScopes(data, evnMetricOf(unit)) : []),
    [data, unit, view],
  )
  // chế độ Tổng quan: số của cả 3 phạm vi
  const overview = useMemo(
    () => (view === 'overview' ? buildEvnOverview(data, evnMetricOf(unit), evnMetricOf(crossUnit)) : []),
    [data, unit, crossUnit, view],
  )
  const overviewRows = useMemo(() => buildEvnOverviewRows(overview), [overview])
  const issues = useMemo(() => collectMeterIssues(data, scope), [data, scope])
  const measuredScope = data?.measured.scopes.find((s) => s.code === scope) ?? null

  const period = resolveBillPeriod(data?.measured.billPeriod ?? data?.official.billPeriod ?? null, month)
  const dataUntil = formatDataUntil(data?.measured.dataUntil ?? data?.official.dataUntil ?? null)

  // chưa có dữ liệu nào để hiện mà lỗi → khung lỗi + Thử lại
  const blockingError = error && !data && !loading

  function changeScope(next: UtilityScopeCode) {
    setScope(next)
    savePreference(SCOPE_PREF_KEY, next)
  }

  function changeUnit(next: EvnUnit | null) {
    if (!next) return
    setUnit(next)
    savePreference(UNIT_PREF_KEY, next)
  }

  function changeView(next: EvnViewMode | null) {
    if (!next) return
    setView(next)
    savePreference(VIEW_PREF_KEY, next)
  }

  // từ thẻ Tổng quan → xem chi tiết 1 phạm vi ở chế độ Bảng
  function openScope(code: UtilityScopeCode) {
    changeScope(code)
    changeView('table')
  }

  function handleExport() {
    const table = labels.table

    if (view === 'overview') {
      const csv = buildEvnOverviewCsv(overviewRows, overview, unit, {
        date: table.date,
        weekday: table.weekday,
        excel: table.excel,
        actual: table.actual,
        diff: table.diff,
        pct: table.pct,
        partial: table.partial,
        total: table.total,
        weekdayOf: (row) => evnWeekdayLabel(row, table.weekdays),
      })
      downloadCsv(csv, `utility-evn-compare_ALL_${month}_${unit}.csv`)
      return
    }

    const csv = buildEvnCompareCsv(rows, summary, unit, {
      date: table.date,
      weekday: table.weekday,
      groups: table.groups,
      excel: table.excel,
      actual: table.actual,
      diff: table.diff,
      pct: table.pct,
      source: table.source,
      coverage: table.coverage,
      hoursWithData: table.hoursWithData,
      note: table.note,
      total: table.total,
      sourceEvn: table.sourceEvn,
      sourceNone: table.sourceNone,
      weekdayOf: (row) => evnWeekdayLabel(row, table.weekdays),
      noteOf: (row) => evnNoteText(row, table),
    })

    downloadCsv(csv, `utility-evn-compare_${scope}_${month}_${unit}.csv`)
  }

  // .xlsx: Tổng hợp + 3 phạm vi theo ngày (đơn vị đang chọn) + Cảnh báo đồng hồ
  function handleExportExcel() {
    if (!data) return
    downloadBlob(buildEvnCompareWorkbook(data, month, unit, labels), `utility-evn-compare_${month}_${unit}.xlsx`)
  }

  return (
    <PageShell>
      <PageHeader
        title={labels.title}
        subtitle={section === 'import' ? t.utilityEvnImport.subtitle : labels.subtitle}
        status={section === 'compare' && <UpdatedStatus updatedAt={lastUpdated} error={Boolean(error)} />}
        actions={section === 'compare' && (
          <HeaderActionBar>
            <HeaderAction
              kind="exportCsv"
              label={labels.exportCsv}
              disabled={view === 'overview' ? overviewRows.length === 0 : rows.length === 0}
              onClick={handleExport}
            />

            <HeaderAction
              kind="exportExcel"
              label={labels.exportExcel}
              disabled={!data}
              onClick={handleExportExcel}
            />

            <HeaderActionDivider />

            <HeaderAction kind="refresh" loading={loading} onClick={refresh} />
          </HeaderActionBar>
        )}
        bottom={
          <Stack
            direction="row"
            sx={{ alignItems: 'center', flexWrap: 'wrap', columnGap: 1.5, rowGap: 0.75, py: 0.25 }}
          >
            <Tabs
              value={section}
              onChange={(_, next: EvnSectionTab) => changeSection(next)}
              aria-label={labels.sectionAria}
              sx={sectionTabsSx}
            >
              <Tab
                value="compare"
                iconPosition="start"
                icon={<CompareArrowsOutlinedIcon sx={{ fontSize: 18 }} />}
                label={labels.sectionCompare}
              />
              <Tab
                value="import"
                iconPosition="start"
                icon={<UploadFileOutlinedIcon sx={{ fontSize: 18 }} />}
                label={labels.sectionImport}
              />
            </Tabs>

            {section === 'compare' && (
              <>
                <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />

                <DatePicker
                  label={labels.month}
                  views={['year', 'month']}
                  openTo="month"
                  format="MM/YYYY"
                  value={dayjs(`${month}-01`)}
                  maxDate={dayjs().add(1, 'month')}
                  onChange={(value) => {
                    if (value && value.isValid()) setMonth(value.format('YYYY-MM'))
                  }}
                  slotProps={{ textField: { size: 'small', sx: { width: 140 } } }}
                />

                {/* Kỳ hóa đơn: 21 tháng trước → 20 tháng chọn */}
                <Typography sx={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                  {labels.billPeriod(formatDayMonth(period.from), formatDayMonth(period.to))}
                </Typography>

                {/* Tổng quan hiện cả 3 phạm vi → ẩn tab */}
                {view !== 'overview' && (
                  <Tabs
                    value={scope}
                    onChange={(_, next: UtilityScopeCode) => changeScope(next)}
                    variant="scrollable"
                    scrollButtons={false}
                    aria-label={labels.scopeAria}
                    sx={(theme) => ({
                      minHeight: 32,
                      '& .MuiTabs-indicator': { display: 'none' },
                      '& .MuiTabs-list': { gap: 0.75, alignItems: 'center', height: 32 },
                      '& .MuiTab-root': {
                        minHeight: 28,
                        minWidth: 0,
                        px: 1.5,
                        py: 0.25,
                        borderRadius: 999,
                        border: 1,
                        borderColor: 'divider',
                        textTransform: 'none',
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: 'text.secondary',
                        transition: 'background-color 120ms, border-color 120ms',
                        '&:hover': { bgcolor: 'action.hover' },
                      },
                      '& .MuiTab-root.Mui-selected': {
                        color: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        borderColor: alpha(theme.palette.primary.main, 0.45),
                      },
                    })}
                  >
                    {UTILITY_SCOPE_CODES.map((code) => (
                      <Tab key={code} value={code} label={EVN_SCOPE_LABEL[code]} />
                    ))}
                  </Tabs>
                )}

                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={unit}
                  onChange={(_, next: EvnUnit | null) => changeUnit(next)}
                  aria-label={labels.unitAria}
                  sx={{ '& .MuiToggleButton-root': { height: 30, px: 1.25, textTransform: 'none', fontSize: 12.5, fontWeight: 700 } }}
                >
                  {EVN_UNITS.map((u) => (
                    <ToggleButton key={u} value={u}>{u}</ToggleButton>
                  ))}
                </ToggleButtonGroup>

                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={view}
                  onChange={(_, next: EvnViewMode | null) => changeView(next)}
                  aria-label={labels.viewAria}
                  sx={{
                    '& .MuiToggleButton-root': { height: 30, px: 1.25, gap: 0.5, textTransform: 'none', fontSize: 12.5, fontWeight: 700 },
                  }}
                >
                  <ToggleButton value="overview">
                    <SpaceDashboardOutlinedIcon sx={{ fontSize: 16 }} />
                    {labels.viewOverview}
                  </ToggleButton>
                  <ToggleButton value="table">
                    <TableRowsOutlinedIcon sx={{ fontSize: 16 }} />
                    {labels.viewTable}
                  </ToggleButton>
                  <ToggleButton value="chart">
                    <InsertChartOutlinedIcon sx={{ fontSize: 16 }} />
                    {labels.viewChart}
                  </ToggleButton>
                </ToggleButtonGroup>

                {dataUntil && (
                  <Typography
                    sx={{
                      ml: { md: 'auto' },
                      fontSize: uiTokens.header.metaFontSize,
                      color: 'text.secondary',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {labels.dataUntil(dataUntil)}
                  </Typography>
                )}
              </>
            )}
          </Stack>
        }
        mode={mode}
        onToggleMode={onToggleMode}
      />

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: uiTokens.page.gap,
        }}
      >
        {importMounted && (
          <Box sx={{ display: section === 'import' ? 'block' : 'none' }}>
            <EvnImportPanel onImported={refresh} onCalibrated={refresh} />
          </Box>
        )}

        {section === 'compare' && (blockingError ? (
          <Box
            sx={(theme) => ({
              display: 'grid',
              placeItems: 'center',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: uiTokens.card.borderRadius,
              bgcolor: theme.palette.background.paper,
            })}
          >
            <FactoryNoRowsOverlay tone="error" detail={error} onRetry={refresh} />
          </Box>
        ) : (
          <>
            {/* còn dữ liệu cũ mà tải lại lỗi → báo ở đây, vẫn giữ số đang xem */}
            {error && (
              <Alert severity="error" sx={{ flexShrink: 0 }}>
                {error}
              </Alert>
            )}

            {view !== 'overview' && (
              <EvnCompareKpi
                summary={data ? summary : null}
                unit={unit}
                cross={{ summary: data ? crossSummary : null, unit: crossUnit }}
                loading={loading}
              />
            )}

            {view === 'overview' ? (
              <EvnOverviewBoard
                overview={overview}
                rows={overviewRows}
                unit={unit}
                crossUnit={crossUnit}
                loading={loading}
                onOpenScope={openScope}
              />
            ) : view === 'chart' ? (
              <EvnChartBoard
                rows={rows}
                summary={summary}
                unit={unit}
                loading={loading}
                scopeTotals={scopeTotals}
                issues={issues}
                minCoveragePct={data?.measured.minCoveragePct ?? null}
                estimatedMissingMwh={measuredScope?.estimatedMissingMwh ?? null}
              />
            ) : (
              <>
                <EvnCompareChart rows={rows} unit={unit} loading={loading} />

                <EvnCompareTable rows={rows} summary={summary} unit={unit} loading={loading} />

                <EvnMeterIssues
                  issues={issues}
                  estimatedMissingMwh={measuredScope?.estimatedMissingMwh ?? null}
                  loading={loading && !data}
                />
              </>
            )}

            <EvnCompareNotes
              minCoveragePct={data?.measured.minCoveragePct ?? null}
              excludedMeters={data?.measured.excludedMeters ?? []}
            />
          </>
        ))}
      </Box>
    </PageShell>
  )
}

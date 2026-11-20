import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  CostChart,
  CostChartForecast,
  CostDetailKpi,
  CostForecastStatus,
  CostDetailResponse,
  CostDetailTarget,
} from '../../types/costMonitoring'
import { useHoverIntent } from '../../hooks/useHoverIntent'
import { CostChartCard } from './CostChartCard'
import { CostDetailDailyChart } from './CostDetailDailyChart'
import { CostDetailTransactionTable } from './CostDetailTransactionTable'
import {
  COST_COLUMNS,
  COST_ROWS,
  STATUS_BADGE,
  STATUS_BADGE_DARK_FG,
  TABULAR_NUMS,
  type CostBadgeLevel,
} from './costChartConfig'
import { buildRows, getCostStatus } from './costChartUtils'
import { findAbnormalDays, formatNum, formatPct, formatSignedPct } from './costDetailUtils'
import { useI18n } from '../../i18n/useI18n'

interface CostDetailFocusViewProps {
  // "PRESS · T&SL"
  frameLabel: string
  // "2026.10"
  month: string | null
  // "2026-10" – tháng của chart tổng (trục X chart cha)
  chartMonth: string | null
  target: CostDetailTarget
  // 9 khung của /chart – dùng cho chart cha + bộ chọn khung
  charts: CostChart[]
  chartsLoading: boolean
  estVisible: boolean
  data: CostDetailResponse | null
  // forecast của khung trong /chart (status, dự báo theo PL / theo tốc độ chi)
  forecast: CostChartForecast | null
  loading: boolean
  error: string | null
  onSelectTarget: (target: CostDetailTarget) => void
  // rê chuột lên ô chọn khung → tải trước detail khung đó
  onPrefetchTarget?: (target: CostDetailTarget) => void
  onClose: () => void
}

// chưa có actual (vd tháng chưa nạp OT) → chỉ hiện KPI + empty state
function hasActual(kpi: CostDetailKpi) {
  return kpi.actMtd != null
}

// trạng thái BE → màu badge
const STATUS_LEVEL: Record<CostForecastStatus, CostBadgeLevel> = {
  OVER: 'over',
  WILL_EXCEED: 'over',
  WITHIN: 'ok',
  NO_DATA: 'noActual',
}

function useLevelColor(level: CostBadgeLevel) {
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'
  const fg = dark ? STATUS_BADGE_DARK_FG[level] : STATUS_BADGE[level].fg
  const bg = dark ? alpha(fg, 0.14) : STATUS_BADGE[level].bg
  return { fg, bg }
}

function StatusBadge({ status }: { status: CostForecastStatus | null }) {
  const { t } = useI18n()
  const { fg, bg } = useLevelColor(status ? STATUS_LEVEL[status] : 'noActual')

  return (
    <Box
      component="span"
      sx={{
        px: 0.875,
        py: 0.125,
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 800,
        lineHeight: 1.6,
        color: fg,
        bgcolor: bg,
        border: `1px solid ${alpha(fg, 0.35)}`,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {status ? t.costDetail.forecast.status[status] : t.costDetail.forecast.none}
    </Box>
  )
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <Box
      component="kbd"
      sx={{
        px: 0.5,
        minWidth: 16,
        height: 16,
        display: 'inline-grid',
        placeItems: 'center',
        borderRadius: 0.5,
        border: 1,
        borderColor: 'divider',
        borderBottomWidth: 2,
        fontFamily: 'inherit',
        fontSize: 10,
        lineHeight: 1,
        color: 'text.secondary',
      }}
    >
      {children}
    </Box>
  )
}

const LEVEL_ICON: Record<CostBadgeLevel, typeof WarningAmberRoundedIcon> = {
  over: WarningAmberRoundedIcon,
  watch: VisibilityRoundedIcon,
  ok: CheckCircleRoundedIcon,
  noActual: HourglassEmptyRoundedIcon,
}

// 1 ô khung: icon + chữ trạng thái (đọc ngay) · % phụ · thanh tiến độ so với Fluct
function FrameCell({ label, chart, chartMonth, active, onSelect, onHover, onLeave }: {
  label: string
  chart: CostChart | undefined
  chartMonth: string | null
  active: boolean
  onSelect: () => void
  onHover: () => void
  onLeave: () => void
}) {
  const { t } = useI18n()
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'

  const status = chart ? getCostStatus(chart, buildRows(chartMonth, chart)) : null
  const level: CostBadgeLevel = status?.level ?? 'noActual'
  const fg = dark ? STATUS_BADGE_DARK_FG[level] : STATUS_BADGE[level].fg
  const Icon = LEVEL_ICON[level]
  const ratio = status?.ratio ?? null
  const word = level === 'noActual' ? t.costDetail.focus.noData : t.cost.status[level]
  const pctText = ratio != null ? `${Math.round(ratio)}%` : ''
  const primary = theme.palette.primary.main

  return (
    <Tooltip
      title={`${label} — ${level === 'noActual' ? t.cost.noActual : `${word} ${pctText}`}`}
      arrow
      disableInteractive
    >
      <Box
        component="button"
        type="button"
        disabled={!chart}
        aria-pressed={active}
        aria-label={`${label}: ${word} ${pctText}`}
        onClick={onSelect}
        onPointerEnter={active ? undefined : onHover}
        onPointerLeave={onLeave}
        sx={{
          all: 'unset',
          boxSizing: 'border-box',
          minWidth: 0,
          px: 0.875,
          pt: 0.625,
          pb: 0.75,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          borderRadius: 1.5,
          fontFamily: 'inherit',
          cursor: chart ? 'pointer' : 'default',
          opacity: chart ? 1 : 0.45,
          bgcolor: active ? alpha(primary, dark ? 0.16 : 0.07) : 'background.paper',
          border: `1px solid ${active ? primary : theme.palette.divider}`,
          // ô đang xem: viền primary + quầng sáng; ô khác: dải màu trạng thái bên trái
          boxShadow: active
            ? `0 0 0 3px ${alpha(primary, 0.18)}`
            : `inset 3px 0 0 ${fg}`,
          transition: 'background-color 120ms, box-shadow 120ms, transform 120ms',
          '&:hover:not(:disabled)': {
            bgcolor: active ? alpha(primary, dark ? 0.2 : 0.1) : alpha(fg, dark ? 0.12 : 0.06),
            transform: 'translateY(-1px)',
          },
          '&:focus-visible': { outline: `2px solid ${primary}`, outlineOffset: 2 },
        }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, minWidth: 0 }}>
          <Icon sx={{ fontSize: 15, color: fg, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: fg, minWidth: 0 }} noWrap>
            {word}
          </Typography>
          <Typography
            sx={{ ...TABULAR_NUMS, ml: 'auto', fontSize: 11.5, fontWeight: 600, color: 'text.secondary', flexShrink: 0 }}
          >
            {pctText}
          </Typography>
        </Stack>

        {/* thanh: đầy = chạm Fluct; vượt → đầy + đỏ */}
        <Box sx={{ height: 4, borderRadius: 999, bgcolor: alpha(theme.palette.text.primary, 0.08), overflow: 'hidden' }}>
          <Box
            sx={{
              height: '100%',
              width: `${Math.min(ratio ?? 0, 100)}%`,
              bgcolor: fg,
              borderRadius: 999,
              transition: 'width 200ms',
            }}
          />
        </Box>
      </Box>
    </Tooltip>
  )
}

// Ma trận 3×3 thu gọn: trạng thái bằng chữ + icon → đổi khung 1 chạm, không bị 9 chart làm rối mắt
function FrameSwitcher({ chartMonth, charts, target, onSelect, onPrefetch }: {
  chartMonth: string | null
  charts: CostChart[]
  target: CostDetailTarget
  onSelect: (target: CostDetailTarget) => void
  onPrefetch?: (target: CostDetailTarget) => void
}) {
  const { t } = useI18n()
  const focus = t.costDetail.focus
  const hover = useHoverIntent(onPrefetch)

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, mb: 0.75 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>
          {focus.frames}
        </Typography>
        <Stack
          direction="row"
          sx={{ ml: 'auto', alignItems: 'center', gap: 0.25, display: { xs: 'none', md: 'flex' } }}
        >
          <Kbd>←</Kbd><Kbd>→</Kbd><Kbd>↑</Kbd><Kbd>↓</Kbd>
          <Typography sx={{ fontSize: 10.5, color: 'text.disabled', ml: 0.25 }}>{focus.keysHint}</Typography>
        </Stack>
      </Stack>

      <Box
        role="group"
        aria-label={focus.frames}
        sx={{
          display: 'grid',
          gridTemplateColumns: '48px repeat(3, minmax(0, 1fr))',
          gap: 0.75,
          alignItems: 'stretch',
        }}
      >
        <Box />
        {COST_COLUMNS.map((column) => (
          <Typography
            key={column}
            sx={{
              fontSize: 11.5,
              fontWeight: 800,
              textAlign: 'center',
              color: target.chart === column ? 'primary.main' : 'text.secondary',
            }}
          >
            {column}
          </Typography>
        ))}

        {COST_ROWS.map((row) => [
          <Typography
            key={`${row.div}-label`}
            sx={{
              alignSelf: 'center',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.3,
              color: target.div === row.div ? 'primary.main' : 'text.secondary',
            }}
          >
            {row.label}
          </Typography>,
          ...COST_COLUMNS.map((column) => (
            <FrameCell
              key={`${row.div}-${column}`}
              label={`${row.label} · ${column}`}
              chart={charts.find((c) => c.div === row.div && c.chart === column)}
              chartMonth={chartMonth}
              active={target.div === row.div && target.chart === column}
              onSelect={() => onSelect({ div: row.div, chart: column })}
              onHover={() => hover.start({ div: row.div, chart: column })}
              onLeave={hover.cancel}
            />
          )),
        ])}
      </Box>

      <Typography sx={{ mt: 0.75, fontSize: 10.5, color: 'text.disabled', textAlign: 'right' }}>
        {focus.pctMeaning}
      </Typography>
    </Box>
  )
}

// Khối "Đã chi": 1 con số chính + thanh tiến độ so với Fluct + dòng chỉ tiêu + dự báo
function SpendSummary({ kpi, forecast, monthClosed }: {
  kpi: CostDetailKpi
  forecast: CostChartForecast | null
  monthClosed: boolean
}) {
  const { t } = useI18n()
  const theme = useTheme()
  const focus = t.costDetail.focus
  const fLabels = t.costDetail.forecast

  const pct = kpi.pctOfFluct
  const barColor = pct == null
    ? theme.palette.text.disabled
    : pct > 100 ? theme.palette.error.main : pct > 90 ? theme.palette.warning.main : theme.palette.success.main

  const mainLabel = forecast?.estimateBase === 'Fluct'
    ? focus.forecastFluct
    : forecast?.estimateBase === 'PL' ? focus.forecastPl : focus.forecastMain

  const forecasts: { label: string; note?: string; eom: number | null; over: number | null; pct: number | null }[] = [
    {
      label: mainLabel,
      eom: forecast?.estimateEom ?? kpi.estimateEom,
      over: forecast?.estimateOver ?? null,
      pct: forecast?.estimatePctOfFluct ?? null,
    },
    ...(hasActual(kpi)
      ? [{
        label: focus.forecastPace,
        note: focus.reference,
        eom: forecast?.projectedEom ?? kpi.projectedEom,
        over: forecast?.projectedOver ?? kpi.projectedOver,
        pct: forecast?.projectedPctOfFluct ?? null,
      }]
      : []),
  ]

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, p: 1, flexShrink: 0 }}>
      {/* Đã chi / Fluct + % */}
      <Stack direction="row" sx={{ alignItems: 'baseline', gap: 0.75 }}>
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{focus.spent}</Typography>
        <Typography sx={{ ...TABULAR_NUMS, ml: 'auto', fontSize: 12, fontWeight: 800, color: barColor }}>
          {formatPct(pct, 1)}
          <Box component="span" sx={{ fontWeight: 500, color: 'text.secondary' }}>{` ${focus.ofFluct}`}</Box>
        </Typography>
      </Stack>
      <Stack direction="row" sx={{ alignItems: 'baseline', gap: 0.75 }}>
        <Typography sx={{ ...TABULAR_NUMS, fontSize: 22, fontWeight: 800, lineHeight: 1.25 }}>
          {formatNum(kpi.actMtd)}
        </Typography>
        <Typography sx={{ ...TABULAR_NUMS, fontSize: 12.5, color: 'text.secondary' }}>
          {`/ ${formatNum(kpi.fluct)} K$`}
        </Typography>
      </Stack>

      {/* thanh tiến độ: đầy = Fluct; vượt → đỏ toàn thanh */}
      <Box
        sx={{
          mt: 0.5,
          height: 6,
          borderRadius: 999,
          bgcolor: alpha(theme.palette.text.primary, 0.08),
          overflow: 'hidden',
        }}
      >
        <Box sx={{ height: '100%', width: `${Math.min(pct ?? 0, 100)}%`, bgcolor: barColor, borderRadius: 999 }} />
      </Box>

      {/* chỉ tiêu */}
      <Stack
        direction="row"
        sx={{ ...TABULAR_NUMS, mt: 0.625, columnGap: 1.5, rowGap: 0.25, flexWrap: 'wrap', fontSize: 11.5, color: 'text.secondary' }}
      >
        <span>
          {`${t.costDetail.kpi.fc} `}
          <Box component="b" sx={{ color: 'text.primary' }}>{formatNum(kpi.fc)}</Box>
        </span>
        <span>
          {`${t.costDetail.kpi.fluct} `}
          <Box component="b" sx={{ color: 'text.primary' }}>{formatNum(kpi.fluct)}</Box>
          {kpi.ratioPct != null && ` (${t.costDetail.kpi.ratio(formatSignedPct(kpi.ratioPct))})`}
        </span>
      </Stack>

      {/* dự báo: nhãn trái · số phải, thẳng cột để so nhanh */}
      <Box sx={{ mt: 0.75, pt: 0.75, borderTop: 1, borderColor: 'divider' }}>
        {monthClosed ? (
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{fLabels.monthClosed}</Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 1.5, rowGap: 0.25, alignItems: 'baseline' }}>
            {forecasts.map((f) => [
              <Typography key={`${f.label}-l`} sx={{ fontSize: 11.5, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                {f.label}
                {f.note && <Box component="span" sx={{ fontStyle: 'italic' }}>{` (${f.note})`}</Box>}
              </Typography>,
              <Stack
                key={`${f.label}-v`}
                direction="row"
                sx={{ ...TABULAR_NUMS, justifyContent: 'flex-end', alignItems: 'baseline', columnGap: 0.75, flexWrap: 'wrap' }}
              >
                <Typography sx={{ ...TABULAR_NUMS, fontSize: 13, fontWeight: 800 }}>
                  {f.eom == null ? fLabels.none : `${formatNum(f.eom)} K$`}
                </Typography>
                {f.over != null && (
                  <Typography
                    sx={{ ...TABULAR_NUMS, fontSize: 11.5, fontWeight: 700, color: f.over > 0 ? 'error.main' : 'success.main' }}
                  >
                    {f.over > 0 ? fLabels.overBy(formatNum(f.over)) : fLabels.underBy(formatNum(-f.over))}
                  </Typography>
                )}
                {f.pct != null && (
                  <Typography sx={{ ...TABULAR_NUMS, fontSize: 11, color: 'text.secondary' }}>
                    {formatPct(f.pct, 1)}
                  </Typography>
                )}
              </Stack>,
            ])}
          </Box>
        )}
      </Box>
    </Box>
  )
}

function EmptyBox({ text, minHeight }: { text: string; minHeight: number }) {
  return (
    <Box
      sx={{
        minHeight,
        display: 'grid',
        placeItems: 'center',
        border: 1,
        borderStyle: 'dashed',
        borderColor: 'divider',
        borderRadius: 1.5,
      }}
    >
      <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>{text}</Typography>
    </Box>
  )
}


const paneSx = {
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  border: 1,
  borderColor: 'divider',
  borderRadius: 1.5,
  bgcolor: 'background.paper',
} as const

// đang gõ trong ô nhập (chat mascot, select…) → không bắt phím tắt
function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return Boolean(el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)))
}

// Chế độ Focus thay cho lưới 9 chart: trái = khung "cha" (chọn khung + đã chi + chart tổng),
// phải = "con" (chi tiết theo ngày + giao dịch). Ngày chọn bên phải → vạch đánh dấu bên chart cha.
export function CostDetailFocusView({
  frameLabel,
  month,
  chartMonth,
  target,
  charts,
  chartsLoading,
  estVisible,
  data,
  forecast,
  loading,
  error,
  onSelectTarget,
  onPrefetchTarget,
  onClose,
}: CostDetailFocusViewProps) {
  const { t } = useI18n()
  const theme = useTheme()
  const focus = t.costDetail.focus

  // click cột chart con → lọc giao dịch theo ngày + đánh dấu trên chart cha; đổi dữ liệu → bỏ lọc
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [prevData, setPrevData] = useState(data)
  if (prevData !== data) {
    setPrevData(data)
    setSelectedDate(null)
  }

  const abnormalDays = useMemo(() => findAbnormalDays(data?.daily ?? []), [data])

  // Esc → về lưới 9 chart; mũi tên → đổi khung (bỏ qua khi đang gõ)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isTyping(event.target)) return

      if (event.key === 'Escape') {
        onClose()
        return
      }

      const moves: Record<string, [number, number]> = {
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
      }
      const move = moves[event.key]
      if (!move) return

      const rowIndex = COST_ROWS.findIndex((r) => r.div === target.div)
      const colIndex = COST_COLUMNS.indexOf(target.chart)
      const nextRow = COST_ROWS[(rowIndex + move[0] + COST_ROWS.length) % COST_ROWS.length]
      const nextCol = COST_COLUMNS[(colIndex + move[1] + COST_COLUMNS.length) % COST_COLUMNS.length]

      event.preventDefault()
      onSelectTarget({ div: nextRow.div, chart: nextCol })
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [target, onClose, onSelectTarget])

  const parentChart = charts.find((c) => c.div === target.div && c.chart === target.chart)
  const isOt = target.chart === 'OT'

  // ===== Bên phải: chi tiết (con) – chart cố định, bảng giao dịch giãn hết phần còn lại =====
  let childBody: ReactNode
  if (!data && loading) {
    childBody = (
      <Stack sx={{ gap: 1, flex: 1 }}>
        <Skeleton variant="rounded" height={210} />
        <Skeleton variant="rounded" sx={{ flex: 1, minHeight: 200 }} />
      </Stack>
    )
  } else if (!data) {
    childBody = error ? <Alert severity="error">{error}</Alert> : null
  } else if (!hasActual(data.kpi)) {
    childBody = <EmptyBox text={t.costDetail.noActual} minHeight={160} />
  } else {
    childBody = (
      <Stack sx={{ gap: 1, flex: 1, minHeight: 0, opacity: loading ? 0.6 : 1, transition: 'opacity 120ms' }}>
        {error && <Alert severity="error" sx={{ py: 0, flexShrink: 0 }}>{error}</Alert>}

        <Box sx={{ flexShrink: 0 }}>
          <CostDetailDailyChart
            rows={data.daily}
            fcTgt={data.kpi.fc}
            fluctTgt={data.kpi.fluct}
            abnormalDays={abnormalDays}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            height={170}
            title={focus.child}
            // OT không có giao dịch → không gợi ý "bấm để lọc"
            hint={isOt ? undefined : t.costDetail.chart.hint}
          />
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {isOt ? (
            <EmptyBox text={t.costDetail.tx.otNone} minHeight={56} />
          ) : (
            <CostDetailTransactionTable
              // đổi khung → bỏ từ khóa / lọc cột của khung cũ
              key={`${target.div}|${target.chart}`}
              target={target}
              initial={data.transactions}
              filterDate={selectedDate}
              onClearFilter={() => setSelectedDate(null)}
              exportName={`cost_${data.div}_${data.chart.replace('&', '')}_${data.month.replace('.', '-')}`}
              title={t.costDetail.tx.title}
              fill
            />
          )}
        </Box>
      </Stack>
    )
  }

  const dayChip = selectedDate && (
    <Chip
      size="small"
      label={focus.selectedDay(dayjs(selectedDate).format('DD/MM'))}
      onDelete={() => setSelectedDate(null)}
      sx={{
        height: 22,
        fontSize: 11.5,
        fontWeight: 700,
        bgcolor: alpha(theme.palette.primary.main, 0.12),
        borderColor: alpha(theme.palette.primary.main, 0.4),
        color: 'primary.main',
        '& .MuiChip-deleteIcon': { color: 'primary.main', fontSize: 16 },
      }}
    />
  )

  return (
    <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Thanh focus: quay lại · tên khung + trạng thái · đóng */}
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          gap: 1,
          px: 1,
          py: 0.5,
          flexShrink: 0,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1.5,
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.08 : 0.04),
        }}
      >
        <Tooltip title={focus.backHint} arrow>
          <Button
            size="small"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={onClose}
            sx={{ textTransform: 'none', fontWeight: 700, flexShrink: 0 }}
          >
            {focus.back}
          </Button>
        </Tooltip>

        <Box sx={{ width: '1px', alignSelf: 'stretch', bgcolor: 'divider', my: 0.5 }} />

        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 800, minWidth: 0 }} noWrap>
            {t.costDetail.title(frameLabel, month ?? '–')}
          </Typography>
          {data && <StatusBadge status={forecast?.status ?? null} />}
        </Box>

        <Tooltip title={t.costDetail.close} arrow>
          <IconButton size="small" aria-label={t.costDetail.close} onClick={onClose}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gap: 1,
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(360px, 4fr) minmax(0, 8fr)' },
          gridTemplateRows: { xs: 'auto auto', md: 'minmax(0, 1fr)' },
          overflowY: { xs: 'auto', md: 'visible' },
        }}
      >
        {/* ===== Trái: khung cha ===== */}
        <Box sx={{ ...paneSx, p: 1.25, gap: 1.25, overflowY: 'auto' }}>
          <FrameSwitcher chartMonth={chartMonth} charts={charts} target={target} onSelect={onSelectTarget} onPrefetch={onPrefetchTarget} />

          {data ? (
            <SpendSummary kpi={data.kpi} forecast={forecast} monthClosed={data.monthClosed} />
          ) : (
            <Skeleton variant="rounded" height={140} sx={{ flexShrink: 0 }} />
          )}

          {/* chart cha giãn theo phần còn lại của cột (absolute để height 100% của card có giá trị) */}
          <Box sx={{ flex: 1, minHeight: 220, display: 'flex', flexDirection: 'column' }}>
            {dayChip && <Box sx={{ mb: 0.5, flexShrink: 0 }}>{dayChip}</Box>}
            <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <Box sx={{ position: { md: 'absolute' }, inset: 0 }}>
                <CostChartCard
                  month={chartMonth}
                  chart={parentChart}
                  title={frameLabel}
                  loading={chartsLoading}
                  estVisible={estVisible}
                  highlightDate={selectedDate}
                  // số liệu đã có ở khối "Đã chi" → bỏ dải chip trùng lặp
                  hideStats
                />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ===== Phải: chi tiết con ===== */}
        <Box sx={{ ...paneSx, overflow: 'hidden' }}>
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflowY: { xs: 'visible', md: 'hidden' },
              p: 1,
            }}
          >
            {childBody}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

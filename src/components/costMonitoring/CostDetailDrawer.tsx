import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import {
  Alert,
  Box,
  Button,
  Drawer,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useMemo, useState, type ReactNode } from 'react'
import type {
  CostChartForecast,
  CostDetailKpi,
  CostForecastStatus,
  CostDetailResponse,
  CostDetailTarget,
  CostSimuWeek,
} from '../../types/costMonitoring'
import { useMascotElevated, useMascotName } from '../mascot'
import { CostDetailDailyChart } from './CostDetailDailyChart'
import { CostDetailDailyTable } from './CostDetailDailyTable'
import { CostDetailTransactionTable } from './CostDetailTransactionTable'
import {
  STATUS_BADGE,
  STATUS_BADGE_DARK_FG,
  TABULAR_NUMS,
  type CostBadgeLevel,
} from './costChartConfig'
import { findAbnormalDays, formatNum, formatPct, formatSignedPct } from './costDetailUtils'
import { useI18n } from '../../i18n/useI18n'

interface CostDetailDrawerProps {
  open: boolean
  // "PRESS · T&SL"
  frameLabel: string
  // "2026.10"
  month: string | null
  target: CostDetailTarget | null
  simuWeek: CostSimuWeek
  data: CostDetailResponse | null
  // forecast của khung trong /chart (status, dự báo theo PL / theo tốc độ chi)
  forecast: CostChartForecast | null
  loading: boolean
  error: string | null
  onClose: () => void
  onAskMascot: () => void
}

function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'baseline', gap: 1, mt: 1, mb: 0.5 }}>
      <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{children}</Typography>
      {hint && (
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{hint}</Typography>
      )}
    </Stack>
  )
}

// chưa có actual (vd OT) → chỉ hiện KPI + empty state
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

// 1 dòng dự báo: nhãn · số cuối tháng · chênh so Fluct (BE tính sẵn)
function ForecastRow({ label, note, eom, over, pct }: {
  label: string
  note?: string
  eom: number | null
  over: number | null
  pct: number | null
}) {
  const { t } = useI18n()
  const labels = t.costDetail.forecast

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
        {label}
        {note && <Box component="span" sx={{ fontStyle: 'italic' }}>{` (${note})`}</Box>}
      </Typography>
      <Stack direction="row" sx={{ ...TABULAR_NUMS, alignItems: 'baseline', columnGap: 1, flexWrap: 'wrap' }}>
        <Typography sx={{ ...TABULAR_NUMS, fontSize: 16, fontWeight: 800 }}>
          {eom == null ? labels.none : `${formatNum(eom)} K$`}
        </Typography>
        {over != null && (
          <Typography
            sx={{ ...TABULAR_NUMS, fontSize: 12, fontWeight: 700, color: over > 0 ? 'error.main' : 'success.main' }}
          >
            {over > 0 ? labels.overBy(formatNum(over)) : labels.underBy(formatNum(-over))}
          </Typography>
        )}
        {pct != null && (
          <Typography sx={{ ...TABULAR_NUMS, fontSize: 11.5, color: 'text.secondary' }}>
            {labels.pctOfFluct(formatPct(pct, 1))}
          </Typography>
        )}
      </Stack>
    </Box>
  )
}

// Dự báo: trạng thái chính (BE) + dự báo chính (theo PL) + dự báo phụ (theo tốc độ chi)
function ForecastPanel({ kpi, forecast, monthClosed }: {
  kpi: CostDetailKpi
  forecast: CostChartForecast | null
  monthClosed: boolean
}) {
  const { t } = useI18n()
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'
  const labels = t.costDetail.forecast

  const status = forecast?.status ?? null
  const level: CostBadgeLevel = status ? STATUS_LEVEL[status] : 'noActual'
  const fg = dark ? STATUS_BADGE_DARK_FG[level] : STATUS_BADGE[level].fg
  const bg = dark ? alpha(fg, 0.14) : STATUS_BADGE[level].bg

  const mainLabel = forecast?.estimateBase === 'Fluct'
    ? labels.mainFluct
    : forecast?.estimateBase === 'PL' ? labels.mainPl : labels.main

  return (
    <Box
      sx={{
        px: 1.25,
        py: 0.75,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1.5,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        columnGap: 3,
        rowGap: 1,
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{labels.title}</Typography>
        <Box
          sx={{
            mt: 0.25,
            px: 1,
            py: 0.25,
            borderRadius: 999,
            fontSize: 12.5,
            fontWeight: 800,
            color: fg,
            bgcolor: bg,
            border: `1px solid ${alpha(fg, 0.35)}`,
            whiteSpace: 'nowrap',
          }}
        >
          {status ? labels.status[status] : labels.none}
        </Box>
      </Box>

      {monthClosed ? (
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{labels.monthClosed}</Typography>
      ) : (
        <>
          <ForecastRow
            label={mainLabel}
            eom={forecast?.estimateEom ?? kpi.estimateEom}
            over={forecast?.estimateOver ?? null}
            pct={forecast?.estimatePctOfFluct ?? null}
          />
          {hasActual(kpi) && (
            <ForecastRow
              label={labels.pace}
              note={labels.paceNote}
              eom={forecast?.projectedEom ?? kpi.projectedEom}
              over={forecast?.projectedOver ?? kpi.projectedOver}
              pct={forecast?.projectedPctOfFluct ?? null}
            />
          )}
        </>
      )}
    </Box>
  )
}

function KpiHeader({ kpi }: { kpi: CostDetailKpi }) {
  const { t } = useI18n()
  const labels = t.costDetail.kpi

  const items: { label: string; value: string; sub?: string; danger?: boolean }[] = [
    { label: labels.fc, value: formatNum(kpi.fc) },
    {
      label: labels.fluct,
      value: formatNum(kpi.fluct),
      // Fluct = FC × (1 + Ratio)
      sub: kpi.ratioPct != null ? labels.ratio(formatSignedPct(kpi.ratioPct)) : undefined,
    },
    { label: labels.actMtd, value: formatNum(kpi.actMtd) },
    { label: labels.estimateEom, value: formatNum(kpi.estimateEom) },
    {
      label: labels.ratioToFluct,
      value: formatPct(kpi.pctOfFluct, 1),
      danger: kpi.pctOfFluct != null && kpi.pctOfFluct > 100,
    },
  ]

  return (
    <Stack direction="row" sx={{ alignItems: 'stretch', gap: 1.5, flexWrap: 'wrap' }}>
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(5, minmax(0, 1fr))' },
          gap: 1,
        }}
      >
        {items.map((item) => (
          <Box
            key={item.label}
            sx={{ px: 1, py: 0.75, border: 1, borderColor: 'divider', borderRadius: 1.5 }}
          >
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', whiteSpace: 'nowrap' }}>
              {item.label}
            </Typography>
            <Typography
              sx={{
                ...TABULAR_NUMS,
                fontSize: 18,
                fontWeight: 800,
                color: item.danger ? 'error.main' : 'text.primary',
              }}
            >
              {item.value}
            </Typography>
            {item.sub && (
              <Typography sx={{ ...TABULAR_NUMS, fontSize: 11, color: 'text.secondary' }}>
                {item.sub}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Stack>
  )
}

// Drawer chi tiết 1 khung (vd PRESS × T&SL): KPI, chart theo ngày, bảng ngày, bảng giao dịch
export function CostDetailDrawer({
  open,
  frameLabel,
  month,
  target,
  simuWeek,
  data,
  forecast,
  loading,
  error,
  onClose,
  onAskMascot,
}: CostDetailDrawerProps) {
  const { t } = useI18n()
  const mascotName = useMascotName()

  // mascot nổi trên drawer để chat được khi drawer đang mở
  useMascotElevated(open)

  // click dòng bảng ngày / cột chart → lọc giao dịch theo ngày; đổi dữ liệu → bỏ lọc
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [prevData, setPrevData] = useState(data)
  if (prevData !== data) {
    setPrevData(data)
    setSelectedDate(null)
  }

  const abnormalDays = useMemo(
    () => findAbnormalDays(data?.daily ?? []),
    [data],
  )

  let body: ReactNode
  if (!data && loading) {
    body = (
      <Stack sx={{ gap: 1.5 }}>
        <Skeleton variant="rounded" height={64} />
        <Skeleton variant="rounded" height={260} />
        <Skeleton variant="rounded" height={200} />
      </Stack>
    )
  } else if (!data) {
    body = error ? <Alert severity="error">{error}</Alert> : null
  } else {
    const { kpi } = data

    body = (
      <Stack sx={{ gap: 1, opacity: loading ? 0.6 : 1, transition: 'opacity 120ms' }}>
        {error && <Alert severity="error">{error}</Alert>}

        <KpiHeader kpi={kpi} />

        <ForecastPanel kpi={kpi} forecast={forecast} monthClosed={data.monthClosed} />

        {!hasActual(kpi) ? (
          <Box
            sx={{
              mt: 2,
              minHeight: 160,
              display: 'grid',
              placeItems: 'center',
              border: 1,
              borderStyle: 'dashed',
              borderColor: 'divider',
              borderRadius: 1.5,
            }}
          >
            <Typography color="text.secondary" sx={{ fontSize: 13 }}>
              {t.costDetail.noActual}
            </Typography>
          </Box>
        ) : (
          <>
            <SectionTitle>{t.costDetail.chart.title}</SectionTitle>
            <CostDetailDailyChart
              rows={data.daily}
              fcTgt={kpi.fc}
              fluctTgt={kpi.fluct}
              abnormalDays={abnormalDays}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            <SectionTitle hint={t.costDetail.daily.hint}>{t.costDetail.daily.title}</SectionTitle>
            <CostDetailDailyTable
              rows={data.daily}
              abnormalDays={abnormalDays}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            <SectionTitle>{t.costDetail.tx.title}</SectionTitle>
            <CostDetailTransactionTable
              month={month}
              target={target ?? { div: data.div, chart: data.chart }}
              simuWeek={simuWeek}
              initial={data.transactions}
              filterDate={selectedDate}
              onClearFilter={() => setSelectedDate(null)}
              exportName={`cost_${data.div}_${data.chart.replace('&', '')}_${data.month.replace('.', '-')}`}
            />
          </>
        )}
      </Stack>
    )
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      // cho phép focus vào ô chat của mascot (nằm ngoài drawer)
      disableEnforceFocus
      slotProps={{
        paper: { sx: { width: { xs: '100%', md: '60vw' }, display: 'flex', flexDirection: 'column' } },
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1.25,
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Typography sx={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 800 }} noWrap>
          {t.costDetail.title(frameLabel, month ?? '–')}
        </Typography>

        <Button
          size="small"
          variant="contained"
          disableElevation
          startIcon={<ChatBubbleOutlineRoundedIcon />}
          onClick={onAskMascot}
          sx={{ textTransform: 'none', flexShrink: 0 }}
        >
          {t.costDetail.askMascot(mascotName)}
        </Button>

        <IconButton size="small" aria-label={t.costDetail.close} onClick={onClose}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 2, py: 1.5 }}>
        {body}
      </Box>
    </Drawer>
  )
}

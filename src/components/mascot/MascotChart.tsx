import { Box, Typography, useTheme } from '@mui/material'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { ResponsiveContainer } from '../common/StableResponsiveContainer'
import { useI18n } from '../../i18n/useI18n'
import type { AssistantChart, AssistantChartSeries, AssistantSeriesKind } from '../../services/assistantService'

// Cùng bảng màu với chart màn Cost Monitoring (costChartConfig.COST_SERIES)
const KIND_COLORS: Record<AssistantSeriesKind, { light: string; dark: string; dash?: string; width: number }> = {
  actual: { light: '#4472C4', dark: '#6F9BEA', width: 2.25 },
  estimate: { light: '#4472C4', dark: '#6F9BEA', dash: '4 3', width: 1.5 },
  target: { light: '#C00000', dark: '#FF5C5C', width: 2 },
  fc: { light: '#595959', dark: '#A6A6A6', dash: '8 4', width: 1.25 },
  limit: { light: '#70AD47', dark: '#8BC867', width: 2 },
  neutral: { light: '#1976D2', dark: '#64B5F6', width: 2 },
}
const OVER_COLOR = { light: '#DC2626', dark: '#F87171' }
const OK_COLOR = { light: '#16A34A', dark: '#4ADE80' }
const STALE_COLOR = { light: '#9CA3AF', dark: '#6B7280' }

const STATUS_LABELS = {
  vi: { over: 'Vượt', ok: 'Trong mức', stale: 'Dữ liệu cũ' },
  en: { over: 'Above', ok: 'Within', stale: 'Stale data' },
} as const

const TABULAR = { fontVariantNumeric: 'tabular-nums' } as const
const LINE_HEIGHT = 170
const BAR_HEIGHT = 160
const HBAR_ROW = 22

type Row = Record<string, string | number | null>

function key(index: number) {
  return `s${index}`
}

function format(value: number | null | undefined, unit: string) {
  if (value == null) return '–'
  const digits = Number.isInteger(value) ? 0 : unit.includes('/') ? 2 : 1
  return `${value.toFixed(digits)}${unit === '%' ? '%' : ` ${unit}`}`
}

/** Mốc trục giá trị "tròn" (bước 1 / 2 / 2.5 / 5 × 10^k, ~4 khoảng), luôn gồm 0 và đường mốc */
function niceTicks(values: number[], ref?: number) {
  const all = [...values, 0, ...(ref != null ? [ref] : [])]
  const min = Math.min(...all)
  const max = Math.max(...all)
  const span = max - min || 1
  const raw = span / 4
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow
  const start = Math.floor(min / step) * step
  const end = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = start; v <= end + step / 1e6; v += step) ticks.push(Number(v.toFixed(6)))
  return { ticks, domain: [start, end] as [number, number] }
}

/** Trục X ngày: chỉ hiện 1, 5, 10, 15… và ngày cuối */
function dayTicks(categories: string[]) {
  return categories.filter((c, i) => i === 0 || i === categories.length - 1 || Number(c) % 5 === 0)
}

export function MascotChart({ chart }: { chart: AssistantChart }) {
  const { language } = useI18n()
  const statusLabels = language === 'en' ? STATUS_LABELS.en : STATUS_LABELS.vi
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'
  const tone = (c: { light: string; dark: string }) => (dark ? c.dark : c.light)
  const color = (s: AssistantChartSeries) => tone(KIND_COLORS[s.kind])
  const single = chart.series.length === 1

  // bar: điểm có trạng thái → đỏ (vượt) / xanh lá (ổn, 1 chuỗi) / màu chuỗi (nhiều chuỗi)
  const pointColor = (s: AssistantChartSeries, i: number) => {
    const status = s.status?.[i]
    if (status === 'stale') return tone(STALE_COLOR)
    if (status === 'over') return tone(OVER_COLOR)
    if (status === 'ok' && single) return tone(OK_COLOR)
    return color(s)
  }

  const rows: Row[] = chart.categories.map((name, i) => {
    const row: Row = { name }
    chart.series.forEach((s, j) => {
      row[key(j)] = s.data[i] ?? null
    })
    return row
  })

  const axisTick = { fontSize: 10.5, fill: theme.palette.text.secondary, style: TABULAR }
  // trục giá trị của bar / hbar: mốc tròn, gồm 0 và đường mốc (vd 100% Fluct)
  const valueAxis = niceTicks(
    chart.series.flatMap((s) => s.data.filter((v): v is number => v != null)),
    chart.refValue,
  )
  const valueTickFormat = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1))

  // Legend: chuỗi tô theo trạng thái từng điểm -> mục theo trạng thái thực có (màu đúng với cột);
  // nhiều chuỗi -> mục theo chuỗi + "Vượt" nếu có điểm vượt
  type LegendItem = { label: string; color: string; line?: { width: number; dash?: string } }
  const legend: LegendItem[] = []
  if (chart.type === 'line') {
    chart.series.forEach((s) => legend.push({
      label: s.name,
      color: color(s),
      line: { width: KIND_COLORS[s.kind].width, dash: KIND_COLORS[s.kind].dash },
    }))
  } else {
    const statuses = new Set(chart.series.flatMap((s) => s.status ?? []))
    if (single && statuses.size > 0) {
      if (statuses.has('over')) legend.push({ label: statusLabels.over, color: tone(OVER_COLOR) })
      if (statuses.has('ok')) legend.push({ label: statusLabels.ok, color: tone(OK_COLOR) })
    } else {
      chart.series.forEach((s) => legend.push({ label: s.name, color: color(s) }))
      if (statuses.has('over')) legend.push({ label: statusLabels.over, color: tone(OVER_COLOR) })
    }
    if (statuses.has('stale')) legend.push({ label: statusLabels.stale, color: tone(STALE_COLOR) })
  }
  const grid = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'
  const refColor = theme.palette.text.secondary

  const renderTooltip = ({ active, label }: TooltipContentProps) => {
    const index = active ? chart.categories.indexOf(String(label)) : -1
    if (index < 0) return null
    const values = chart.series.filter((s) => s.data[index] != null)
    if (values.length === 0) return null
    return (
      <Box
        sx={{
          px: 1,
          py: 0.5,
          borderRadius: 1.5,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
          boxShadow: theme.shadows[3],
          fontSize: 11.5,
        }}
      >
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, mb: 0.25 }}>
          {String(label)}
        </Typography>
        {values.map((s) => (
          <Box key={s.name} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Box component="span" sx={{ color: chart.type === 'line' ? color(s) : pointColor(s, index), fontWeight: 600 }}>
              {s.name}
            </Box>
            <Box component="span" sx={TABULAR}>{format(s.data[index], chart.unit)}</Box>
          </Box>
        ))}
      </Box>
    )
  }

  const tooltip = (
    <Tooltip
      content={renderTooltip}
      isAnimationActive={false}
      cursor={chart.type === 'line'
        ? { stroke: theme.palette.text.disabled, strokeDasharray: '3 3' }
        : { fill: theme.palette.action.hover }}
    />
  )

  let body
  let height
  if (chart.type === 'line') {
    height = LINE_HEIGHT
    body = (
      <LineChart data={rows} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={grid} />
        <XAxis
          dataKey="name"
          ticks={dayTicks(chart.categories)}
          interval={0}
          height={20}
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: theme.palette.divider }}
        />
        <YAxis width={38} tick={axisTick} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${Math.round(v)}`} />
        {tooltip}
        {chart.series.map((s, j) => (
          <Line
            key={s.name}
            type="linear"
            dataKey={key(j)}
            name={s.name}
            stroke={color(s)}
            strokeWidth={KIND_COLORS[s.kind].width}
            strokeDasharray={KIND_COLORS[s.kind].dash}
            connectNulls={false}
            dot={false}
            activeDot={s.kind === 'actual' ? { r: 3 } : false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    )
  } else if (chart.type === 'bar') {
    height = BAR_HEIGHT
    body = (
      <BarChart data={rows} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={grid} />
        <XAxis
          dataKey="name"
          ticks={/^\d+$/.test(chart.categories[0] ?? '') ? dayTicks(chart.categories) : undefined}
          interval={/^\d+$/.test(chart.categories[0] ?? '') ? 0 : 'preserveStartEnd'}
          height={20}
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: theme.palette.divider }}
        />
        <YAxis
          width={38}
          domain={valueAxis.domain}
          ticks={valueAxis.ticks}
          tickFormatter={valueTickFormat}
          tick={axisTick}
          tickLine={false}
          axisLine={false}
        />
        {tooltip}
        {chart.series.map((s, j) => (
          <Bar key={s.name} dataKey={key(j)} name={s.name} fill={color(s)} radius={[2, 2, 0, 0]} isAnimationActive={false}>
            {rows.map((_, i) => <Cell key={i} fill={pointColor(s, i)} />)}
          </Bar>
        ))}
        {chart.refValue != null && (
          <ReferenceLine y={chart.refValue} stroke={refColor} strokeDasharray="4 3" ifOverflow="extendDomain" />
        )}
      </BarChart>
    )
  } else {
    // hbar: mỗi danh mục 1 hàng; nhiều chuỗi -> cột nhóm
    height = rows.length * HBAR_ROW * Math.max(1, chart.series.length * 0.75) + 28
    body = (
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 0 }} barGap={1}>
        <CartesianGrid horizontal={false} stroke={grid} />
        <XAxis
          type="number"
          height={18}
          domain={valueAxis.domain}
          ticks={valueAxis.ticks}
          tickFormatter={valueTickFormat}
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: theme.palette.divider }}
        />
        {/* có giá trị âm (vd K$ còn dư) -> vạch 0 làm mốc */}
        {valueAxis.domain[0] < 0 && <ReferenceLine x={0} stroke={theme.palette.text.disabled} />}
        <YAxis
          type="category"
          dataKey="name"
          width={78}
          tick={{ ...axisTick, fill: theme.palette.text.primary }}
          tickLine={false}
          axisLine={false}
          interval={0}
        />
        {tooltip}
        {chart.series.map((s, j) => (
          <Bar key={s.name} dataKey={key(j)} name={s.name} fill={color(s)} radius={[0, 2, 2, 0]} maxBarSize={12} isAnimationActive={false}>
            {rows.map((_, i) => <Cell key={i} fill={pointColor(s, i)} />)}
          </Bar>
        ))}
        {chart.refValue != null && (
          <ReferenceLine x={chart.refValue} stroke={refColor} strokeDasharray="4 3" ifOverflow="extendDomain" />
        )}
      </BarChart>
    )
  }

  return (
    <Box
      sx={{
        mt: 0.75,
        p: 1,
        pb: 0.75,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        width: '100%',
        minWidth: 0,
      }}
    >
      <Typography sx={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.35 }}>
        {chart.title}
        {chart.unit && (
          <Box component="span" sx={{ ml: 0.5, fontWeight: 400, color: 'text.secondary' }}>({chart.unit})</Box>
        )}
      </Typography>

      {/* Legend gọn (recharts Legend chiếm chiều cao khó đoán) */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 1.25, rowGap: 0.25, mt: 0.25, mb: 0.5 }}>
        {legend.map((item) => (
          <Box key={item.label} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 11, color: 'text.secondary' }}>
            <Box
              component="span"
              sx={{
                width: 14,
                height: item.line ? 0 : 8,
                borderRadius: item.line ? 0 : 0.5,
                bgcolor: item.line ? 'transparent' : item.color,
                borderTop: item.line
                  ? `${Math.max(2, item.line.width)}px ${item.line.dash ? 'dashed' : 'solid'} ${item.color}`
                  : 'none',
              }}
            />
            {item.label}
          </Box>
        ))}
        {chart.refValue != null && chart.refLabel && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 11, color: 'text.secondary' }}>
            <Box component="span" sx={{ width: 14, borderTop: `2px dashed ${refColor}` }} />
            {chart.refLabel} ({format(chart.refValue, chart.unit)})
          </Box>
        )}
      </Box>

      <Box sx={{ height, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          {body}
        </ResponsiveContainer>
      </Box>

      {chart.note && (
        <Typography sx={{ mt: 0.5, fontSize: 11, color: 'text.secondary', fontStyle: 'italic', lineHeight: 1.4 }}>
          {chart.note}
        </Typography>
      )}
    </Box>
  )
}

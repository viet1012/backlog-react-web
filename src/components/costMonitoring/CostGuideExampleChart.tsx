import { Box, Button, Chip, Slider, Stack, Typography, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import dayjs from 'dayjs'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
} from 'recharts'
import type { CostChart } from '../../types/costMonitoring'
import { CostChartOverlay } from './CostChartOverlay'
import { CostChartStats } from './CostChartStats'
import { COST_SERIES, TABULAR_NUMS, formatK, seriesColor, seriesColorOf } from './costChartConfig'
import { buildXTicks, buildYAxis, spreadLabels } from './costChartUtils'
import type { DemoRow } from './costGuideDemo'
import { EXAMPLE_DEMO, type ExampleValues } from './costMonitoringGuide'

interface CostGuideExampleChartProps {
  day: number
  // ngày hôm nay trong tháng ví dụ (giá trị mặc định của slider)
  today: number
  onDayChange: (day: number) => void
  chart: CostChart
  rows: DemoRow[]
  values: ExampleValues
}

const CIRCLED = ['①', '②', '③', '④']
const R = 9
const fmt2 = (v: number) => v.toFixed(2)


// =========================================================
// CHÚ THÍCH ĐÁNH SỐ (vẽ trong <LineChart> để lấy đúng pixel)
// =========================================================

function DemoCallouts({ rows, values }: { rows: DemoRow[]; values: ExampleValues }) {
  const theme = useTheme()
  const plot = usePlotArea()
  const xScale = useXAxisScale()
  const yScale = useYAxisScale()

  if (!plot || !xScale || !yScale) return null

  const color = theme.palette.primary.main
  const plotRight = plot.x + plot.width
  const xToday = xScale(rows[values.day - 1].label) ?? plot.x
  const xEnd = xScale(rows[rows.length - 1].label) ?? plotRight
  const clampY = (y: number) => Math.min(Math.max(y, plot.y + R), plot.y + plot.height - R)

  // ① trên Actual(d) & ② dưới PL MTD(d) – đảo lại nếu PL MTD > Actual.
  // ① luôn bên trái ② ≥ 22px; sát mép thì dời cả cặp vào trong.
  const actAbove = values.act >= values.plMtd
  let dx1 = -18
  let dx2 = 18

  if (xToday + dx2 + R > plotRight) {
    dx1 = -40
    dx2 = -18
  } else if (xToday + dx1 - R < plot.x) {
    dx1 = 18
    dx2 = 40
  }

  // ③ ④ bên trái tag phải; vị trí tag tính lại giống CostChartOverlay (cùng spreadLabels)
  const tags = spreadLabels([
    { key: 'fc', y: yScale(values.fc) ?? 0 },
    { key: 'pl', y: yScale(values.pl) ?? 0 },
    { key: 'fluct', y: yScale(values.fluct) ?? 0 },
  ])
  const fluctTagY = tags.find((t) => t.key === 'fluct')!.y

  const marks: { no: number; x: number; y?: number; cx: number; cy: number }[] = []
  const yAct = yScale(values.act)
  const yPl = yScale(values.plMtd)

  if (yAct != null) {
    marks.push({ no: 1, x: xToday, y: yAct, cx: xToday + dx1, cy: clampY(yAct + (actAbove ? -18 : 18)) })
  }

  if (yPl != null) {
    marks.push({ no: 2, x: xToday, y: yPl, cx: xToday + dx2, cy: clampY(yPl + (actAbove ? 18 : -18)) })
  }

  if (values.estEnd != null) {
    const yEst = yScale(values.estEnd)

    if (yEst != null) {
      marks.push({ no: 3, x: xEnd, y: yEst, cx: plotRight - 22, cy: clampY(yEst - 16) })
    }
  }

  // ④ trỏ vào mép trái của tag đỏ, lệch trái hơn ③ để không chồng
  marks.push({ no: 4, x: plotRight + 3, y: fluctTagY, cx: plotRight - 46, cy: clampY(fluctTagY - 16) })

  return (
    <g pointerEvents="none">
      {marks.map(({ no, x, y, cx, cy }) => y != null && (
        <g key={no}>
          <line x1={x} y1={y} x2={cx} y2={cy} stroke={color} strokeWidth={1.5} />
          <circle cx={x} cy={y} r={2.5} fill={color} />
          <circle cx={cx} cy={cy} r={R} fill={color} />
          <text x={cx} y={cy + 4} textAnchor="middle" fill="#fff" fontSize={11} fontWeight={800}>
            {no}
          </text>
        </g>
      ))}
    </g>
  )
}


// =========================================================
// CHART MINH HỌA + THANH TRƯỢT
// =========================================================

export function CostGuideExampleChart({ day, today, onDayChange, chart, rows, values }: CostGuideExampleChartProps) {
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'
  const isToday = day === today
  const sliderLabel = isToday ? EXAMPLE_DEMO.sliderLabelToday(day) : EXAMPLE_DEMO.sliderLabelAssumed(day)

  const yAxis = buildYAxis(rows, chart)
  const axisTick = { fontSize: 11, fill: theme.palette.text.secondary, style: TABULAR_NUMS }
  const plColor = seriesColorOf('plTgt', dark)
  const { callouts } = EXAMPLE_DEMO

  const calloutTexts = [
    callouts.actual(fmt2(values.act)),
    callouts.plMtd(fmt2(values.plMtd), values.diff),
    values.estEnd != null ? callouts.estimate(fmt2(values.estEnd)) : null,
    callouts.fluct(formatK(values.fluct)),
  ]

  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          p: 1,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1.5,
          bgcolor: 'background.paper',
        }}
      >
        <CostChartStats rows={rows} chart={chart} ratioDigits={1} />

        <Box sx={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 44, bottom: 0, left: 0 }}>
              <CartesianGrid
                vertical={false}
                stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
              />

              <XAxis
                dataKey="label"
                ticks={buildXTicks(rows)}
                interval={0}
                height={22}
                // ví dụ không gắn với tháng cụ thể → chỉ hiện số ngày
                tickFormatter={(v: string) => v.split('/')[0]}
                padding={{ left: 4, right: 12 }}
                tick={axisTick}
                tickLine={false}
                axisLine={{ stroke: theme.palette.divider }}
              />

              <YAxis
                width={40}
                domain={[0, yAxis.max]}
                ticks={yAxis.ticks}
                allowDataOverflow
                tickFormatter={(v: number) => v.toFixed(1)}
                tick={axisTick}
                tickLine={false}
                axisLine={false}
              />

              <ReferenceLine
                x={rows[day - 1].label}
                stroke={theme.palette.text.secondary}
                strokeWidth={1}
                strokeDasharray="2 2"
                label={{
                  value: isToday ? EXAMPLE_DEMO.todayLabel : EXAMPLE_DEMO.dayLabel(day),
                  position: 'insideTopLeft',
                  fontSize: 10,
                  fill: theme.palette.text.secondary,
                }}
              />

              {/* PL MTD: kế hoạch lũy kế theo ngày – mờ, nét chấm */}
              <Line
                type="linear"
                dataKey="plMtd"
                stroke={alpha(plColor, 0.6)}
                strokeWidth={1.5}
                strokeDasharray="1 3"
                strokeLinecap="round"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />

              {COST_SERIES.map((s) => (
                <Line
                  key={s.key}
                  type="linear"
                  dataKey={s.key === 'estMtd' ? 'estLine' : s.key}
                  stroke={seriesColor(s, dark)}
                  strokeWidth={s.strokeWidth}
                  strokeDasharray={s.dash}
                  connectNulls={false}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              ))}

              <CostChartOverlay rows={rows} chart={chart} />

              <DemoCallouts rows={rows} values={values} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      <Box>
        <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
            {sliderLabel}
          </Typography>

          {isToday ? (
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              label={EXAMPLE_DEMO.todayChip(dayjs().format('DD/MM'))}
              sx={{ fontSize: 12, fontWeight: 700, height: 22 }}
            />
          ) : (
            <Button
              size="small"
              variant="text"
              onClick={() => onDayChange(today)}
              sx={{ fontSize: 13, fontWeight: 700, textTransform: 'none', minWidth: 0, py: 0, px: 0.75 }}
            >
              {EXAMPLE_DEMO.resetToday}
            </Button>
          )}
        </Stack>

        <Slider
          value={day}
          min={1}
          max={EXAMPLE_DEMO.daysInMonth}
          step={1}
          marks={[1, 10, 20, 30].map((v) => ({ value: v, label: String(v) }))}
          valueLabelDisplay="auto"
          onChange={(_, value) => onDayChange(value as number)}
          aria-label={sliderLabel}
          sx={{ mx: 1, width: 'calc(100% - 16px)' }}
        />

        <Typography sx={{ fontSize: 14 }} color="text.secondary">
          {EXAMPLE_DEMO.sliderHint}
        </Typography>
      </Box>

      <Stack spacing={0.75}>
        {calloutTexts.map((text, i) =>
          text && (
            <Stack key={CIRCLED[i]} direction="row" spacing={1}>
              <Typography sx={{ fontSize: 18, lineHeight: 1.25, color: 'primary.main', fontWeight: 800 }}>
                {CIRCLED[i]}
              </Typography>
              <Typography sx={{ fontSize: 14, lineHeight: 1.6 }}>{text}</Typography>
            </Stack>
          ),
        )}

        <Typography sx={{ fontSize: 14, lineHeight: 1.6 }} color="text.secondary">
          {EXAMPLE_DEMO.plMtdLegend}. {EXAMPLE_DEMO.unitNote}
        </Typography>
      </Stack>
    </Stack>
  )
}

import { useTheme } from '@mui/material'
import { usePlotArea, useXAxisScale, useYAxisScale } from 'recharts'
import type { CostChart } from '../../types/costMonitoring'
import { formatK, seriesColorOf, type CostSeriesKey } from './costChartConfig'
import { lastIndexOf, lastValue, spreadLabels, type CostChartRow } from './costChartUtils'

interface CostChartOverlayProps {
  rows: CostChartRow[]
  chart: CostChart
}

// Tag nhỏ: chữ 10px, padding 1px 4px
const TAG_FONT = 10
const TAG_PAD_X = 4
const TAG_HEIGHT = TAG_FONT + 2 + 2
const TAG_CHAR_WIDTH = 5.8

// Lớp vẽ trong <LineChart>: mũi tên cuối Actual + tag giá trị bám mép phải
// cho các đường ngang (FC, PL, Fluct cuối). Không vẽ nhãn số nào trong vùng vẽ.
export function CostChartOverlay({ rows, chart }: CostChartOverlayProps) {
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'
  const plot = usePlotArea()
  const xScale = useXAxisScale()
  const yScale = useYAxisScale()

  if (!plot || !xScale || !yScale) return null

  const plotRight = plot.x + plot.width

  // ---------- mũi tên ở điểm actual cuối, hướng theo đoạn cuối ----------
  const lastAct = lastIndexOf(rows, 'actMtd')
  let arrow = null

  if (lastAct >= 0) {
    const ax = xScale(rows[lastAct].label)
    const ay = yScale(rows[lastAct].actMtd)
    const prevValue = lastAct > 0 ? rows[lastAct - 1].actMtd : null
    const bx = prevValue != null ? xScale(rows[lastAct - 1].label) : undefined
    const by = prevValue != null ? yScale(prevValue) : undefined

    if (ax != null && ay != null) {
      const angle = bx != null && by != null
        ? (Math.atan2(ay - by, ax - bx) * 180) / Math.PI
        : 0

      arrow = (
        <polygon
          points="-9,-5 1,0 -9,5"
          transform={`translate(${ax},${ay}) rotate(${angle})`}
          fill={seriesColorOf('actMtd', dark)}
        />
      )
    }
  }

  // ---------- right axis tags – tránh chồng: cách nhau ≥ 14px ----------
  const tagValues: { key: CostSeriesKey; value: number | null }[] = [
    { key: 'fcTgt', value: chart.fcTgt },
    { key: 'plTgt', value: chart.plTgt },
    { key: 'fluctTgt', value: lastValue(rows, 'fluctTgt') },
  ]

  const tags = spreadLabels(
    tagValues.flatMap(({ key, value }) => {
      const y = value != null ? yScale(value) : undefined

      return y != null && value != null ? [{ key, value, y }] : []
    }),
    14,
  )

  return (
    <g pointerEvents="none">
      {arrow}

      {tags.map((t) => {
        const text = formatK(t.value)
        const width = text.length * TAG_CHAR_WIDTH + TAG_PAD_X * 2

        return (
          <g key={t.key} transform={`translate(${plotRight + 3},${t.y - TAG_HEIGHT / 2})`}>
            <rect width={width} height={TAG_HEIGHT} rx={2} fill={seriesColorOf(t.key, dark)} />
            <text
              x={width / 2}
              y={TAG_HEIGHT / 2 + 3.5}
              textAnchor="middle"
              // màu tag ở dark mode đã làm sáng → chữ tối cho dễ đọc
              fill={dark ? '#111827' : '#fff'}
              fontSize={TAG_FONT}
              fontWeight={700}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {text}
            </text>
          </g>
        )
      })}
    </g>
  )
}

import { Box, useTheme } from '@mui/material'
import { STATUS_BADGE, seriesColorOf } from './costChartConfig'
import { useI18n } from '../../i18n/useI18n'

// Chart mẫu tĩnh (không gọi API) cho tab "Cách đọc chart", có chú thích ①–⑤.
// Số liệu minh họa: FC 183, PL 170, Actual đến ngày 15 = 95, Estimate cuối tháng 191.
const PLOT = { left: 40, right: 440, top: 50, bottom: 250 }
const Y_MAX = 220

const y = (v: number) => PLOT.bottom - (v / Y_MAX) * (PLOT.bottom - PLOT.top)

const ACTUAL = [[40, 0], [80, 22], [120, 42], [160, 60], [200, 80], [233, 95]] as const
const EST_END = 191

export function CostGuideDiagram() {
  const { t } = useI18n()

  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'

  const ink = theme.palette.text.primary
  const muted = theme.palette.text.secondary
  const grid = theme.palette.divider
  const callout = theme.palette.primary.main
  const fc = seriesColorOf('fcTgt', dark)
  const pl = seriesColorOf('plTgt', dark)
  const blue = seriesColorOf('actMtd', dark)
  const watch = STATUS_BADGE.watch
  const tagText = dark ? '#111827' : '#fff'

  const [ax, av] = ACTUAL[ACTUAL.length - 1]
  const prev = ACTUAL[ACTUAL.length - 2]
  const arrowAngle = (Math.atan2(y(av) - y(prev[1]), ax - prev[0]) * 180) / Math.PI

  const renderCallout = ({ no, cx, cy, toX, toY }: { no: number; cx: number; cy: number; toX: number; toY: number }) => (
    <g>
      <line x1={cx} y1={cy} x2={toX} y2={toY} stroke={callout} strokeWidth={1.5} />
      <circle cx={toX} cy={toY} r={2.5} fill={callout} />
      <circle cx={cx} cy={cy} r={11} fill={callout} />
      <text x={cx} y={cy + 4.5} textAnchor="middle" fill="#fff" fontSize={13} fontWeight={800}>
        {no}
      </text>
    </g>
  )

  // tag nhỏ giống chart thật: chữ 10px, padding 1px 4px
  const tag = ({ value, ty, color }: { value: string; ty: number; color: string }) => (
    <g transform={`translate(${PLOT.right + 4},${ty - 7})`}>
      <rect width={37} height={14} rx={2} fill={color} />
      <text x={18.5} y={10.5} textAnchor="middle" fill={tagText} fontSize={10} fontWeight={700}>
        {value}
      </text>
    </g>
  )

  return (
    <Box
      component="svg"
      viewBox="0 0 520 285"
      role="img"
      aria-label={t.costGuide.diagramAria}
      sx={(t) => ({
        width: '100%',
        height: 'auto',
        display: 'block',
        border: `1px solid ${t.palette.divider}`,
        borderRadius: 1.5,
        bgcolor: 'background.paper',
      })}
    >
      {/* ① hàng số liệu */}
      <g fontSize={12}>
        <circle cx={16} cy={20} r={4} fill={fc} />
        <text x={24} y={24} fill={muted}>FC <tspan fill={ink} fontWeight={700}>183.0</tspan></text>
        <circle cx={92} cy={20} r={4} fill={pl} />
        <text x={100} y={24} fill={muted}>PL <tspan fill={ink} fontWeight={700}>170.0</tspan></text>
        <circle cx={168} cy={20} r={4} fill={blue} />
        <text x={176} y={24} fill={muted}>Act <tspan fill={ink} fontWeight={700}>95.0</tspan></text>
        <line x1={240} y1={20} x2={252} y2={20} stroke={blue} strokeWidth={2} strokeDasharray="3 2" />
        <text x={256} y={24} fill={muted}>Est <tspan fill={ink} fontWeight={700}>191.0</tspan></text>
      </g>

      {/* ② badge – pill nền nhạt + viền + chữ màu */}
      <rect x={424} y={9} width={88} height={22} rx={11} fill={watch.bg} stroke={watch.fg} strokeOpacity={0.3} />
      <text x={468} y={24.5} textAnchor="middle" fill={watch.fg} fontSize={12} fontWeight={700}>
        {t.cost.status.watch} 104%
      </text>

      {/* trục + grid ngang */}
      {[0, 100, 200].map((v) => (
        <g key={v}>
          <line x1={PLOT.left} x2={PLOT.right} y1={y(v)} y2={y(v)} stroke={grid} strokeOpacity={0.6} />
          <text x={PLOT.left - 6} y={y(v) + 4} textAnchor="end" fill={muted} fontSize={11}>
            {v.toFixed(1)}
          </text>
        </g>
      ))}

      {[[40, '1/11'], [233, '15/11'], [440, '30/11']].map(([x, label]) => (
        <text key={label} x={x} y={PLOT.bottom + 16} textAnchor="middle" fill={muted} fontSize={11}>
          {label}
        </text>
      ))}

      {/* đường ngang FC / PL */}
      <line x1={PLOT.left} x2={PLOT.right} y1={y(183)} y2={y(183)} stroke={fc} strokeWidth={1.5} strokeDasharray="8 4" />
      <line x1={PLOT.left} x2={PLOT.right} y1={y(170)} y2={y(170)} stroke={pl} strokeWidth={2.5} />

      {/* ③ Actual + mũi tên */}
      <polyline
        points={ACTUAL.map(([x, v]) => `${x},${y(v)}`).join(' ')}
        fill="none"
        stroke={blue}
        strokeWidth={2.5}
      />
      <polygon points="-9,-5 1,0 -9,5" transform={`translate(${ax},${y(av)}) rotate(${arrowAngle})`} fill={blue} />

      {/* ④ Estimate nối tiếp đến cuối tháng */}
      <line x1={ax} y1={y(av)} x2={PLOT.right} y2={y(EST_END)} stroke={blue} strokeWidth={1.5} strokeDasharray="4 3" />

      {/* ⑤ tag bên phải (PL bị đẩy xuống 14px để không chồng FC) */}
      {tag({ value: '183.0', ty: y(183), color: fc })}
      {tag({ value: '170.0', ty: y(183) + 14, color: pl })}

      {renderCallout({ no: 1, cx: 340, cy: 20, toX: 312, toY: 20 })}
      {renderCallout({ no: 2, cx: 400, cy: 48, toX: 424, toY: 30 })}
      {renderCallout({ no: 3, cx: 175, cy: 225, toX: 180, toY: y(70) })}
      {renderCallout({ no: 4, cx: 370, cy: 160, toX: 340, toY: y(av + ((EST_END - av) * (340 - ax)) / (PLOT.right - ax)) })}
      {renderCallout({ no: 5, cx: 500, cy: 150, toX: 480, toY: y(183) + 21 })}
    </Box>
  )
}

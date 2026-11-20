import { Box, Typography, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { ReactNode } from 'react'
import { useI18n } from '../../i18n/useI18n'
import type { AssistantCard } from '../../services/assistantService'

// Cùng bảng màu với MascotChart / chart Cost Monitoring
const COLORS = {
  over: { light: '#DC2626', dark: '#F87171' },
  watch: { light: '#D97706', dark: '#FBBF24' },
  ok: { light: '#16A34A', dark: '#4ADE80' },
  actual: { light: '#4472C4', dark: '#6F9BEA' },
  fluct: { light: '#C00000', dark: '#FF5C5C' },
  fc: { light: '#595959', dark: '#A6A6A6' },
  neutral: { light: '#64748B', dark: '#94A3B8' },
}

const TABULAR = { fontVariantNumeric: 'tabular-nums' } as const

function k1(value: number) {
  return value.toFixed(1)
}

function signed(value: number) {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}`
}

/** "Dự báo vượt **+58.3 K$**" -> in đậm phần trong ** (không cần parser markdown) */
function renderBold(text: string): ReactNode[] {
  return text.split('**').map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))
}

const stripes = (color: string) =>
  `repeating-linear-gradient(135deg, ${alpha(color, 0.55)} 0 4px, ${alpha(color, 0.25)} 4px 8px)`

/**
 * Thẻ tóm tắt đầu câu trả lời: tiêu đề + câu kết luận, chip số chính, thanh ngân sách tháng
 * (Actual + phần dự báo còn lại so với mốc Fluct / FC) và cầu nối Fluct → FC → Dự báo.
 */
export function MascotCard({ card }: { card: AssistantCard }) {
  const { language } = useI18n()
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'
  const tone = (c: { light: string; dark: string }) => (dark ? c.dark : c.light)
  const accent = tone(COLORS[card.tone])

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: 1,
        borderColor: alpha(accent, 0.35),
        borderLeft: `4px solid ${accent}`,
        bgcolor: alpha(accent, dark ? 0.08 : 0.04),
        px: 1.5,
        py: 1.25,
        width: '100%',
        minWidth: 0,
      }}
    >
      {card.title && (
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, color: 'text.secondary', textTransform: 'uppercase' }}>
          {card.title}
        </Typography>
      )}
      <Typography sx={{ fontSize: 15, lineHeight: 1.4, mt: 0.25, '& strong': { color: accent, fontWeight: 800 } }}>
        {renderBold(card.headline)}
      </Typography>

      {card.chips.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
          {card.chips.map((chip) => {
            const c = chip.tone === 'neutral' ? tone(COLORS.neutral) : tone(COLORS[chip.tone])
            return (
              <Box
                key={chip.label}
                sx={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1.5,
                  bgcolor: alpha(c, dark ? 0.16 : 0.08),
                  border: `1px solid ${alpha(c, 0.3)}`,
                  minWidth: 0,
                }}
              >
                <Box component="span" sx={{ fontSize: 10.5, color: 'text.secondary', lineHeight: 1.2 }}>{chip.label}</Box>
                <Box component="span" sx={{ fontSize: 13.5, fontWeight: 800, color: c, lineHeight: 1.3, ...TABULAR }}>
                  {chip.value}
                </Box>
              </Box>
            )
          })}
        </Box>
      )}

      {card.budget && <BudgetBar budget={card.budget} unit={card.unit} tone={tone} />}
      {card.bridge.length >= 3 && (
        <Bridge
          steps={card.bridge}
          unit={card.unit}
          tone={tone}
          axisFrom={language === 'en' ? 'axis starts at' : 'trục bắt đầu từ'}
        />
      )}
    </Box>
  )
}

type Tone = (c: { light: string; dark: string }) => string

// =========================================================
// THANH NGÂN SÁCH: [Actual][phần dự báo còn lại trong Fluct][phần vượt Fluct], mốc Fluct (trên) / FC (dưới)
// =========================================================

function BudgetBar({ budget, unit, tone }: { budget: NonNullable<AssistantCard['budget']>; unit: string; tone: Tone }) {
  const { actual, forecast, fluct, fc } = budget
  const max = Math.max(actual, forecast ?? 0, fluct ?? 0, fc ?? 0) * 1.06 || 1
  const pct = (v: number) => `${(Math.max(0, v) / max) * 100}%`
  const blue = tone(COLORS.actual)
  const red = tone(COLORS.over)

  // Actual vượt Fluct thực tế: phần vượt tô đỏ đặc
  const actualWithin = fluct != null ? Math.min(actual, fluct) : actual
  const actualOver = fluct != null && actual > fluct ? actual - fluct : 0
  // Phần dự báo còn lại: trong Fluct (sọc xanh) / vượt Fluct (sọc đỏ)
  const restEnd = forecast ?? actual
  const restWithinEnd = fluct != null ? Math.min(restEnd, Math.max(fluct, actual)) : restEnd
  const restWithin = Math.max(0, restWithinEnd - actual)
  const restOver = Math.max(0, restEnd - Math.max(restWithinEnd, actual))

  const marker = (value: number, color: string, label: string, top: boolean, dashed?: boolean) => (
    <Box sx={{ position: 'absolute', left: pct(value), top: top ? -16 : 'auto', bottom: top ? 'auto' : -16, height: 0 }}>
      {/* vạch cắt ngang thanh (thanh cao 14px): trên -> từ nhãn xuống qua thanh; dưới -> từ trên thanh xuống nhãn */}
      <Box
        sx={{
          position: 'absolute',
          left: -1,
          top: top ? 14 : -32,
          height: top ? 22 : 32,
          borderLeft: `2px ${dashed ? 'dashed' : 'solid'} ${color}`,
        }}
      />
      <Box
        component="span"
        sx={{
          position: 'absolute',
          left: 0,
          transform: 'translateX(-50%)',
          top: top ? 0 : 2,
          fontSize: 10.5,
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          ...TABULAR,
        }}
      >
        {label}
      </Box>
    </Box>
  )

  return (
    <Box sx={{ mt: 1.5 }}>
      <Box sx={{ position: 'relative', mx: 3, mt: 2.25, mb: 3.75 }}>
        <Box sx={{ display: 'flex', height: 14, borderRadius: 1, overflow: 'hidden', bgcolor: 'action.hover' }}>
          <Box sx={{ width: pct(actualWithin), bgcolor: blue }} />
          {actualOver > 0 && <Box sx={{ width: pct(actualOver), bgcolor: red }} />}
          {restWithin > 0 && <Box sx={{ width: pct(restWithin), background: stripes(blue) }} />}
          {restOver > 0 && <Box sx={{ width: pct(restOver), background: stripes(red) }} />}
        </Box>
        {fluct != null && marker(fluct, tone(COLORS.fluct), `Fluct ${k1(fluct)}`, true)}
        {fc != null && marker(fc, tone(COLORS.fc), `FC ${k1(fc)}`, false, true)}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 1.5, rowGap: 0.25, fontSize: 11, color: 'text.secondary', ...TABULAR }}>
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
          <Box component="span" sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: blue }} />
          {budget.actualLabel}: <b>{k1(actual)}</b>
        </Box>
        {forecast != null && forecast > actual && (
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <Box component="span" sx={{ width: 10, height: 10, borderRadius: 0.5, background: stripes(restOver > 0 ? red : blue) }} />
            {budget.restLabel}: <b>{signed(forecast - actual)}</b>
          </Box>
        )}
        {forecast != null && (
          <Box component="span">
            {budget.forecastLabel}: <b>{k1(forecast)} {unit}</b>
          </Box>
        )}
      </Box>
    </Box>
  )
}

// =========================================================
// CẦU NỐI (waterfall ngang): mốc / bước ± / kết quả. Trục thu hẹp quanh các giá trị để bước nhỏ vẫn thấy rõ.
// =========================================================

function Bridge({ steps, unit, tone, axisFrom }: { steps: AssistantCard['bridge']; unit: string; tone: Tone; axisFrom: string }) {
  // Vị trí từng thanh
  let running = 0
  const rows = steps.map((s) => {
    if (s.kind === 'delta') {
      const from = running
      running += s.value
      return { ...s, from: Math.min(from, running), to: Math.max(from, running) }
    }
    running = s.value
    return { ...s, from: 0, to: s.value }
  })

  const ends = rows.flatMap((r) => (r.kind === 'delta' ? [r.from, r.to] : [r.to]))
  const lo = Math.floor((Math.min(...ends) * 0.85) / 10) * 10
  const hi = Math.max(...ends) * 1.02
  const pos = (v: number) => `${((Math.max(lo, v) - lo) / (hi - lo || 1)) * 100}%`

  return (
    <Box sx={{ mt: 1.25, pt: 1, borderTop: 1, borderColor: 'divider' }}>
      {rows.map((r, i) => {
        const delta = r.kind === 'delta'
        const color = delta
          ? tone(r.value > 0 ? COLORS.over : COLORS.ok)
          : r.kind === 'base' ? tone(COLORS.fluct) : i === rows.length - 1 ? tone(COLORS.actual) : tone(COLORS.fc)
        return (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, height: 22 }}>
            <Box
              sx={{
                width: 92,
                flexShrink: 0,
                fontSize: 11.5,
                color: delta ? 'text.secondary' : 'text.primary',
                fontWeight: delta ? 400 : 700,
                pl: delta ? 1 : 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {r.label}
            </Box>
            <Box sx={{ position: 'relative', flex: 1, height: 12 }}>
              <Box
                sx={{
                  position: 'absolute',
                  left: delta ? pos(r.from) : 0,
                  width: delta
                    ? `calc(${pos(r.to)} - ${pos(r.from)})`
                    : pos(r.to),
                  top: 0,
                  bottom: 0,
                  borderRadius: 0.75,
                  bgcolor: delta ? color : alpha(color, 0.75),
                  minWidth: 2,
                }}
              />
            </Box>
            <Box sx={{ width: 52, flexShrink: 0, textAlign: 'right', fontSize: 11.5, fontWeight: 700, color, ...TABULAR }}>
              {delta ? signed(r.value) : k1(r.value)}
            </Box>
          </Box>
        )
      })}
      <Typography sx={{ fontSize: 10, color: 'text.disabled', mt: 0.25 }}>
        {unit}{lo > 0 ? ` · ${axisFrom} ${lo}` : ''}
      </Typography>
    </Box>
  )
}

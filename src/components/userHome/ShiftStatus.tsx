import type { ReactNode } from 'react'

import { Box } from '@mui/material'
import { keyframes } from '@mui/material/styles'
import { LocalCafeRounded, RestaurantRounded } from '@mui/icons-material'

import { useI18n } from '../../i18n/useI18n'
import { LED } from './userHomeStyles'
import { clockLabel, formatCountdown, type ShiftNow } from './wall/shiftSchedule'
import { SegmentDisplay } from './warehouse/SegmentDisplay'

/*
 * Ca hành chính trên thanh đầu trang chủ: 1 dòng trạng thái dưới đồng hồ.
 * Giờ làm chỉ ghi "Đang làm việc" (không đếm ngược tới giờ nghỉ).
 * Giải lao / nghỉ trưa: tách cà phê bốc khói / dao nĩa + đồng hồ LED đếm ngược tới lúc quay lại.
 */

const TEXT = '#eef3f9'
const MUTED = 'rgba(226, 232, 240, 0.6)'

export const REST_COLOR = {
  break: LED.amber,
  lunch: LED.cyan,
}

const steam = keyframes`
  0%   { opacity: 0; transform: translateY(2px) scaleY(0.6); }
  40%  { opacity: 0.9; }
  100% { opacity: 0; transform: translateY(-7px) scaleY(1); }
`

// Tách cà phê bốc khói (giải lao)
function Coffee() {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', color: LED.amber }}>
      {[3, 7].map((left, index) => (
        <Box
          key={left}
          sx={{
            position: 'absolute',
            left,
            top: -5,
            width: 2,
            height: 6,
            borderRadius: 1,
            bgcolor: LED.amber,
            opacity: 0,
            animation: `${steam} 1.8s ease-out ${index * 0.6}s infinite`,
            '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 0.5 },
          }}
        />
      ))}
      <LocalCafeRounded sx={{ fontSize: 15 }} />
    </Box>
  )
}

export function ShiftStatus({ shift, now }: { shift: ShiftNow; now: Date }) {
  const { t, language } = useI18n()
  const s = t.userHome.shift
  const { state } = shift

  const nextDayLabel = (day: Date) => {
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    return day.getTime() === tomorrow.getTime()
      ? s.tomorrow
      : new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long' }).format(day)
  }

  let left: { label: string; color: string; icon?: ReactNode }
  let right: ReactNode

  switch (state.kind) {
    case 'work':
      left = { label: s.states.work, color: TEXT, icon: <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: LED.green, boxShadow: `0 0 6px ${LED.green}` }} /> }
      right = null
      break
    case 'break':
    case 'lunch': {
      const color = REST_COLOR[state.kind]
      left = {
        label: s.states[state.kind],
        color,
        icon: state.kind === 'break' ? <Coffee /> : <RestaurantRounded sx={{ fontSize: 14, color }} />,
      }
      right = (
        <>
          <Box component="span" sx={{ color: MUTED }}>{s.backAt(clockLabel(state.endsAt))}</Box>
          <Box component="span" role="timer" aria-label={formatCountdown(state.leftSeconds)} sx={{ fontSize: 13, lineHeight: 1 }}>
            <SegmentDisplay text={formatCountdown(state.leftSeconds)} color={color} />
          </Box>
        </>
      )
      break
    }
    case 'before':
      left = { label: s.states.before, color: MUTED }
      right = <Box component="span" sx={{ color: MUTED }}>{s.startsAt(clockLabel(shift.dayStart))}</Box>
      break
    case 'after':
    case 'dayOff':
      left = { label: s.states[state.kind], color: MUTED }
      right = <Box component="span" sx={{ color: MUTED }}>{s.next(nextDayLabel(state.nextDay), clockLabel(shift.dayStart))}</Box>
      break
  }

  return (
    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.25, fontSize: 11, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, minWidth: 0, color: left.color, fontWeight: 800 }}>
        {left.icon}
        <span>{left.label}</span>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
        {right}
      </Box>
    </Box>
  )
}

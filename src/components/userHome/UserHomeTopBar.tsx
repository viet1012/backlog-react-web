import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { Box, GlobalStyles, Typography, useMediaQuery } from '@mui/material'
import { keyframes } from '@mui/material/styles'
import { PlaceRounded } from '@mui/icons-material'

import { useI18n } from '../../i18n/useI18n'
import { useAuth } from '../auth/useAuth'
import { getUserBadge } from '../auth/userBadge'
import { FactoryAvatar } from '../layout/FactoryAvatar'
import { FACTORY_NAME } from '../shift/shiftParts'
import { useDayPeriod } from '../shift/useDayPeriod'
import { readAvatarSeed } from '../shift/workerCharacter'
import { HOME_FONT, homeFontFaces } from './homeFonts'
import { REST_COLOR, ShiftStatus } from './ShiftStatus'
import { UserHomeTodayTasks } from './todayTasks/UserHomeTodayTasks'
import { LED } from './userHomeStyles'
import { getShiftNow } from './wall/shiftSchedule'
import { SegmentDisplay } from './warehouse/SegmentDisplay'

/*
 * Thanh đầu trang chủ: 1 bảng điều khiển LED thay cho 3 bảng treo cũ (bảng LED, việc hôm nay, thẻ nhân viên).
 * Thứ bậc: người dùng (ai) -> thời gian + ca (khi nào) -> việc hôm nay (làm gì, bấm được).
 * Bố cục theo bề rộng thanh (container query), không theo màn hình vì còn sidebar:
 *   >= 1080px: 3 cột 1 hàng | >= 640px: người dùng + giờ, việc hôm nay xuống hàng 2 | hẹp hơn: xếp dọc.
 */

const WIDE = '@container (min-width: 1080px)'
const MEDIUM = '@container (min-width: 640px)'
const DIVIDER = 'rgba(255, 255, 255, 0.08)'
const TEXT = '#eef3f9'
const MUTED = 'rgba(226, 232, 240, 0.6)'

const pad = (n: number) => String(n).padStart(2, '0')

const restGlow = keyframes`
  0%, 100% { opacity: 0.7; }
  50%      { opacity: 1; }
`

// Viền thanh khi đang nghỉ (thanh đổi theo khối giờ bên trong qua :has)
const restBorder = keyframes`
  0%, 100% { border-color: #2b333e; }
  50%      { border-color: ${LED.amber}66; }
`

function useNow() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    // Căn đúng đầu mỗi giây theo đồng hồ hệ thống
    let timer = 0
    const tick = () => {
      setNow(new Date())
      timer = window.setTimeout(tick, 1000 - (Date.now() % 1000))
    }
    timer = window.setTimeout(tick, 1000 - (Date.now() % 1000))
    return () => window.clearTimeout(timer)
  }, [])

  return now
}

function Identity() {
  const { t } = useI18n()
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const period = useDayPeriod()

  const { user: session } = useAuth()
  const username = session?.name || session?.employeeId || t.sidebar.fallbackUser
  // Badge bộ phận chỉ để hiển thị (từ /me); quyền dùng perms
  const badge = getUserBadge(session, t.sidebar)

  // Thông tin HR từ /me: hiện khi rê chuột vào khối người dùng; field nào thiếu thì ẩn
  const details = [
    [t.userHome.employeeId, session?.employeeId],
    [t.userHome.factory, session?.fac],
    [t.userHome.department, session?.dept],
    [t.userHome.section, session?.section],
    [t.userHome.line, session?.line],
    [t.userHome.group, session?.group],
  ].filter(([, value]) => Boolean(value)).map(([label, value]) => `${label}: ${value}`)

  return (
    <Box title={details.join('\n') || undefined} sx={{ gridArea: 'id', minWidth: 0, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ flexShrink: 0, p: 0.4, borderRadius: '12px', bgcolor: 'rgba(255, 255, 255, 0.06)', border: `1px solid ${DIVIDER}` }}>
        <FactoryAvatar seed={readAvatarSeed(username)} size={46} period={period} animate={!reduceMotion} />
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 600, lineHeight: 1.3, color: LED.amber }}>
          {t.sidebar.greeting[period]},
        </Typography>
        <Typography noWrap sx={{ fontFamily: 'inherit', fontSize: 17, fontWeight: 800, lineHeight: 1.25, color: TEXT }}>
          {username}
        </Typography>
        <Box sx={{ mt: 0.4, display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0, overflow: 'hidden' }}>
          <Box
            component="span"
            sx={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 0.25, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: LED.cyan, whiteSpace: 'nowrap' }}
          >
            <PlaceRounded sx={{ fontSize: 13 }} />
            {FACTORY_NAME}
          </Box>
          {badge && (
            <Box
              component="span"
              title={badge.tooltip || undefined}
              sx={{ minWidth: 0, px: 0.6, borderRadius: '4px', fontSize: 9.5, fontWeight: 800, lineHeight: 1.6, letterSpacing: '0.08em', color: MUTED, border: `1px solid ${DIVIDER}`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {badge.label}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

function ClockAndShift() {
  const { language } = useI18n()
  const now = useNow()
  const locale = language === 'vi' ? 'vi-VN' : 'en-US'

  // Bộ định dạng tạo 1 lần theo ngôn ngữ (khá tốn), không tạo lại mỗi giây
  const { weekdayFormat, dateFormat } = useMemo(() => ({
    weekdayFormat: new Intl.DateTimeFormat(locale, { weekday: 'long' }),
    dateFormat: new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }),
  }), [locale])

  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`
  // LED 7 đoạn không vẽ được "/": giữ thứ tự ngày/tháng theo ngôn ngữ, nối bằng "-"
  const dateSegments = dateFormat.formatToParts(now).filter((part) => part.type !== 'literal').map((part) => part.value).join('-')
  const shift = getShiftNow(now)
  // Giờ giải lao / nghỉ trưa: cả khối đổi sang màu nghỉ (đồng hồ, quầng sáng, viền thanh)
  const rest = shift.state.kind === 'break' || shift.state.kind === 'lunch' ? shift.state.kind : null
  const clockColor = rest ? REST_COLOR[rest] : LED.green

  return (
    <Box
      data-rest={rest ?? undefined}
      sx={{
        gridArea: 'time',
        position: 'relative',
        isolation: 'isolate',
        minWidth: 0,
        [WIDE]: { pl: 2.5, borderLeft: `1px solid ${DIVIDER}` },
        // Quầng sáng ấm phía sau khối giờ khi đang nghỉ
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: '-14px -18px',
          zIndex: -1,
          pointerEvents: 'none',
          background: `radial-gradient(ellipse at 40% 50%, ${clockColor}2e 0%, transparent 70%)`,
          opacity: rest ? 1 : 0,
          transition: 'opacity 600ms ease',
          animation: rest ? `${restGlow} 3.2s ease-in-out infinite` : 'none',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box role="timer" aria-label={time} sx={{ display: 'flex', alignItems: 'flex-end', gap: '0.25em', fontSize: 30, lineHeight: 1 }}>
          <SegmentDisplay text={time} color={clockColor} />
          <Box component="span" sx={{ fontSize: '0.42em', opacity: 0.75 }}>
            <SegmentDisplay text={pad(now.getSeconds())} color={clockColor} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
          <Typography noWrap sx={{ fontFamily: 'inherit', fontSize: 11, fontWeight: 600, lineHeight: 1, color: LED.cyan, opacity: 0.9, '&::first-letter': { textTransform: 'uppercase' } }}>
            {weekdayFormat.format(now)}
          </Typography>
          <Box role="img" aria-label={dateFormat.format(now)} sx={{ fontSize: 14, lineHeight: 1 }}>
            <SegmentDisplay text={dateSegments} color={LED.cyan} />
          </Box>
        </Box>
      </Box>

      <ShiftStatus shift={shift} now={now} />
    </Box>
  )
}

function Bolts() {
  const corners: Array<[string, string]> = [['top', 'left'], ['top', 'right'], ['bottom', 'left'], ['bottom', 'right']]
  return (
    <>
      {corners.map(([v, h]) => (
        <Box key={`${v}-${h}`} aria-hidden sx={{ position: 'absolute', [v]: 7, [h]: 7, width: 5, height: 5, borderRadius: '50%', bgcolor: '#353f4c', boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.12)' }} />
      ))}
    </>
  )
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateAreas: '"id" "time" "tasks"',
        gridTemplateColumns: 'minmax(0, 1fr)',
        alignItems: 'center',
        columnGap: 2.5,
        rowGap: 1.5,
        px: { xs: 1.75, sm: 2.25 },
        py: 1.5,
        borderRadius: '14px',
        // Lưới chấm LED + nền tối, cùng chất liệu với số LED 7 đoạn
        background: [
          'radial-gradient(circle, rgba(255, 255, 255, 0.03) 0.8px, transparent 1.2px) 0 0 / 4px 4px',
          'linear-gradient(180deg, #0c1118 0%, #07090d 100%)',
        ].join(', '),
        border: '2px solid #2b333e',
        boxShadow: '0 14px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        fontFamily: HOME_FONT,
        color: TEXT,

        // Giải lao: viền thanh nhịp sáng màu hổ phách; nghỉ trưa: viền xanh dương tĩnh
        '&:has([data-rest="break"])': {
          animation: `${restBorder} 3.2s ease-in-out infinite`,
          '@media (prefers-reduced-motion: reduce)': { animation: 'none', borderColor: `${LED.amber}66` },
        },
        '&:has([data-rest="lunch"])': { borderColor: `${LED.cyan}55` },

        [MEDIUM]: {
          gridTemplateAreas: '"id time" "tasks tasks"',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
        },
        [WIDE]: {
          gridTemplateAreas: '"id time tasks"',
          gridTemplateColumns: 'minmax(220px, auto) auto minmax(0, 1fr)',
        },
      }}
    >
      <Bolts />
      {children}
    </Box>
  )
}

// Thanh treo bảng LED từ trần xuống (bảng là 1 phần của xưởng, cùng hàng với băng rôn hai bên)
const hangerRod = {
  content: '""',
  position: 'absolute',
  bottom: '100%',
  width: 4,
  height: 60,
  borderRadius: '2px 2px 0 0',
  background: 'linear-gradient(90deg, #5d6670 0%, #c4cbd2 45%, #6b747e 100%)',
  boxShadow: '2px 0 3px rgba(0, 0, 0, 0.2)',
} as const

export function UserHomeTopBar() {
  return (
    <Box
      sx={{
        position: 'relative',
        width: 'min(1220px, 100%)',
        mx: 'auto',
        flexShrink: 0,
        containerType: 'inline-size',
        '&::before': { ...hangerRod, left: '12%' },
        '&::after': { ...hangerRod, right: '12%' },
      }}
    >
      <GlobalStyles styles={homeFontFaces} />
      <Panel>
        <Identity />
        <ClockAndShift />
        <Box sx={{ gridArea: 'tasks', minWidth: 0, [WIDE]: { pl: 2.5, borderLeft: `1px solid ${DIVIDER}` } }}>
          <UserHomeTodayTasks />
        </Box>
      </Panel>
    </Box>
  )
}

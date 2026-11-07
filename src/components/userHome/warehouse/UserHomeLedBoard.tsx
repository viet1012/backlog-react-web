import { useEffect, useState } from 'react'

import { Box, GlobalStyles, Typography } from '@mui/material'
import { keyframes } from '@mui/material/styles'
import { PlaceRounded } from '@mui/icons-material'

import { getAuthSession } from '../../../services/authService'
import { useI18n } from '../../../i18n/useI18n'
import { FACTORY_NAME, getDayPeriod } from '../../shift/shiftParts'
import { HOME_FONT, homeFontFaces } from '../homeFonts'
import { SegmentDisplay } from './SegmentDisplay'

/*
 * Bảng điện tử treo trên xích: lời chào (vàng hổ phách), đồng hồ + ngày LED 7 đoạn (SegmentDisplay),
 * dòng chữ chạy. Tick mỗi giây chỉ trong component này.
 *
 * Chữ có dấu tiếng Việt (lời chào, thứ, chữ chạy) dùng Be Vietnam Pro vì font LED không có dấu.
 * Lưới chấm LED chỉ nằm ở nền (không phủ lên chữ). Dấu ":" đứng yên, không nhấp nháy.
 * Chữ số LED rộng cố định nên số đổi không làm xô lệch bố cục.
 */
const AMBER = '#ffbe5c'
const GREEN = '#52f59a'
const CYAN = '#6fd8ff'

const tickerScroll = keyframes`
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
`

const glow = (color: string) => `0 0 10px ${color}55`

function useNow() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    // Căn đúng đầu mỗi giây để số giây và thanh vạch đổi cùng lúc với đồng hồ hệ thống
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

const pad = (n: number) => String(n).padStart(2, '0')

export function UserHomeLedBoard() {
  const { t, language } = useI18n()
  const now = useNow()

  const session = getAuthSession()
  const displayName = session?.name || session?.employeeId || 'User'
  const period = getDayPeriod(now)
  const locale = language === 'vi' ? 'vi-VN' : 'en-US'

  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(now)
  const dateFormat = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
  const dateText = dateFormat.format(now)
  // LED 7 đoạn không vẽ được "/": giữ thứ tự ngày/tháng theo ngôn ngữ, nối bằng "-"
  const dateSegments = dateFormat.formatToParts(now).filter((part) => part.type !== 'literal').map((part) => part.value).join('-')
  const timeLabel = `${pad(now.getHours())}:${pad(now.getMinutes())}`

  const ticker = `${t.userHome.brand}   •   ${FACTORY_NAME}   •   ${t.userHome.workspace}   •   ${t.userHome.pickHint}   •   `

  return (
    <Box sx={{ position: 'relative', flex: '1 1 380px', maxWidth: 620, minWidth: 0 }}>
      <GlobalStyles styles={homeFontFaces} />

      {/* Xích treo lên trần */}
      {(['left', 'right'] as const).map((side) => (
        <Box
          key={side}
          sx={{
            position: 'absolute',
            bottom: '100%',
            [side]: '12%',
            width: 4,
            height: 240,
            background: 'repeating-linear-gradient(180deg, #7b8796 0 6px, transparent 6px 9px)',
            borderLeft: '1px solid rgba(0, 0, 0, 0.25)',
          }}
        />
      ))}

      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          px: { xs: 1.6, sm: 2.2 },
          pt: 1.2,
          pb: 0.9,
          borderRadius: '12px',
          bgcolor: '#07090d',
          border: '3px solid #2b333e',
          boxShadow: '0 16px 32px rgba(0, 0, 0, 0.38), inset 0 0 26px rgba(0, 0, 0, 0.9)',
          fontFamily: HOME_FONT,

          // Lưới chấm LED chỉ ở nền, nằm dưới chữ
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.035) 0.8px, transparent 1.2px)',
            backgroundSize: '4px 4px',
          },
          '& > *': { position: 'relative' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography
            noWrap
            sx={{
              flex: 1,
              minWidth: 0,
              fontFamily: 'inherit',
              fontSize: { xs: 13.5, sm: 15 },
              fontWeight: 600,
              letterSpacing: '0.01em',
              color: AMBER,
              textShadow: glow(AMBER),
            }}
          >
            {t.sidebar.greeting[period]},{' '}
            <Box component="span" sx={{ fontWeight: 800 }}>{displayName}</Box>
          </Typography>

          {/* Biển vị trí: cùng tên nhà máy in trên cửa cuốn (logout / bảng trống) */}
          <Box
            role="img"
            aria-label={`${t.userHome.factory}: ${FACTORY_NAME}`}
            sx={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.4,
              pl: 0.5,
              pr: 0.8,
              py: 0.2,
              borderRadius: '5px',
              border: `1px solid ${CYAN}59`,
              bgcolor: `${CYAN}0f`,
              color: CYAN,
              textShadow: glow(CYAN),
            }}
          >
            <PlaceRounded sx={{ fontSize: { xs: 13, sm: 14 }, filter: `drop-shadow(0 0 4px ${CYAN}88)` }} />
            <Box component="span" sx={{ fontSize: { xs: 10, sm: 11 }, fontWeight: 800, lineHeight: 1.4, letterSpacing: '0.16em', whiteSpace: 'nowrap' }}>
              {FACTORY_NAME}
            </Box>
          </Box>
        </Box>

        <Box sx={{ mt: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          {/* Đồng hồ LED 7 đoạn HH:MM + giây nhỏ */}
          <Box
            role="timer"
            aria-label={timeLabel}
            sx={{ display: 'flex', alignItems: 'flex-end', gap: '0.3em', fontSize: { xs: 32, sm: 40 }, lineHeight: 1 }}
          >
            <SegmentDisplay text={timeLabel} color={GREEN} />
            <Box component="span" sx={{ fontSize: '0.42em', opacity: 0.8 }}>
              <SegmentDisplay text={pad(now.getSeconds())} color={GREEN} />
            </Box>
          </Box>

          {/* Thứ (chữ thường, có dấu) + ngày (LED 7 đoạn) */}
          <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.6 }}>
            <Typography noWrap sx={{ fontFamily: 'inherit', fontSize: { xs: 12, sm: 13 }, fontWeight: 600, lineHeight: 1, color: CYAN, opacity: 0.85, textShadow: glow(CYAN), '&::first-letter': { textTransform: 'uppercase' } }}>
              {weekday}
            </Typography>
            <Box role="img" aria-label={dateText} sx={{ fontSize: { xs: 15, sm: 18 }, lineHeight: 1 }}>
              <SegmentDisplay text={dateSegments} color={CYAN} />
            </Box>
          </Box>
        </Box>

        {/* Dòng chữ chạy: nội dung lặp 2 lần, trượt 50% để liền mạch */}
        <Box sx={{ mt: 0.8, pt: 0.5, overflow: 'hidden', borderTop: '1px solid rgba(255, 190, 92, 0.16)' }}>
          <Box
            sx={{
              display: 'inline-flex',
              whiteSpace: 'nowrap',
              animation: `${tickerScroll} 30s linear infinite`,
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
          >
            {[0, 1].map((copy) => (
              <Typography key={copy} component="span" aria-hidden={copy === 1} sx={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 600, letterSpacing: '0.02em', color: AMBER, opacity: 0.8, whiteSpace: 'pre' }}>
                {ticker}
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

import { useEffect, useState } from 'react'

import { Box, Typography } from '@mui/material'
import { keyframes } from '@mui/material/styles'

import { getAuthSession } from '../../../services/authService'
import { useI18n } from '../../../i18n/useI18n'
import { getDayPeriod, monoFont } from '../../shift/shiftParts'

/*
 * Bảng LED treo trên xích: lời chào (vàng hổ phách), đồng hồ (xanh lá), dòng chữ chạy.
 * Tick mỗi giây chỉ trong component này.
 */
const AMBER = '#ffb547'
const GREEN = '#4dff8f'
const CYAN = '#5fd4ff'

const colonBlink = keyframes`
  0%, 49%   { opacity: 1; }
  50%, 100% { opacity: 0.15; }
`

const tickerScroll = keyframes`
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
`

const glow = (color: string) => `0 0 4px ${color}, 0 0 12px ${color}88`

function useNow() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
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

  const dateText = new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(now)

  const ticker = `${t.userHome.brand}  ✦  ${t.userHome.workspace}  ✦  ${t.userHome.pickHint}  ✦  `

  return (
    <Box sx={{ position: 'relative', flex: '1 1 380px', maxWidth: 620, minWidth: 0 }}>
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
          pt: 1.3,
          pb: 1,
          borderRadius: '10px',
          bgcolor: '#06080c',
          border: '3px solid #2b333e',
          boxShadow: '0 16px 32px rgba(0, 0, 0, 0.38), inset 0 0 26px rgba(0, 0, 0, 0.9)',
          fontFamily: monoFont,

          // Lưới chấm LED phủ lên chữ
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, transparent 0.9px, rgba(0, 0, 0, 0.42) 1.3px)',
            backgroundSize: '3px 3px',
          },
        }}
      >
        <Typography
          noWrap
          sx={{
            fontFamily: 'inherit',
            fontSize: { xs: 13, sm: 15.5 },
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: AMBER,
            textShadow: glow(AMBER),
          }}
        >
          {t.sidebar.greeting[period]}, {displayName}
        </Typography>

        <Box sx={{ mt: 0.6, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2 }}>
          <Typography
            component="div"
            sx={{ fontFamily: 'inherit', fontSize: { xs: 32, sm: 40 }, fontWeight: 700, lineHeight: 1, color: GREEN, textShadow: glow(GREEN) }}
          >
            {pad(now.getHours())}
            <Box component="span" sx={{ animation: `${colonBlink} 1s steps(1) infinite`, '@media (prefers-reduced-motion: reduce)': { animation: 'none' } }}>:</Box>
            {pad(now.getMinutes())}
            <Box component="span" sx={{ ml: 0.5, fontSize: '0.45em', opacity: 0.8 }}>{pad(now.getSeconds())}</Box>
          </Typography>
          <Typography noWrap sx={{ fontFamily: 'inherit', fontSize: { xs: 12, sm: 13.5 }, fontWeight: 700, color: CYAN, textShadow: glow(CYAN), textTransform: 'uppercase' }}>
            {dateText}
          </Typography>
        </Box>

        {/* Dòng chữ chạy: nội dung lặp 2 lần, trượt 50% để liền mạch */}
        <Box sx={{ mt: 0.8, pt: 0.5, overflow: 'hidden', borderTop: '1px solid rgba(255, 181, 71, 0.18)' }}>
          <Box
            sx={{
              display: 'inline-flex',
              whiteSpace: 'nowrap',
              animation: `${tickerScroll} 26s linear infinite`,
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
          >
            {[0, 1].map((copy) => (
              <Typography key={copy} component="span" aria-hidden={copy === 1} sx={{ fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: AMBER, opacity: 0.85, textShadow: glow(AMBER) }}>
                {ticker}
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

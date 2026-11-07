import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

import { Box, Tooltip, Typography, useMediaQuery } from '@mui/material'
import { keyframes } from '@mui/material/styles'
import { LockOutlined } from '@mui/icons-material'

import { useI18n } from '../../../i18n/useI18n'
import { getGroupColor } from '../../layout/sidebarConfig'
import { C, INK, SIGN_FAMILY } from '../factoryScene/primitives'
import type { HomeMenuEntry } from '../userHomeMenu'
import { CRATE_DEPTH, CRATE_RATIO } from './crateLayout'

/*
 * Thùng hàng 3D bằng CSS: mặt trước ở z = 0, nóc + 2 hông lùi vào trong (z âm).
 * Phải nằm trong chuỗi preserve-3d dưới một phần tử có `perspective` (ô kệ).
 * Không dùng opacity / overflow trên các lớp bọc vì sẽ làm phẳng 3D.
 */
export type CrateKind = 'ready' | 'upcoming' | 'locked'

// Thời gian thùng trượt ra trước khi chuyển trang
const PICK_MS = 380

const crateDrop = keyframes`
  0%   { visibility: hidden; transform: translate3d(0, -80px, 0); }
  1%   { visibility: visible; }
  62%  { transform: translate3d(0, 5px, 0); }
  82%  { transform: translate3d(0, -2px, 0); }
  100% { transform: translate3d(0, 0, 0); }
`

const SKINS = {
  carton: {
    light: { front: 'linear-gradient(180deg, #dcab72 0%, #c78d53 100%)', top: '#e9c08c', side: '#a9743f' },
    dark: { front: 'linear-gradient(180deg, #b88752 0%, #976a3b 100%)', top: '#c99a63', side: '#7a522c' },
  },
  tote: {
    light: { front: 'linear-gradient(180deg, #8b98a7 0%, #6b7786 100%)', top: '#a3afbd', side: '#56616e' },
    dark: { front: 'linear-gradient(180deg, #5d6876 0%, #47515d 100%)', top: '#6f7a88', side: '#38414b' },
  },
}

// Băng keo dán thùng (dọc giữa mặt trước / nóc)
const TAPE = 'rgba(255, 238, 205, 0.42)'
// Màng co bọc hàng chưa mở
const FILM = 'linear-gradient(115deg, transparent 18%, rgba(255, 255, 255, 0.34) 28%, rgba(255, 255, 255, 0.06) 42%, rgba(255, 255, 255, 0.26) 58%, transparent 72%), rgba(205, 225, 245, 0.10)'

const faceSx = {
  position: 'absolute',
  backfaceVisibility: 'hidden',
  boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.14)',
} as const

interface CrateBodyProps {
  w: number
  h: number
  kind: CrateKind
  dark: boolean
  children: ReactNode
}

function CrateBody({ w, h, kind, dark, children }: CrateBodyProps) {
  const d = Math.round(w * CRATE_DEPTH)
  const skin = SKINS[kind === 'locked' ? 'tote' : 'carton'][dark ? 'dark' : 'light']
  const carton = kind !== 'locked'

  return (
    <Box sx={{ position: 'relative', width: w, height: h, transformStyle: 'preserve-3d' }}>
      {/* Nóc */}
      <Box
        sx={{
          ...faceSx,
          left: 0,
          top: -d,
          width: '100%',
          height: d,
          transformOrigin: 'bottom',
          transform: 'rotateX(90deg)',
          background: [
            carton ? `linear-gradient(90deg, transparent 42%, ${TAPE} 42% 58%, transparent 58%)` : '',
            kind === 'upcoming' ? FILM : '',
            skin.top,
          ].filter(Boolean).join(', '),
        }}
      />
      {/* Hông phải / trái: chỉ mặt nào quay về người xem mới hiện */}
      <Box sx={{ ...faceSx, top: 0, left: w, width: d, height: '100%', transformOrigin: 'left', transform: 'rotateY(90deg)', background: skin.side }} />
      <Box sx={{ ...faceSx, top: 0, left: -d, width: d, height: '100%', transformOrigin: 'right', transform: 'rotateY(-90deg)', background: skin.side }} />
      {/* Mặt trước */}
      <Box className="crate-front" sx={{ ...faceSx, inset: 0, background: skin.front, borderRadius: '2px' }}>
        {children}
      </Box>
    </Box>
  )
}

interface UserHomeCrateProps {
  entry: HomeMenuEntry
  kind: CrateKind
  size: number
  delayMs: number
  dark: boolean
}

export function UserHomeCrate({ entry, kind, size, delayMs, dark }: UserHomeCrateProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [picked, setPicked] = useState(false)
  const timerRef = useRef(0)

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const { item, groupId } = entry
  const w = size
  const h = Math.round(size / CRATE_RATIO)
  const color = getGroupColor(groupId, dark ? 'dark' : 'light')
  const label = t.nav[item.labelKey]
  const hint = t.userHome.pageHints[item.labelKey]
  const roles = (item.roles ?? []).join(' / ')
  const statusLabel = item.status === 'developing'
    ? t.sidebar.developing
    : item.status === 'todo'
      ? t.sidebar.notStarted
      : t.sidebar.comingSoon

  // Cỡ chữ / chi tiết co theo kích thước thùng
  const font = Math.max(10, Math.min(15, w * 0.075))
  const showHint = Boolean(hint) && w >= 185
  const showMarks = w >= 140

  // Thùng trượt ra rồi mới chuyển trang; Ctrl/Shift/chuột giữa giữ hành vi link mặc định
  function handlePick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    if (picked) return
    if (reduceMotion) {
      navigate(item.path)
      return
    }
    setPicked(true)
    timerRef.current = window.setTimeout(() => navigate(item.path), PICK_MS)
  }

  let front: ReactNode
  if (kind === 'ready') {
    front = (
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', p: `${Math.round(w * 0.06)}px` }}>
        <Box sx={{ position: 'absolute', left: '42%', width: '16%', top: 0, height: '24%', bgcolor: TAPE }} />
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: font }}>
          {showMarks && (
            <Typography sx={{ fontSize: font * 0.85, fontWeight: 900, lineHeight: 1, color: 'rgba(60, 35, 10, 0.45)' }}>↑↑</Typography>
          )}
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#3ee07a', boxShadow: '0 0 6px #3ee07a' }} />
            <Typography sx={{ fontSize: Math.max(8.5, font * 0.62), fontWeight: 900, letterSpacing: '0.12em', color: 'rgba(50, 28, 8, 0.6)' }}>
              {item.action === 'input' ? t.sidebar.input.toUpperCase() : t.sidebar.view.toUpperCase()}
            </Typography>
          </Box>
        </Box>
        {/* Biểu tượng in trên thùng */}
        <Box sx={{ flex: 1, minHeight: 0, display: 'grid', placeItems: 'center', color, '& svg': { fontSize: w * 0.2, filter: 'drop-shadow(0 1px 0 rgba(255, 255, 255, 0.35))' } }}>
          {item.icon}
        </Box>
        {/* Nhãn dán */}
        <Box sx={{ px: 0.9, py: 0.5, borderRadius: '3px', bgcolor: '#fbfaf4', borderLeft: `4px solid ${color}`, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.25)' }}>
          <Typography noWrap sx={{ fontSize: font, fontWeight: 800, lineHeight: 1.25, color: '#1d2733' }}>
            {label}
          </Typography>
          {showHint && (
            <Typography noWrap sx={{ fontSize: font * 0.74, lineHeight: 1.3, color: '#5b6774' }}>
              {hint}
            </Typography>
          )}
        </Box>
      </Box>
    )
  } else if (kind === 'upcoming') {
    front = (
      <>
        <Box sx={{ position: 'absolute', left: '42%', width: '16%', top: 0, height: '22%', bgcolor: TAPE }} />
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pb: '24%', px: 0.6 }}>
          <Typography
            sx={{
              maxWidth: '100%',
              fontFamily: SIGN_FAMILY,
              fontSize: Math.max(11, Math.min(20, w * 0.13)),
              lineHeight: 1.05,
              textAlign: 'center',
              letterSpacing: '0.03em',
              color: 'rgba(50, 28, 8, 0.78)',
              transform: 'rotate(-3deg)',
              wordBreak: 'break-word',
            }}
          >
            {label}
          </Typography>
        </Box>
        {/* Băng keo vàng ghi trạng thái */}
        <Box
          sx={{
            position: 'absolute',
            left: '-3%',
            right: '-3%',
            top: '58%',
            height: '22%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: C.yellow,
            borderTop: `1px solid ${INK}`,
            borderBottom: `1px solid ${INK}`,
            transform: 'rotate(-2deg)',
          }}
        >
          <Typography noWrap sx={{ fontFamily: SIGN_FAMILY, fontSize: Math.max(8, Math.min(13, w * 0.085)), letterSpacing: '0.08em', color: INK, textTransform: 'uppercase' }}>
            {statusLabel}
          </Typography>
        </Box>
        <Box sx={{ position: 'absolute', inset: 0, background: FILM, pointerEvents: 'none' }} />
      </>
    )
  } else {
    front = (
      <>
        {/* Gân thùng nhựa + lỗ tay cầm */}
        <Box sx={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.07) 0 2px, transparent 2px 12px)' }} />
        <Box sx={{ position: 'absolute', left: '33%', width: '34%', top: '9%', height: '11%', borderRadius: 999, bgcolor: 'rgba(10, 16, 24, 0.55)' }} />
        <Box sx={{ position: 'absolute', left: '12%', right: '12%', top: '32%', bottom: '14%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.3, px: 0.6, borderRadius: '3px', bgcolor: 'rgba(240, 244, 248, 0.88)' }}>
          <Box sx={{ display: 'grid', color: '#6b7684', '& svg': { fontSize: Math.max(14, w * 0.14) } }}>{item.icon}</Box>
          <Typography noWrap sx={{ maxWidth: '100%', fontSize: font * 0.9, fontWeight: 800, color: '#3d4753' }}>
            {label}
          </Typography>
        </Box>
        {/* Thẻ đỏ treo góc: vai trò cần có */}
        <Box
          sx={{
            position: 'absolute',
            top: '-6%',
            right: '-8%',
            display: 'flex',
            alignItems: 'center',
            gap: 0.3,
            px: 0.7,
            py: 0.25,
            borderRadius: '3px',
            bgcolor: C.red,
            color: '#fff',
            border: `1px solid ${INK}`,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            transform: 'rotate(8deg)',
          }}
        >
          <LockOutlined sx={{ fontSize: Math.max(10, font * 0.8) }} />
          <Typography sx={{ fontSize: Math.max(8.5, font * 0.68), fontWeight: 900, whiteSpace: 'nowrap' }}>{roles}</Typography>
        </Box>
      </>
    )
  }

  const body = <CrateBody w={w} h={h} kind={kind} dark={dark}>{front}</CrateBody>

  let content: ReactNode
  if (kind === 'ready') {
    content = (
      <Box
        component={RouterLink}
        to={item.path}
        onClick={handlePick}
        aria-label={hint ? `${label} — ${hint}` : label}
        data-picked={picked || undefined}
        sx={{
          position: 'relative',
          display: 'block',
          transformStyle: 'preserve-3d',
          transform: 'translate3d(0, 0, 0)',
          transition: `transform ${PICK_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          cursor: 'pointer',
          outline: 'none',

          // Đèn rọi xuống thùng khi rê chuột
          '& .crate-spot': {
            position: 'absolute',
            left: '50%',
            bottom: '100%',
            width: w * 1.5,
            height: h * 1.3,
            transform: 'translateX(-50%)',
            clipPath: 'polygon(43% 0, 57% 0, 100% 100%, 0 100%)',
            background: 'linear-gradient(180deg, rgba(255, 228, 160, 0) 0%, rgba(255, 228, 160, 0.42) 100%)',
            opacity: 0,
            transition: 'opacity 220ms ease',
            pointerEvents: 'none',
          },
          '& .crate-front': { transition: 'filter 220ms ease' },

          '&:hover, &:focus-visible': {
            transform: 'translate3d(0, -5px, 38px)',
            '& .crate-spot': { opacity: 1 },
            '& .crate-front': { filter: 'brightness(1.12)' },
          },
          '&:focus-visible .crate-front': { outline: `3px solid ${C.yellow}`, outlineOffset: 3 },

          // Lấy hàng: thùng trượt mạnh ra phía người xem
          '&[data-picked]': {
            transform: 'translate3d(0, -12%, 200px) rotateX(-6deg)',
          },

          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }}
      >
        <Box className="crate-spot" />
        {body}
      </Box>
    )
  } else {
    content = (
      <Tooltip
        arrow
        title={kind === 'locked' ? `${label} · ${t.userHome.requires(roles)}` : `${label} · ${statusLabel}`}
      >
        <Box
          tabIndex={0}
          aria-label={kind === 'locked' ? `${label}, ${t.userHome.requires(roles)}` : `${label}, ${statusLabel}`}
          sx={{ position: 'relative', transformStyle: 'preserve-3d', outline: 'none', '&:focus-visible .crate-front': { outline: `3px solid ${C.yellow}`, outlineOffset: 3 } }}
        >
          {body}
        </Box>
      </Tooltip>
    )
  }

  // Lớp ngoài: hàng "được thả" xuống kệ lúc vào trang (tách khỏi transform hover ở lớp trong)
  return (
    <Box
      sx={{
        transformStyle: 'preserve-3d',
        animation: `${crateDrop} 640ms cubic-bezier(0.3, 0.9, 0.4, 1) ${delayMs}ms both`,
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      }}
    >
      {content}
    </Box>
  )
}

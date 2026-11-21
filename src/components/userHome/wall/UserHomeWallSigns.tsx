import { useEffect, useId, useState, type ReactNode } from 'react'

import { Box } from '@mui/material'

import { useI18n } from '../../../i18n/useI18n'
import { INK } from '../factoryScene/primitives'
import { HOME_FONT } from '../homeFonts'
import { hazardStripes } from '../userHomeStyles'

/*
 * Băng rôn hai bên kệ hàng (nằm trong nền, không nhận chuột), treo trước cột thép:
 * trái = "An toàn là trên hết / 安全第一", phải = "Thực hiện tốt 5S".
 * Khổ ngang đúng tỉ lệ băng rôn thật trong xưởng (~1,4 : 1): logo + MiSUMi bên trái, khẩu hiệu 1 dòng
 * chữ đứng navy, dòng dưới cỡ lớn, sọc vàng + dải navy in hoa văn logo mờ, khoen 4 góc, vải hơi nhăn.
 * Bề rộng co theo khoảng trống bên cạnh khối nội dung; hẹp quá thì ẩn hẳn (container query).
 */

// Bề rộng khối nội dung trang chủ (thanh trên / kệ hàng): min(1220px, 100%)
const CONTENT_WIDTH = 1220
const MIN_BANNER = 132
const MAX_BANNER = 300
// Lề mỗi bên băng rôn trong khoảng trống
const SIDE_GAP = 12
const WALL_SIGNS_MIN_WIDTH = CONTENT_WIDTH + 2 * (MIN_BANNER + 2 * SIDE_GAP)

// Hệ toạ độ của băng rôn (tỉ lệ như băng rôn thật)
const W = 340
const H = 241
const BAND_Y = 209
const TITLE = { x: 100, y: 117, width: 229, size: 34, stretch: 2.2 }
const NAVY = '#241f63'
const BAND_NAVY = '#211b5c'
const LOGO = { blue: '#2563c4', yellow: '#f5d21f', white: '#ffffff' }
const JP_FONT = '"Yu Gothic UI", "Yu Gothic", Meiryo, "Noto Sans JP", sans-serif'
const FIVE_S_KANJI = ['整理', '整頓', '清掃', '清潔', '躾']

let measureCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null | undefined
function measureText(text: string, font: string) {
  measureCtx ??= typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(1, 1).getContext('2d')
    : typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null
  if (!measureCtx) return 0
  measureCtx.font = font
  return measureCtx.measureText(text).width
}

// Bề rộng tự nhiên của chữ; đo lại khi font đã tải xong
function useTextWidth(text: string, font: string) {
  const [measured, setMeasured] = useState(() => ({ text, font, width: measureText(text, font) }))
  const width = measured.text === text && measured.font === font ? measured.width : measureText(text, font)

  useEffect(() => {
    let alive = true
    document.fonts?.load(font, text)
      .then(() => {
        if (alive) setMeasured({ text, font, width: measureText(text, font) })
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [text, font])

  return width
}

interface FitTextProps {
  text: string
  x: number
  y: number
  maxWidth: number
  size: number
  // Kéo cao chữ (chữ đứng kiểu băng rôn)
  stretch?: number
  anchor?: 'start' | 'middle'
  fill?: string
}

// Chữ dài hơn maxWidth thì ép ngang cho vừa, ngắn hơn thì giữ nguyên
function FitText({ text, x, y, maxWidth, size, stretch = 1, anchor = 'start', fill = NAVY }: FitTextProps) {
  const width = useTextWidth(text, `800 ${size}px ${HOME_FONT}`)
  const squeeze = width > maxWidth ? maxWidth / width : 1

  return (
    <text
      transform={`translate(${x} ${y}) scale(${squeeze.toFixed(4)} ${stretch})`}
      textAnchor={anchor}
      fontFamily={HOME_FONT}
      fontWeight={800}
      fontSize={size}
      fill={fill}
    >
      {text}
    </text>
  )
}

// Logo 2 khối (nóc xanh, mặt trắng, hông vàng), khung 76 x 74
function LogoBlocks({ outline = true, mono }: { outline?: boolean; mono?: string }) {
  const stroke = outline ? { stroke: INK, strokeWidth: 3.4, strokeLinejoin: 'round' as const } : {}
  const fill = (color: string) => mono ?? color

  return (
    <g {...stroke}>
      {/* Khối cao phía sau */}
      <polygon points="46,10 58,3 74,12 62,19" fill={fill(LOGO.blue)} />
      <polygon points="46,10 62,19 62,62 46,53" fill={fill(LOGO.white)} />
      <polygon points="62,19 74,12 74,55 62,62" fill={fill(LOGO.yellow)} />
      {/* Khối thấp phía trước */}
      <polygon points="2,24 16,16 46,32 32,40" fill={fill(LOGO.blue)} />
      <polygon points="2,24 32,40 32,72 2,56" fill={fill(LOGO.white)} />
      <polygon points="32,40 46,32 46,64 32,72" fill={fill(LOGO.yellow)} />
    </g>
  )
}

interface SignBannerProps {
  dark: boolean
  title: string
  label: string
  // Phần dưới khẩu hiệu (y ~ 135..200)
  children: ReactNode
}

function SignBanner({ dark, title, label, children }: SignBannerProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const grommets = [[6, 6], [W - 6, 6], [6, H - 6], [W - 6, H - 6]]

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        filter: dark
          ? 'brightness(0.76) saturate(0.92) drop-shadow(0 6px 10px rgba(0, 0, 0, 0.45))'
          : 'drop-shadow(0 5px 8px rgba(30, 45, 65, 0.22))',
      }}
    >
      {/* Dây treo từ giàn mái xuống 2 khoen trên */}
      {[6, W - 6].map((x) => (
        <Box
          key={x}
          sx={{
            position: 'absolute',
            bottom: `calc(100% - ${(6 / H) * 100}%)`,
            left: `${(x / W) * 100}%`,
            width: '1px',
            height: 600,
            bgcolor: dark ? 'rgba(160, 185, 210, 0.4)' : 'rgba(60, 80, 100, 0.5)',
          }}
        />
      ))}

      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} style={{ display: 'block' }}>
        <defs>
          {/* Nếp vải nhăn nhẹ */}
          <linearGradient id={`${id}-cloth`} x1="0" y1="0" x2="1" y2="0.4">
            <stop offset="0" stopColor="#000" stopOpacity="0.05" />
            <stop offset="0.25" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.45" stopColor="#000" stopOpacity="0.04" />
            <stop offset="0.62" stopColor="#fff" stopOpacity="0.12" />
            <stop offset="0.82" stopColor="#000" stopOpacity="0.05" />
            <stop offset="1" stopColor="#000" stopOpacity="0.02" />
          </linearGradient>
          {/* Hoa văn logo mờ trên dải navy */}
          <pattern id={`${id}-band`} width="38" height={H - BAND_Y} patternUnits="userSpaceOnUse" x="6" y={BAND_Y}>
            <g transform="translate(9 6) scale(0.26)" opacity="0.2">
              <LogoBlocks outline={false} mono="#9c98e0" />
            </g>
          </pattern>
        </defs>

        <rect width={W} height={H} fill="#fbfbf7" />

        {/* Logo + MiSUMi góc trái */}
        <g transform="translate(36 17) scale(0.6)">
          <LogoBlocks />
        </g>
        <FitText text="MiSUMi" x={24} y={93} maxWidth={64} size={24} fill="#111" />

        {/* Khẩu hiệu 1 dòng, chữ đứng */}
        <FitText text={title} x={TITLE.x} y={TITLE.y} maxWidth={TITLE.width} size={TITLE.size} stretch={TITLE.stretch} />

        {children}

        {/* Sọc vàng + dải navy */}
        <rect y={BAND_Y - 8} width={W} height={8} fill="#f2e600" />
        <rect y={BAND_Y} width={W} height={H - BAND_Y} fill={BAND_NAVY} />
        <rect y={BAND_Y} width={W} height={H - BAND_Y} fill={`url(#${id}-band)`} />

        <rect width={W} height={H} fill={`url(#${id}-cloth)`} />
        <rect x={1.25} y={1.25} width={W - 2.5} height={H - 2.5} fill="none" stroke="#15131f" strokeWidth={2.5} />

        {/* Khoen kim loại */}
        {grommets.map(([cx, cy]) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r={3.6} fill="#c9ced6" stroke="#6b7480" strokeWidth={0.9} />
            <circle cx={cx} cy={cy} r={1.5} fill="#3b4250" />
          </g>
        ))}
      </svg>
    </Box>
  )
}

function SafetyBanner({ dark }: { dark: boolean }) {
  const { t } = useI18n()
  const title = t.userHome.wall.safety

  return (
    <SignBanner dark={dark} title={title} label={`${title} · 安全第一`}>
      <text x={184} y={191} textAnchor="middle" fontFamily={JP_FONT} fontWeight={500} fontSize={52} letterSpacing={4} fill={NAVY}>
        安全第一
      </text>
    </SignBanner>
  )
}

function FiveSBanner({ dark }: { dark: boolean }) {
  const { t } = useI18n()
  const { fiveSTitle, fiveS } = t.userHome.wall
  const columnWidth = 62

  return (
    <SignBanner dark={dark} title={fiveSTitle} label={`${fiveSTitle}: ${fiveS.join(', ')}`}>
      {fiveS.map((word, index) => {
        const cx = 22 + columnWidth / 2 + index * columnWidth
        return (
          <g key={word}>
            <text x={cx} y={168} textAnchor="middle" fontFamily={JP_FONT} fontWeight={500} fontSize={28} fill={NAVY}>
              {FIVE_S_KANJI[index]}
            </text>
            <FitText text={word} x={cx} y={190} maxWidth={columnWidth - 6} size={12} anchor="middle" />
          </g>
        )
      })}
    </SignBanner>
  )
}

// Cột thép đứng từ trần xuống sàn, chân cột quấn sọc cảnh báo
function Pillar({ dark }: { dark: boolean }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '50%',
        width: 22,
        transform: 'translateX(-50%)',
        background: dark
          ? 'linear-gradient(90deg, #0d1828 0%, #1c2d44 45%, #13223a 100%)'
          : 'linear-gradient(90deg, #8496aa 0%, #b3c1cf 45%, #95a6b8 100%)',
        boxShadow: dark ? 'inset 0 0 0 1px rgba(140, 190, 230, 0.08)' : 'inset 0 0 0 1px rgba(40, 60, 85, 0.12)',
        '&::after': {
          content: '""',
          position: 'absolute',
          left: -3,
          right: -3,
          bottom: 0,
          height: 40,
          background: hazardStripes(5),
          opacity: dark ? 0.6 : 0.8,
        },
      }}
    />
  )
}

function Column({ side, horizon, dark, children }: { side: 'left' | 'right'; horizon: number; dark: boolean; children: ReactNode }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        bottom: `${100 - horizon}%`,
        // Băng rôn rộng theo khoảng trống bên cạnh khối nội dung (cqw = bề rộng khung nền)
        width: `clamp(${MIN_BANNER}px, calc((100cqw - ${CONTENT_WIDTH}px) / 2 - ${2 * SIDE_GAP}px), ${MAX_BANNER}px)`,
        // Giữa khoảng trống bên cạnh khối nội dung
        [side]: `calc((100% - ${CONTENT_WIDTH}px) / 4)`,
        transform: `translateX(${side === 'left' ? -50 : 50}%)`,
        display: 'none',
        [`@container (min-width: ${WALL_SIGNS_MIN_WIDTH}px)`]: { display: 'block' },
      }}
    >
      <Pillar dark={dark} />
      <Box sx={{ position: 'absolute', top: '24%', left: 0, right: 0 }}>
        {children}
      </Box>
    </Box>
  )
}

export function UserHomeWallSigns({ dark, horizon }: { dark: boolean; horizon: number }) {
  return (
    <>
      <Column side="left" horizon={horizon} dark={dark}>
        <SafetyBanner dark={dark} />
      </Column>
      <Column side="right" horizon={horizon} dark={dark}>
        <FiveSBanner dark={dark} />
      </Column>
    </>
  )
}

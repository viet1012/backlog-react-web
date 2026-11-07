import { Box } from '@mui/material'

/*
 * Chữ số LED 7 đoạn vẽ bằng SVG (không cần font). Đoạn tắt vẫn hiện mờ như bảng LED thật.
 * Kích thước theo font-size của phần tử cha: chữ số cao 1em.
 * Hỗ trợ: 0-9, "E", "r", "-", " ", ":" (2 chấm), "." (1 chấm).
 */
const W = 60
const H = 100
// Độ dày đoạn / khe hở giữa các đoạn (đơn vị viewBox)
const T = 11
const G = 1.6

type Segment = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g'

function horizontal(cy: number) {
  const x0 = T / 2 + G
  const x1 = W - T / 2 - G
  return `${x0},${cy} ${x0 + T / 2},${cy - T / 2} ${x1 - T / 2},${cy - T / 2} ${x1},${cy} ${x1 - T / 2},${cy + T / 2} ${x0 + T / 2},${cy + T / 2}`
}

function vertical(cx: number, top: number, bottom: number) {
  const y0 = top + G
  const y1 = bottom - G
  return `${cx},${y0} ${cx + T / 2},${y0 + T / 2} ${cx + T / 2},${y1 - T / 2} ${cx},${y1} ${cx - T / 2},${y1 - T / 2} ${cx - T / 2},${y0 + T / 2}`
}

const SEGMENTS: Record<Segment, string> = {
  a: horizontal(T / 2),
  b: vertical(W - T / 2, T / 2, H / 2),
  c: vertical(W - T / 2, H / 2, H - T / 2),
  d: horizontal(H - T / 2),
  e: vertical(T / 2, H / 2, H - T / 2),
  f: vertical(T / 2, T / 2, H / 2),
  g: horizontal(H / 2),
}

const ALL = Object.keys(SEGMENTS) as Segment[]

const LIT: Record<string, Segment[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'g', 'e', 'd'],
  '3': ['a', 'b', 'g', 'c', 'd'],
  '4': ['f', 'g', 'b', 'c'],
  '5': ['a', 'f', 'g', 'c', 'd'],
  '6': ['a', 'f', 'g', 'e', 'd', 'c'],
  '7': ['a', 'b', 'c'],
  '8': ALL,
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
  '-': ['g'],
  ' ': [],
  // Chữ cho mã lỗi "Err" (bảng trống / lỗi API)
  E: ['a', 'f', 'g', 'e', 'd'],
  r: ['e', 'g'],
}

// Độ sáng của đoạn tắt
const GHOST = 0.08

function Digit({ char }: { char: string }) {
  const lit = LIT[char] ?? []
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="0.6em" height="1em" aria-hidden style={{ display: 'block', overflow: 'visible' }}>
      {ALL.map((segment) => (
        <polygon key={segment} points={SEGMENTS[segment]} fill="currentColor" opacity={lit.includes(segment) ? 1 : GHOST} />
      ))}
    </svg>
  )
}

function Dots({ count }: { count: 1 | 2 }) {
  const r = T * 0.55
  return (
    <svg viewBox={`0 0 ${T * 2} ${H}`} width="0.22em" height="1em" aria-hidden style={{ display: 'block', overflow: 'visible' }}>
      {count === 2 ? (
        <>
          <circle cx={T} cy={H * 0.3} r={r} fill="currentColor" />
          <circle cx={T} cy={H * 0.7} r={r} fill="currentColor" />
        </>
      ) : (
        <circle cx={T} cy={H - r} r={r} fill="currentColor" />
      )}
    </svg>
  )
}

interface SegmentDisplayProps {
  text: string
  color: string
}

export function SegmentDisplay({ text, color }: SegmentDisplayProps) {
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        display: 'inline-flex',
        alignItems: 'flex-end',
        gap: '0.1em',
        color,
        // Nghiêng nhẹ như bảng LED thật + phát sáng
        transform: 'skewX(-6deg)',
        filter: `drop-shadow(0 0 0.08em ${color}aa)`,
      }}
    >
      {Array.from(text).map((char, i) => (
        char === ':' ? <Dots key={i} count={2} />
          : char === '.' ? <Dots key={i} count={1} />
            : <Digit key={i} char={char} />
      ))}
    </Box>
  )
}

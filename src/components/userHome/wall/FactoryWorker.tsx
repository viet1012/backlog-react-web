import { keyframes } from '@mui/material/styles'

/*
 * Công nhân (đồng phục xanh, mũ, khẩu trang như xưởng thật), vẽ trong SVG của cụm máy, nhìn nghiêng quay sang phải.
 * Toạ độ local: gốc ở giữa 2 bàn chân, cao ~98 đơn vị (máy CNC cao ~122).
 * Chuyển động nhỏ, chỉ transform (xoay tay / cúi người / gật đầu); CSS đặt ở khung cha qua workerMotionSx.
 *   panel: đứng bấm bảng điều khiển máy
 *   pick : cúi người, tay cầm máy quét kiểm thùng hàng trên băng chuyền
 */

const COLORS = {
  shirt: '#2466b8',
  shirtDark: '#1b4f92',
  pants: '#1d4a86',
  pantsDark: '#163a6b',
  shoe: '#1b1f26',
  // Nón xanh (cùng tông đồng phục, đậm hơn áo một chút để tách khỏi vai)
  cap: '#1d5fb8',
  skin: '#e9b98f',
  mask: '#e3e9ef',
}

const press = keyframes`
  0%, 100% { transform: rotate(0deg); }
  20%      { transform: rotate(-9deg); }
  30%      { transform: rotate(2deg); }
  45%      { transform: rotate(-6deg); }
  55%      { transform: rotate(1deg); }
`

const nod = keyframes`
  0%, 100% { transform: rotate(0deg); }
  50%      { transform: rotate(4deg); }
`

const lean = keyframes`
  0%, 100% { transform: rotate(2deg); }
  45%, 60% { transform: rotate(12deg); }
`

const reach = keyframes`
  0%, 100% { transform: rotate(-18deg); }
  45%, 60% { transform: rotate(8deg); }
`

const scanBeam = keyframes`
  0%, 40%, 70%, 100% { opacity: 0; }
  48%, 62%           { opacity: 0.9; }
`

// Đặt vào sx của phần tử bao SVG (tắt khi giảm chuyển động: khung bao lo)
export const workerMotionSx = {
  '& .worker-press': { transformBox: 'fill-box', transformOrigin: '0% 100%', animation: `${press} 3.4s ease-in-out infinite` },
  '& .worker-nod': { transformBox: 'fill-box', transformOrigin: '50% 100%', animation: `${nod} 3.4s ease-in-out infinite` },
  '& .worker-lean': { transformBox: 'fill-box', transformOrigin: '50% 100%', animation: `${lean} 4.2s ease-in-out infinite` },
  '& .worker-reach': { transformBox: 'fill-box', transformOrigin: '0% 0%', animation: `${reach} 4.2s ease-in-out infinite` },
  '& .worker-scan': { animation: `${scanBeam} 4.2s linear infinite` },
} as const

function Head() {
  return (
    <g className="worker-nod">
      <rect x={-2} y={-84} width={5} height={5} fill={COLORS.skin} />
      <circle cx={1} cy={-90} r={7.5} fill={COLORS.skin} />
      {/* Khẩu trang + quai */}
      <rect x={2} y={-89} width={7} height={5.5} rx={2} fill={COLORS.mask} />
      <line x1={-2} y1={-88} x2={2} y2={-87} stroke={COLORS.mask} strokeWidth={0.8} />
      {/* Mũ + lưỡi trai */}
      <path d="M-7 -91 a8 8 0 0 1 16 0 Z" fill={COLORS.cap} />
      <rect x={7} y={-93} width={7} height={2.6} rx={1.2} fill={COLORS.cap} />
    </g>
  )
}

interface FactoryWorkerProps {
  x: number
  y: number
  pose: 'panel' | 'pick'
  scale?: number
  dark?: boolean
}

export function FactoryWorker({ x, y, pose, scale = 1, dark = false }: FactoryWorkerProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} style={dark ? { filter: 'brightness(0.92) sepia(0.08)' } : undefined}>
      <ellipse cx={1} cy={0} rx={13} ry={2.6} fill="rgba(0, 0, 0, 0.28)" />

      {/* Chân + giày */}
      <rect x={-6} y={-46} width={7} height={43} rx={2} fill={COLORS.pantsDark} />
      <rect x={0} y={-46} width={7} height={43} rx={2} fill={COLORS.pants} />
      <rect x={-8} y={-4} width={10} height={4} rx={1.5} fill={COLORS.shoe} />
      <rect x={0} y={-4} width={11} height={4} rx={1.5} fill={COLORS.shoe} />

      {pose === 'panel' ? (
        <g>
          {/* Tay sau */}
          <line x1={-2} y1={-74} x2={2} y2={-52} stroke={COLORS.shirtDark} strokeWidth={6} strokeLinecap="round" />
          <rect x={-9} y={-80} width={19} height={37} rx={5} fill={COLORS.shirt} />
          <rect x={-9} y={-47} width={19} height={3} fill={COLORS.shirtDark} />
          <Head />
          {/* Tay trước: cánh tay trên + cẳng tay bấm nút */}
          <line x1={3} y1={-75} x2={9} y2={-59} stroke={COLORS.shirt} strokeWidth={6} strokeLinecap="round" />
          <g className="worker-press">
            <line x1={9} y1={-59} x2={22} y2={-66} stroke={COLORS.shirt} strokeWidth={5.5} strokeLinecap="round" />
            <circle cx={23.5} cy={-66.5} r={2.6} fill={COLORS.skin} />
          </g>
        </g>
      ) : (
        <g className="worker-lean">
          <line x1={-2} y1={-74} x2={4} y2={-54} stroke={COLORS.shirtDark} strokeWidth={6} strokeLinecap="round" />
          <rect x={-9} y={-80} width={19} height={37} rx={5} fill={COLORS.shirt} />
          <rect x={-9} y={-47} width={19} height={3} fill={COLORS.shirtDark} />
          <Head />
          {/* Tay trước cầm máy quét, tia quét đỏ khi cúi xuống thùng */}
          <g className="worker-reach">
            <line x1={3} y1={-75} x2={12} y2={-62} stroke={COLORS.shirt} strokeWidth={6} strokeLinecap="round" />
            <line x1={12} y1={-62} x2={21} y2={-54} stroke={COLORS.shirt} strokeWidth={5.5} strokeLinecap="round" />
            <circle cx={22} cy={-53} r={2.6} fill={COLORS.skin} />
            <rect x={21} y={-58} width={7} height={4.5} rx={1} fill="#2a2f36" />
            <path className="worker-scan" d="M28 -56 L40 -44 L34 -42 Z" fill="#ff3b3b" opacity={0} />
          </g>
        </g>
      )}
    </g>
  )
}
